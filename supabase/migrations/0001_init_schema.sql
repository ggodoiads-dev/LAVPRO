-- LAVPRO - Schema inicial (Fase 1)
-- Modelagem multi-tenant com isolamento por tenant_id (empresa).
-- Dependências: extensões uuid-ossp, pgcrypto, citext.

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- =============================================================
-- 1. Empresas (tenants) e unidades
-- =============================================================
create table if not exists public.tenants (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  slug          text not null unique,
  documento     text,
  telefone      text,
  email         citext,
  plano         text not null default 'trial'
                 check (plano in ('trial','starter','pro','enterprise')),
  status        text not null default 'ativo'
                 check (status in ('ativo','suspenso','cancelado')),
  logo_url      text,
  trial_termina_em timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.unidades (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  nome          text not null,
  endereco      text,
  telefone      text,
  horario_abertura time default '08:00',
  horario_fechamento time default '18:00',
  dias_funcionamento int[] default '{1,2,3,4,5,6}',  -- 0=Dom ... 6=Sab
  ativo         boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, nome)
);
create index if not exists idx_unidades_tenant on public.unidades(tenant_id);

-- =============================================================
-- 2. Profiles (usuários x empresa x perfil de acesso)
-- =============================================================
-- Vinculado ao auth.users do Supabase.
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  nome          text not null,
  avatar_url    text,
  email         citext,
  telefone      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.memberships (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  perfil        text not null
                 check (perfil in ('superadmin','proprietario','gerente','recepcao','operacional','financeiro')),
  unidade_id    uuid references public.unidades(id) on delete set null,
  ativo         boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, user_id)
);
create index if not exists idx_memberships_user on public.memberships(user_id);
create index if not exists idx_memberships_tenant on public.memberships(tenant_id);

-- Função utilitária: retorna os tenants aos quais o usuário tem acesso.
create or replace function public.current_user_tenants()
returns setof uuid
language sql security definer stable
set search_path = public
as $$
  select tenant_id
    from public.memberships
   where user_id = auth.uid() and ativo = true;
$$;

-- Função utilitária: retorna o perfil do usuário em um tenant específico.
create or replace function public.current_user_perfil(p_tenant uuid)
returns text
language sql security definer stable
set search_path = public
as $$
  select perfil
    from public.memberships
   where user_id = auth.uid() and tenant_id = p_tenant and ativo = true
   limit 1;
$$;

-- =============================================================
-- 3. Clientes e veículos
-- =============================================================
create table if not exists public.clientes (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  nome          text not null,
  documento     text,          -- CPF/CNPJ (apenas dígitos)
  telefone      text,
  whatsapp      text,
  email         citext,
  endereco      text,
  nascimento    date,
  observacoes   text,
  preferencias  jsonb not null default '{}'::jsonb,
  consent_marketing boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_clientes_tenant on public.clientes(tenant_id);
create index if not exists idx_clientes_nome on public.clientes(tenant_id, lower(nome));
create index if not exists idx_clientes_documento on public.clientes(tenant_id, documento);
create index if not exists idx_clientes_telefone on public.clientes(tenant_id, telefone);

create table if not exists public.veiculos (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  cliente_id    uuid not null references public.clientes(id) on delete cascade,
  placa         text not null,
  marca         text,
  modelo        text,
  versao        text,
  ano           int,
  cor           text,
  categoria     text not null default 'hatch'
                 check (categoria in ('moto','hatch','sedan','suv','picape','caminhonete','van','outro')),
  quilometragem int,
  observacoes   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, placa)
);
create index if not exists idx_veiculos_tenant on public.veiculos(tenant_id);
create index if not exists idx_veiculos_cliente on public.veiculos(cliente_id);

-- =============================================================
-- 4. Catálogo de serviços e boxes
-- =============================================================
create table if not exists public.boxes (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  unidade_id    uuid not null references public.unidades(id) on delete cascade,
  nome          text not null,
  descricao     text,
  ativo         boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (tenant_id, unidade_id, nome)
);
create index if not exists idx_boxes_tenant on public.boxes(tenant_id);

create table if not exists public.servicos (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  nome          text not null,
  categoria     text,
  descricao     text,
  preco_base    numeric(12,2) not null default 0 check (preco_base >= 0),
  custo_estimado numeric(12,2) not null default 0 check (custo_estimado >= 0),
  duracao_min   int not null default 60 check (duracao_min > 0),
  funcionarios_min int not null default 1 check (funcionarios_min >= 1),
  comissao_percentual numeric(5,2) not null default 0
                 check (comissao_percentual between 0 and 100),
  ativo         boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, nome)
);
create index if not exists idx_servicos_tenant on public.servicos(tenant_id);

-- Tabela de preços por categoria de veículo (opcional).
create table if not exists public.servico_precos (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  servico_id    uuid not null references public.servicos(id) on delete cascade,
  categoria     text not null,
  preco         numeric(12,2) not null check (preco >= 0),
  unique (servico_id, categoria)
);
create index if not exists idx_servico_precos_tenant on public.servico_precos(tenant_id);

-- =============================================================
-- 5. Funcionários (operacional)
-- =============================================================
-- Nem todo funcionário é usuário do sistema. Guardamos ambos os cenários.
create table if not exists public.funcionarios (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  unidade_id    uuid references public.unidades(id) on delete set null,
  user_id       uuid references public.profiles(id) on delete set null,
  nome          text not null,
  cargo         text,
  vinculo       text default 'clt'
                 check (vinculo in ('clt','pj','diarista','terceiro','outro')),
  admissao      date,
  comissao_padrao numeric(5,2) not null default 0
                 check (comissao_padrao between 0 and 100),
  ativo         boolean not null default true,
  observacoes   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_funcionarios_tenant on public.funcionarios(tenant_id);

-- =============================================================
-- 6. Agendamentos
-- =============================================================
create table if not exists public.agendamentos (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  unidade_id    uuid not null references public.unidades(id) on delete cascade,
  cliente_id    uuid not null references public.clientes(id) on delete restrict,
  veiculo_id    uuid not null references public.veiculos(id) on delete restrict,
  box_id        uuid references public.boxes(id) on delete set null,
  funcionario_id uuid references public.funcionarios(id) on delete set null,
  inicio        timestamptz not null,
  fim           timestamptz not null,
  status        text not null default 'confirmado'
                 check (status in ('pendente','confirmado','cancelado','faltou','concluido')),
  observacoes   text,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint ck_agendamentos_periodo check (fim > inicio)
);
create index if not exists idx_agendamentos_tenant on public.agendamentos(tenant_id);
create index if not exists idx_agendamentos_inicio on public.agendamentos(tenant_id, inicio);
create index if not exists idx_agendamentos_box on public.agendamentos(box_id, inicio);

create table if not exists public.agendamento_servicos (
  id            uuid primary key default gen_random_uuid(),
  agendamento_id uuid not null references public.agendamentos(id) on delete cascade,
  servico_id    uuid not null references public.servicos(id) on delete restrict,
  preco         numeric(12,2) not null check (preco >= 0),
  duracao_min   int not null check (duracao_min > 0)
);
create index if not exists idx_ag_servicos_agendamento on public.agendamento_servicos(agendamento_id);

-- =============================================================
-- 7. Ordens de serviço (OS)
-- =============================================================
create table if not exists public.ordens_servico (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  unidade_id    uuid not null references public.unidades(id) on delete cascade,
  numero        bigint not null,              -- sequencial por tenant
  cliente_id    uuid not null references public.clientes(id) on delete restrict,
  veiculo_id    uuid not null references public.veiculos(id) on delete restrict,
  box_id        uuid references public.boxes(id) on delete set null,
  agendamento_id uuid references public.agendamentos(id) on delete set null,
  status        text not null default 'recebido'
                 check (status in ('agendado','recebido','aguardando','em_execucao','inspecao','pronto','entregue','cancelado','suspenso')),
  aberta_em     timestamptz not null default now(),
  inicio_execucao timestamptz,
  fim_execucao  timestamptz,
  prevista_em   timestamptz,
  entregue_em   timestamptz,
  motivo_suspensao text,
  subtotal      numeric(12,2) not null default 0,
  desconto      numeric(12,2) not null default 0 check (desconto >= 0),
  total         numeric(12,2) not null default 0,
  checklist     jsonb not null default '{}'::jsonb,
  observacoes   text,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, numero)
);
create index if not exists idx_os_tenant on public.ordens_servico(tenant_id);
create index if not exists idx_os_status on public.ordens_servico(tenant_id, status);
create index if not exists idx_os_veiculo on public.ordens_servico(veiculo_id);

-- Itens: serviços dentro de uma OS.
create table if not exists public.ordem_itens (
  id            uuid primary key default gen_random_uuid(),
  ordem_id      uuid not null references public.ordens_servico(id) on delete cascade,
  servico_id    uuid not null references public.servicos(id) on delete restrict,
  descricao     text,
  quantidade    int not null default 1 check (quantidade > 0),
  preco_unit    numeric(12,2) not null check (preco_unit >= 0),
  comissao_percentual numeric(5,2) not null default 0,
  total         numeric(12,2) generated always as (quantidade * preco_unit) stored
);
create index if not exists idx_ordem_itens_ordem on public.ordem_itens(ordem_id);

-- Funcionários atribuídos a uma OS (vários permitidos).
create table if not exists public.ordem_funcionarios (
  id            uuid primary key default gen_random_uuid(),
  ordem_id      uuid not null references public.ordens_servico(id) on delete cascade,
  funcionario_id uuid not null references public.funcionarios(id) on delete restrict,
  participacao  numeric(5,2) not null default 100
                 check (participacao > 0 and participacao <= 100),
  unique (ordem_id, funcionario_id)
);

-- Histórico de status (auditoria do fluxo Kanban).
create table if not exists public.ordem_historico (
  id            uuid primary key default gen_random_uuid(),
  ordem_id      uuid not null references public.ordens_servico(id) on delete cascade,
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  de_status     text,
  para_status   text not null,
  motivo        text,
  por_user_id   uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists idx_ordem_hist_ordem on public.ordem_historico(ordem_id);

-- =============================================================
-- 8. Sequência de numeração de OS por tenant
-- =============================================================
create table if not exists public.ordem_sequencias (
  tenant_id     uuid primary key references public.tenants(id) on delete cascade,
  proximo_numero bigint not null default 1
);

create or replace function public.next_ordem_numero(p_tenant uuid)
returns bigint
language plpgsql security definer
set search_path = public
as $$
declare
  v_numero bigint;
begin
  insert into public.ordem_sequencias (tenant_id, proximo_numero)
    values (p_tenant, 1)
    on conflict (tenant_id) do nothing;

  update public.ordem_sequencias
     set proximo_numero = proximo_numero + 1
   where tenant_id = p_tenant
  returning proximo_numero - 1 into v_numero;

  return v_numero;
end;
$$;

-- =============================================================
-- 9. Triggers utilitárias
-- =============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  for t in
    select unnest(array[
      'tenants','unidades','profiles','memberships','clientes','veiculos',
      'servicos','funcionarios','agendamentos','ordens_servico'
    ])
  loop
    execute format('drop trigger if exists trg_set_updated_at on public.%I;', t);
    execute format(
      'create trigger trg_set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- Trigger: histórico de status da OS.
create or replace function public.log_ordem_status()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into public.ordem_historico(ordem_id, tenant_id, de_status, para_status, por_user_id)
      values (new.id, new.tenant_id, null, new.status, auth.uid());
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.ordem_historico(ordem_id, tenant_id, de_status, para_status, por_user_id)
      values (new.id, new.tenant_id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_ordem_status on public.ordens_servico;
create trigger trg_log_ordem_status
  after insert or update of status on public.ordens_servico
  for each row execute function public.log_ordem_status();
