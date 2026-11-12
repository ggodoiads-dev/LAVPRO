-- LAVPRO - Fase 3: Expansão comercial
-- Pacotes/assinaturas de serviço, programa de pontos, notificações,
-- avaliações, portal público. Também encerra pendências da Fase 2:
-- baixa automática de estoque a partir da ficha técnica e RPC de custo
-- real da OS para o DRE.

-- =============================================================
-- 1. Pacotes (vouchers / combos pré-pagos)
-- =============================================================
create table if not exists public.pacotes (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  nome          text not null,
  descricao     text,
  preco         numeric(12,2) not null check (preco >= 0),
  validade_dias int not null default 90 check (validade_dias > 0),
  ativo         boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, nome)
);
create index if not exists idx_pacotes_tenant on public.pacotes(tenant_id);

-- Itens: quantos créditos de cada serviço o pacote concede.
create table if not exists public.pacote_itens (
  id         uuid primary key default gen_random_uuid(),
  pacote_id  uuid not null references public.pacotes(id) on delete cascade,
  servico_id uuid not null references public.servicos(id) on delete restrict,
  quantidade int not null check (quantidade > 0),
  unique (pacote_id, servico_id)
);

-- Compra de um pacote por um cliente. Saldo é por item.
create table if not exists public.cliente_pacotes (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  cliente_id     uuid not null references public.clientes(id) on delete restrict,
  pacote_id      uuid not null references public.pacotes(id) on delete restrict,
  comprado_em    timestamptz not null default now(),
  expira_em      date,
  valor_pago     numeric(12,2) not null default 0,
  ativo          boolean not null default true,
  observacoes    text,
  created_by     uuid references public.profiles(id) on delete set null
);
create index if not exists idx_cp_tenant_cliente on public.cliente_pacotes(tenant_id, cliente_id);

-- Saldo por serviço dentro do pacote comprado.
create table if not exists public.cliente_pacote_saldos (
  id                   uuid primary key default gen_random_uuid(),
  cliente_pacote_id    uuid not null references public.cliente_pacotes(id) on delete cascade,
  servico_id           uuid not null references public.servicos(id) on delete restrict,
  saldo                int not null check (saldo >= 0),
  unique (cliente_pacote_id, servico_id)
);

-- Consumo: cada baixa referencia uma OS.
create table if not exists public.cliente_pacote_consumos (
  id                 uuid primary key default gen_random_uuid(),
  cliente_pacote_id  uuid not null references public.cliente_pacotes(id) on delete cascade,
  ordem_id           uuid not null references public.ordens_servico(id) on delete cascade,
  servico_id         uuid not null references public.servicos(id) on delete restrict,
  quantidade         int not null default 1 check (quantidade > 0),
  usado_em           timestamptz not null default now()
);
create index if not exists idx_cpc_ordem on public.cliente_pacote_consumos(ordem_id);

-- RPC: vender pacote a cliente (atomicamente cria pacote_cliente + saldos
-- a partir dos itens).
create or replace function public.vender_pacote(
  p_cliente uuid,
  p_pacote uuid,
  p_valor numeric default null,
  p_observacoes text default null
) returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_dias int;
  v_cp_id uuid;
  v_valor numeric;
begin
  select tenant_id, validade_dias, preco into v_tenant, v_dias, v_valor
    from public.pacotes where id = p_pacote;
  if v_tenant is null then
    raise exception 'Pacote não encontrado';
  end if;

  insert into public.cliente_pacotes
    (tenant_id, cliente_id, pacote_id, expira_em, valor_pago, observacoes, created_by)
  values
    (v_tenant, p_cliente, p_pacote, (now() + make_interval(days => v_dias))::date,
     coalesce(p_valor, v_valor), p_observacoes, auth.uid())
  returning id into v_cp_id;

  insert into public.cliente_pacote_saldos (cliente_pacote_id, servico_id, saldo)
    select v_cp_id, servico_id, quantidade
      from public.pacote_itens
     where pacote_id = p_pacote;

  return v_cp_id;
end;
$$;

-- =============================================================
-- 2. Programa de pontos
-- =============================================================
create table if not exists public.pontos_regras (
  tenant_id            uuid primary key references public.tenants(id) on delete cascade,
  pontos_por_real      numeric(6,3) not null default 1.000,     -- 1 ponto por real
  reais_por_ponto      numeric(6,3) not null default 0.050,     -- vale R$ 0,05
  min_resgate_pontos   int not null default 200,
  ativo                boolean not null default false
);

create table if not exists public.pontos_movimentos (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  cliente_id    uuid not null references public.clientes(id) on delete cascade,
  tipo          text not null check (tipo in ('acumulo','resgate','ajuste','expiracao')),
  pontos        int not null,                 -- positivo p/ acúmulo, negativo p/ resgate
  ordem_id      uuid references public.ordens_servico(id) on delete set null,
  motivo        text,
  criado_em     timestamptz not null default now()
);
create index if not exists idx_pm_tenant_cliente on public.pontos_movimentos(tenant_id, cliente_id);

-- Trigger: ao entregar a OS, acumula pontos para o cliente (se regra ativa).
create or replace function public.on_ordem_entregue_pontos()
returns trigger language plpgsql as $$
declare
  v_regra public.pontos_regras%rowtype;
  v_pontos int;
begin
  if new.status = 'entregue' and (old.status is distinct from 'entregue') then
    select * into v_regra from public.pontos_regras where tenant_id = new.tenant_id;
    if v_regra.ativo then
      v_pontos := floor(coalesce(new.total,0) * v_regra.pontos_por_real)::int;
      if v_pontos > 0 then
        insert into public.pontos_movimentos
          (tenant_id, cliente_id, tipo, pontos, ordem_id, motivo)
        values
          (new.tenant_id, new.cliente_id, 'acumulo', v_pontos, new.id,
           'Acúmulo OS #' || new.numero);
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_on_ordem_entregue_pontos on public.ordens_servico;
create trigger trg_on_ordem_entregue_pontos
  after update of status on public.ordens_servico
  for each row execute function public.on_ordem_entregue_pontos();

-- View: saldo atual por cliente.
create or replace view public.v_pontos_saldo as
  select
    tenant_id,
    cliente_id,
    sum(pontos)::int as saldo
    from public.pontos_movimentos
  group by tenant_id, cliente_id;

-- =============================================================
-- 3. Notificações (infraestrutura; integração externa é stub)
-- =============================================================
create table if not exists public.notificacoes_templates (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  codigo      text not null,     -- ex.: agendamento_confirmado, veiculo_pronto
  canal       text not null check (canal in ('whatsapp','sms','email','push','console')),
  assunto     text,
  corpo       text not null,
  ativo       boolean not null default true,
  unique (tenant_id, codigo, canal)
);

create table if not exists public.notificacoes (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  cliente_id     uuid references public.clientes(id) on delete set null,
  ordem_id       uuid references public.ordens_servico(id) on delete set null,
  template_codigo text,
  canal          text not null check (canal in ('whatsapp','sms','email','push','console')),
  destinatario   text not null,
  assunto        text,
  corpo          text not null,
  status         text not null default 'pendente'
                   check (status in ('pendente','enviada','erro','cancelada')),
  erro           text,
  agendada_para  timestamptz,
  enviada_em     timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists idx_notif_tenant on public.notificacoes(tenant_id);
create index if not exists idx_notif_status on public.notificacoes(tenant_id, status);

-- =============================================================
-- 4. Avaliações (NPS simplificado)
-- =============================================================
create table if not exists public.avaliacoes (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  ordem_id    uuid not null references public.ordens_servico(id) on delete cascade,
  cliente_id  uuid references public.clientes(id) on delete set null,
  nota        int not null check (nota between 0 and 10),
  comentario  text,
  publicada   boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (ordem_id)
);
create index if not exists idx_av_tenant on public.avaliacoes(tenant_id);

-- =============================================================
-- 5. Portal público / agendamento online
-- =============================================================
-- Função usada pela página pública /book/[slug]. Lê somente informações
-- públicas do tenant e cria agendamento com status "pendente".
create or replace function public.criar_agendamento_publico(
  p_slug         text,
  p_nome         text,
  p_telefone     text,
  p_email        text,
  p_placa        text,
  p_marca        text,
  p_modelo       text,
  p_categoria    text,
  p_inicio       timestamptz,
  p_servico_ids  uuid[],
  p_observacoes  text default null
) returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_unidade uuid;
  v_cliente uuid;
  v_veiculo uuid;
  v_fim timestamptz;
  v_duracao int := 0;
  v_ag uuid;
  s uuid;
begin
  select id into v_tenant from public.tenants where slug = p_slug and status = 'ativo';
  if v_tenant is null then
    raise exception 'Estabelecimento não encontrado';
  end if;
  select id into v_unidade from public.unidades
    where tenant_id = v_tenant and ativo = true order by nome limit 1;

  -- cliente por telefone
  select id into v_cliente from public.clientes
    where tenant_id = v_tenant and (telefone = p_telefone or whatsapp = p_telefone)
    limit 1;
  if v_cliente is null then
    insert into public.clientes (tenant_id, nome, telefone, whatsapp, email)
      values (v_tenant, p_nome, p_telefone, p_telefone, nullif(p_email,''))
      returning id into v_cliente;
  end if;

  -- veículo por placa
  select id into v_veiculo from public.veiculos
    where tenant_id = v_tenant and placa = upper(regexp_replace(p_placa, '[^A-Za-z0-9]','','g'))
    limit 1;
  if v_veiculo is null then
    insert into public.veiculos
      (tenant_id, cliente_id, placa, marca, modelo, categoria)
      values (v_tenant, v_cliente,
              upper(regexp_replace(p_placa, '[^A-Za-z0-9]','','g')),
              p_marca, p_modelo, coalesce(p_categoria,'hatch'))
      returning id into v_veiculo;
  end if;

  select coalesce(sum(duracao_min),60) into v_duracao
    from public.servicos
   where tenant_id = v_tenant and id = any(p_servico_ids);
  v_fim := p_inicio + make_interval(mins => v_duracao);

  insert into public.agendamentos
    (tenant_id, unidade_id, cliente_id, veiculo_id,
     inicio, fim, status, observacoes)
  values
    (v_tenant, v_unidade, v_cliente, v_veiculo,
     p_inicio, v_fim, 'pendente',
     coalesce(p_observacoes,'Agendamento via portal público'))
  returning id into v_ag;

  foreach s in array p_servico_ids loop
    insert into public.agendamento_servicos (agendamento_id, servico_id, preco, duracao_min)
      select v_ag, s2.id, s2.preco_base, s2.duracao_min
        from public.servicos s2 where s2.id = s;
  end loop;

  -- Enfileira notificação (console por padrão) para a recepção.
  insert into public.notificacoes
    (tenant_id, cliente_id, canal, destinatario, assunto, corpo, status)
  values
    (v_tenant, v_cliente, 'console', 'recepcao',
     'Novo agendamento online',
     'Cliente ' || p_nome || ' agendou para ' || to_char(p_inicio at time zone 'America/Sao_Paulo','DD/MM HH24:MI'),
     'pendente');

  return v_ag;
end;
$$;

-- RPC pública para consulta do portal: busca OS/agendamentos por placa
-- + telefone (minimalista e seguro).
create or replace function public.portal_consulta(
  p_slug      text,
  p_placa     text,
  p_telefone  text
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_cliente uuid;
  v_veiculo uuid;
  v_placa text := upper(regexp_replace(p_placa, '[^A-Za-z0-9]','','g'));
  result jsonb;
begin
  select id into v_tenant from public.tenants where slug = p_slug and status = 'ativo';
  if v_tenant is null then
    return jsonb_build_object('error','estabelecimento_nao_encontrado');
  end if;
  select id into v_veiculo from public.veiculos
    where tenant_id = v_tenant and placa = v_placa;
  if v_veiculo is null then
    return jsonb_build_object('error','veiculo_nao_encontrado');
  end if;
  select c.id into v_cliente from public.clientes c
    join public.veiculos v on v.cliente_id = c.id
   where v.id = v_veiculo
     and (c.telefone = p_telefone or c.whatsapp = p_telefone);
  if v_cliente is null then
    return jsonb_build_object('error','telefone_divergente');
  end if;

  select jsonb_build_object(
    'cliente', (select row_to_json(c) from public.clientes c where c.id = v_cliente),
    'veiculos', (select coalesce(jsonb_agg(row_to_json(v)),'[]'::jsonb)
                   from public.veiculos v where v.cliente_id = v_cliente),
    'agendamentos', (select coalesce(jsonb_agg(row_to_json(a)),'[]'::jsonb)
                       from public.agendamentos a
                      where a.cliente_id = v_cliente
                      order by a.inicio desc limit 10),
    'ordens', (select coalesce(jsonb_agg(row_to_json(o)),'[]'::jsonb)
                 from public.ordens_servico o
                where o.cliente_id = v_cliente
                order by o.aberta_em desc limit 10),
    'pontos', coalesce(
      (select sum(pontos)::int from public.pontos_movimentos
        where tenant_id = v_tenant and cliente_id = v_cliente), 0)
  ) into result;
  return result;
end;
$$;

-- =============================================================
-- 6. Fecha pendências da Fase 2
-- =============================================================
-- Baixa automática de estoque a partir da ficha técnica (servico_produtos)
-- quando a OS passa para "em_execucao".
create or replace function public.on_ordem_em_execucao_estoque()
returns trigger language plpgsql as $$
begin
  if new.status = 'em_execucao' and (old.status is distinct from 'em_execucao') then
    -- Para cada produto da ficha técnica de cada item da OS, grava um
    -- movimento de saída vinculado à OS. O trigger existente em
    -- movimentos_estoque cuida do saldo.
    insert into public.movimentos_estoque
      (tenant_id, produto_id, tipo, quantidade, ordem_id, motivo)
    select
      new.tenant_id,
      sp.produto_id,
      'saida',
      sp.quantidade * oi.quantidade,
      new.id,
      'Consumo automático OS #' || new.numero
    from public.ordem_itens oi
    join public.servico_produtos sp on sp.servico_id = oi.servico_id
    where oi.ordem_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_on_ordem_em_execucao_estoque on public.ordens_servico;
create trigger trg_on_ordem_em_execucao_estoque
  after update of status on public.ordens_servico
  for each row execute function public.on_ordem_em_execucao_estoque();

-- RPC: custo real da OS (soma dos consumos lançados).
create or replace function public.custo_real_ordem(p_ordem uuid)
returns numeric
language sql security definer stable
set search_path = public
as $$
  select coalesce(sum(m.quantidade * coalesce(m.custo_unit, p.custo_medio)), 0)
    from public.movimentos_estoque m
    join public.produtos p on p.id = m.produto_id
   where m.ordem_id = p_ordem
     and m.tipo in ('saida','perda');
$$;

-- View: resumo mensal para DRE com custo real agregado.
create or replace view public.v_dre_mensal as
  select
    o.tenant_id,
    date_trunc('month', o.entregue_em)::date as mes,
    sum(p.valor)                                        as receita,
    sum(o.desconto)                                     as descontos,
    coalesce(sum(public.custo_real_ordem(o.id)), 0)     as custo_servicos,
    count(*)                                            as os_entregues
    from public.ordens_servico o
    left join public.pagamentos p on p.ordem_id = o.id
   where o.status = 'entregue' and o.entregue_em is not null
   group by o.tenant_id, date_trunc('month', o.entregue_em);

-- =============================================================
-- 7. RLS para as novas tabelas
-- =============================================================
alter table public.pacotes                   enable row level security;
alter table public.pacote_itens              enable row level security;
alter table public.cliente_pacotes           enable row level security;
alter table public.cliente_pacote_saldos     enable row level security;
alter table public.cliente_pacote_consumos   enable row level security;
alter table public.pontos_regras             enable row level security;
alter table public.pontos_movimentos         enable row level security;
alter table public.notificacoes              enable row level security;
alter table public.notificacoes_templates    enable row level security;
alter table public.avaliacoes                enable row level security;

drop policy if exists pacotes_tenant on public.pacotes;
create policy pacotes_tenant on public.pacotes
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

drop policy if exists pi_tenant on public.pacote_itens;
create policy pi_tenant on public.pacote_itens
  for all using (
    exists (
      select 1 from public.pacotes p
       where p.id = pacote_id
         and p.tenant_id in (select public.current_user_tenants())
    )
  ) with check (
    exists (
      select 1 from public.pacotes p
       where p.id = pacote_id
         and p.tenant_id in (select public.current_user_tenants())
    )
  );

drop policy if exists cp_pack_tenant on public.cliente_pacotes;
create policy cp_pack_tenant on public.cliente_pacotes
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

drop policy if exists cps_tenant on public.cliente_pacote_saldos;
create policy cps_tenant on public.cliente_pacote_saldos
  for all using (
    exists (
      select 1 from public.cliente_pacotes cp
       where cp.id = cliente_pacote_id
         and cp.tenant_id in (select public.current_user_tenants())
    )
  ) with check (
    exists (
      select 1 from public.cliente_pacotes cp
       where cp.id = cliente_pacote_id
         and cp.tenant_id in (select public.current_user_tenants())
    )
  );

drop policy if exists cpc_tenant on public.cliente_pacote_consumos;
create policy cpc_tenant on public.cliente_pacote_consumos
  for all using (
    exists (
      select 1 from public.cliente_pacotes cp
       where cp.id = cliente_pacote_id
         and cp.tenant_id in (select public.current_user_tenants())
    )
  ) with check (
    exists (
      select 1 from public.cliente_pacotes cp
       where cp.id = cliente_pacote_id
         and cp.tenant_id in (select public.current_user_tenants())
    )
  );

drop policy if exists pr_tenant on public.pontos_regras;
create policy pr_tenant on public.pontos_regras
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

drop policy if exists pm_tenant on public.pontos_movimentos;
create policy pm_tenant on public.pontos_movimentos
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

drop policy if exists notif_tenant on public.notificacoes;
create policy notif_tenant on public.notificacoes
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

drop policy if exists nt_tenant on public.notificacoes_templates;
create policy nt_tenant on public.notificacoes_templates
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

drop policy if exists av_tenant on public.avaliacoes;
create policy av_tenant on public.avaliacoes
  for select using (tenant_id in (select public.current_user_tenants()));
