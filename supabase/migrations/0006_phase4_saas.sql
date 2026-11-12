-- LAVPRO - Fase 4: Plataforma SaaS
-- Catálogo de planos, limites, assinaturas por tenant, invoices (cobranças
-- recorrentes) e webhook_events (idempotência da integração com gateway).
-- Todas as mutações sensíveis acontecem no banco; nenhum fluxo marca
-- assinatura como ativa a partir do frontend.

-- =============================================================
-- 1. Planos e limites
-- =============================================================
create table if not exists public.planos (
  id            uuid primary key default gen_random_uuid(),
  codigo        text not null unique,        -- trial, starter, pro, enterprise
  nome          text not null,
  preco_mensal  numeric(12,2) not null default 0,
  trial_dias    int not null default 0,
  descricao     text,
  ativo         boolean not null default true,
  ordem         int not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.plano_limites (
  plano_id         uuid primary key references public.planos(id) on delete cascade,
  max_unidades     int not null default 1,
  max_usuarios     int not null default 3,
  max_veiculos_mes int not null default 0,   -- 0 = ilimitado
  funcionalidades  jsonb not null default '{}'::jsonb,
  updated_at       timestamptz not null default now()
);

-- Seed dos planos padrão (compatível com a landing).
insert into public.planos (codigo, nome, preco_mensal, trial_dias, descricao, ordem) values
  ('trial',      'Trial',      0,     14, 'Teste gratuito',                    0),
  ('starter',    'Starter',    149,   14, 'Para lava-rápidos independentes',   1),
  ('pro',        'Pro',        349,   14, 'Para operações com equipe fixa',    2),
  ('enterprise', 'Enterprise', 0,     14, 'Multi-unidade com customizações',   3)
  on conflict (codigo) do nothing;

insert into public.plano_limites (plano_id, max_unidades, max_usuarios, max_veiculos_mes, funcionalidades)
select p.id,
       case p.codigo when 'starter' then 1 when 'pro' then 2 when 'enterprise' then 999 else 1 end,
       case p.codigo when 'starter' then 3 when 'pro' then 999 when 'enterprise' then 999 else 3 end,
       case p.codigo when 'starter' then 500 when 'pro' then 3000 when 'enterprise' then 0 else 100 end,
       jsonb_build_object(
         'kanban', true,
         'estoque', p.codigo <> 'trial',
         'financeiro', p.codigo in ('pro','enterprise'),
         'pacotes', p.codigo in ('pro','enterprise'),
         'portal_publico', p.codigo in ('pro','enterprise'),
         'comissoes', p.codigo <> 'trial',
         'bi', p.codigo = 'enterprise',
         'sso', p.codigo = 'enterprise'
       )
  from public.planos p
  on conflict (plano_id) do nothing;

-- =============================================================
-- 2. Assinaturas
-- =============================================================
-- Status refletem o ciclo de vida típico de um SaaS. A fonte da verdade
-- para "está ativa" é esta tabela (combinada com invoices pagas).
create table if not exists public.assinaturas (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null unique references public.tenants(id) on delete cascade,
  plano_id        uuid not null references public.planos(id) on delete restrict,
  status          text not null default 'trial'
                   check (status in ('trial','ativa','inadimplente','pausada','cancelada','expirada')),
  trial_expira_em date,
  periodo_inicio  date not null default current_date,
  periodo_fim     date not null default (current_date + interval '30 days')::date,
  proxima_cobranca date,
  cancelada_em    timestamptz,
  motivo_cancelamento text,
  gateway         text,         -- "stripe", "pagarme", "asaas", null
  gateway_subscription_id text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_assin_status on public.assinaturas(status);
create index if not exists idx_assin_tenant on public.assinaturas(tenant_id);

-- Eventos de assinatura: tudo que muda o ciclo aparece aqui (append-only).
create table if not exists public.assinatura_eventos (
  id             uuid primary key default gen_random_uuid(),
  assinatura_id  uuid not null references public.assinaturas(id) on delete cascade,
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  tipo           text not null check (tipo in (
                   'criada','iniciou_trial','trial_expirou',
                   'ativada','renovada','pagamento_falhou',
                   'inadimplente','pausada','cancelada','plano_alterado'
                 )),
  de_plano_id    uuid references public.planos(id),
  para_plano_id  uuid references public.planos(id),
  detalhes       jsonb not null default '{}'::jsonb,
  por_user_id    uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_evt_tenant on public.assinatura_eventos(tenant_id, created_at desc);

-- =============================================================
-- 3. Invoices (cobranças recorrentes)
-- =============================================================
create table if not exists public.invoices (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  assinatura_id uuid not null references public.assinaturas(id) on delete cascade,
  numero        text not null,
  competencia   date not null,       -- mês de referência
  vencimento    date not null,
  valor         numeric(12,2) not null,
  status        text not null default 'aberta'
                 check (status in ('aberta','paga','atrasada','cancelada','estornada')),
  pago_em       timestamptz,
  gateway       text,
  gateway_invoice_id text,
  gateway_fatura_url text,
  created_at    timestamptz not null default now(),
  unique (tenant_id, numero)
);
create index if not exists idx_inv_status on public.invoices(status);
create index if not exists idx_inv_venc on public.invoices(tenant_id, vencimento);

-- =============================================================
-- 4. Webhooks (idempotência)
-- =============================================================
-- Cada webhook recebido do gateway é persistido com a sua event_id
-- original. O endpoint só processa quando o INSERT com conflict (event_id)
-- é novo. Isso garante idempotência mesmo com re-entregas.
create table if not exists public.webhook_events (
  id          uuid primary key default gen_random_uuid(),
  gateway     text not null,
  event_id    text not null,            -- id do evento no gateway
  event_type  text not null,
  payload     jsonb not null,
  processed_at timestamptz,
  erro        text,
  created_at  timestamptz not null default now(),
  unique (gateway, event_id)
);
create index if not exists idx_wh_processed on public.webhook_events(processed_at);

-- =============================================================
-- 5. Perfil superadmin: policies que liberam leitura total das
--    tabelas do SaaS para quem tem membership com perfil = superadmin
--    em QUALQUER tenant. É a convenção adotada no app.
-- =============================================================
create or replace function public.is_superadmin()
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
     where m.user_id = auth.uid()
       and m.perfil = 'superadmin'
       and m.ativo = true
  );
$$;

alter table public.planos              enable row level security;
alter table public.plano_limites       enable row level security;
alter table public.assinaturas         enable row level security;
alter table public.assinatura_eventos  enable row level security;
alter table public.invoices            enable row level security;
alter table public.webhook_events      enable row level security;

-- planos e limites são públicos para leitura (necessário na landing).
drop policy if exists planos_read on public.planos;
create policy planos_read on public.planos
  for select using (true);

drop policy if exists planos_admin on public.planos;
create policy planos_admin on public.planos
  for all using (public.is_superadmin())
         with check (public.is_superadmin());

drop policy if exists limites_read on public.plano_limites;
create policy limites_read on public.plano_limites
  for select using (true);

drop policy if exists limites_admin on public.plano_limites;
create policy limites_admin on public.plano_limites
  for all using (public.is_superadmin())
         with check (public.is_superadmin());

-- Assinaturas: a empresa vê a dela; superadmin vê tudo.
drop policy if exists assin_self on public.assinaturas;
create policy assin_self on public.assinaturas
  for select using (
    tenant_id in (select public.current_user_tenants())
    or public.is_superadmin()
  );
drop policy if exists assin_admin_write on public.assinaturas;
create policy assin_admin_write on public.assinaturas
  for all using (public.is_superadmin())
         with check (public.is_superadmin());

drop policy if exists evt_read on public.assinatura_eventos;
create policy evt_read on public.assinatura_eventos
  for select using (
    tenant_id in (select public.current_user_tenants())
    or public.is_superadmin()
  );

drop policy if exists inv_read on public.invoices;
create policy inv_read on public.invoices
  for select using (
    tenant_id in (select public.current_user_tenants())
    or public.is_superadmin()
  );
drop policy if exists inv_admin on public.invoices;
create policy inv_admin on public.invoices
  for all using (public.is_superadmin())
         with check (public.is_superadmin());

-- webhook_events é acessado apenas por service_role; nenhuma policy RLS.
revoke all on public.webhook_events from anon, authenticated;

-- =============================================================
-- 6. provision_tenant agora cria a assinatura trial corretamente.
-- =============================================================
create or replace function public.provision_tenant(
  p_nome      text,
  p_slug      text
) returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_unidade_id uuid;
  v_user_id uuid := auth.uid();
  v_plano_trial uuid;
begin
  if v_user_id is null then
    raise exception 'autenticação necessária';
  end if;

  insert into public.tenants (nome, slug, plano, status, trial_termina_em)
    values (p_nome, p_slug, 'trial', 'ativo', now() + interval '14 days')
    returning id into v_tenant_id;

  insert into public.unidades (tenant_id, nome)
    values (v_tenant_id, 'Matriz')
    returning id into v_unidade_id;

  insert into public.boxes (tenant_id, unidade_id, nome) values
    (v_tenant_id, v_unidade_id, 'Box 1'),
    (v_tenant_id, v_unidade_id, 'Box 2'),
    (v_tenant_id, v_unidade_id, 'Box 3');

  insert into public.servicos
    (tenant_id, nome, categoria, descricao, preco_base, custo_estimado,
     duracao_min, comissao_percentual) values
    (v_tenant_id, 'Lavagem Simples', 'Lavagem',  'Lavagem externa com shampoo neutro', 35, 5, 30, 20),
    (v_tenant_id, 'Lavagem Completa','Lavagem',  'Lavagem externa + aspiração + painéis', 65, 8, 50, 25),
    (v_tenant_id, 'Lavagem Técnica', 'Lavagem',  'Lavagem detalhada com descontaminação leve', 120, 15, 90, 25),
    (v_tenant_id, 'Higienização Interna','Estética','Limpeza profunda do interior', 220, 25, 180, 30),
    (v_tenant_id, 'Polimento Comercial','Estética','Polimento de uma etapa', 350, 40, 240, 30),
    (v_tenant_id, 'Vitrificação',    'Estética',  'Aplicação de coating com proteção', 950, 90, 480, 25);

  insert into public.categorias_financeiras (tenant_id, nome, tipo, dre_grupo) values
    (v_tenant_id, 'Receita de Serviços',  'receita', 'receita_bruta'),
    (v_tenant_id, 'Descontos Concedidos', 'despesa', 'deducoes'),
    (v_tenant_id, 'Insumos / Produtos',   'despesa', 'custo_servicos'),
    (v_tenant_id, 'Salários',             'despesa', 'despesa_pessoal'),
    (v_tenant_id, 'Comissões',            'despesa', 'despesa_pessoal'),
    (v_tenant_id, 'Aluguel',              'despesa', 'despesa_operacional'),
    (v_tenant_id, 'Energia Elétrica',     'despesa', 'despesa_operacional'),
    (v_tenant_id, 'Água',                 'despesa', 'despesa_operacional'),
    (v_tenant_id, 'Internet / Telefonia', 'despesa', 'despesa_administrativa'),
    (v_tenant_id, 'Marketing',            'despesa', 'despesa_marketing'),
    (v_tenant_id, 'Taxas de cartão',      'despesa', 'despesa_financeira');

  insert into public.formas_pagamento (tenant_id, nome, taxa_percentual) values
    (v_tenant_id, 'Dinheiro',       0.00),
    (v_tenant_id, 'Pix',            0.00),
    (v_tenant_id, 'Cartão Débito',  1.80),
    (v_tenant_id, 'Cartão Crédito', 3.50),
    (v_tenant_id, 'Transferência',  0.00);

  insert into public.memberships (tenant_id, user_id, perfil)
    values (v_tenant_id, v_user_id, 'proprietario')
    on conflict (tenant_id, user_id) do update set perfil = excluded.perfil;

  -- Cria assinatura em trial com o plano trial
  select id into v_plano_trial from public.planos where codigo = 'trial';
  if v_plano_trial is not null then
    insert into public.assinaturas
      (tenant_id, plano_id, status, trial_expira_em)
    values
      (v_tenant_id, v_plano_trial, 'trial', (now() + interval '14 days')::date);

    insert into public.assinatura_eventos
      (assinatura_id, tenant_id, tipo, para_plano_id, por_user_id)
    select id, v_tenant_id, 'iniciou_trial', v_plano_trial, v_user_id
      from public.assinaturas where tenant_id = v_tenant_id;
  end if;

  return v_tenant_id;
end;
$$;

-- =============================================================
-- 7. Transições de assinatura (chamadas pelo webhook / admin)
-- =============================================================
create or replace function public.ativar_assinatura(
  p_tenant uuid,
  p_plano_codigo text,
  p_gateway text default null,
  p_subscription_id text default null
) returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_plano_id uuid;
  v_assin_id uuid;
begin
  select id into v_plano_id from public.planos where codigo = p_plano_codigo;
  if v_plano_id is null then
    raise exception 'Plano % não encontrado', p_plano_codigo;
  end if;

  insert into public.assinaturas
    (tenant_id, plano_id, status, trial_expira_em, periodo_inicio, periodo_fim,
     proxima_cobranca, gateway, gateway_subscription_id)
  values
    (p_tenant, v_plano_id, 'ativa', null, current_date,
     (current_date + interval '30 days')::date,
     (current_date + interval '30 days')::date,
     p_gateway, p_subscription_id)
  on conflict (tenant_id) do update set
    plano_id = excluded.plano_id,
    status = 'ativa',
    periodo_inicio = current_date,
    periodo_fim = (current_date + interval '30 days')::date,
    proxima_cobranca = (current_date + interval '30 days')::date,
    gateway = coalesce(excluded.gateway, assinaturas.gateway),
    gateway_subscription_id = coalesce(excluded.gateway_subscription_id, assinaturas.gateway_subscription_id),
    updated_at = now()
  returning id into v_assin_id;

  update public.tenants set plano = p_plano_codigo, status = 'ativo', updated_at = now()
   where id = p_tenant;

  insert into public.assinatura_eventos
    (assinatura_id, tenant_id, tipo, para_plano_id, detalhes)
  values
    (v_assin_id, p_tenant, 'ativada', v_plano_id,
     jsonb_build_object('gateway', p_gateway, 'subscription_id', p_subscription_id));
end;
$$;

create or replace function public.marcar_assinatura_inadimplente(
  p_tenant uuid,
  p_motivo text default null
) returns void
language plpgsql security definer
set search_path = public
as $$
declare v_id uuid;
begin
  update public.assinaturas set status='inadimplente', updated_at=now()
    where tenant_id = p_tenant returning id into v_id;
  if v_id is not null then
    insert into public.assinatura_eventos (assinatura_id, tenant_id, tipo, detalhes)
      values (v_id, p_tenant, 'inadimplente', jsonb_build_object('motivo', p_motivo));
  end if;
end;
$$;

create or replace function public.cancelar_assinatura(
  p_tenant uuid,
  p_motivo text default null
) returns void
language plpgsql security definer
set search_path = public
as $$
declare v_id uuid;
begin
  update public.assinaturas
     set status='cancelada', cancelada_em=now(),
         motivo_cancelamento=p_motivo, updated_at=now()
   where tenant_id = p_tenant returning id into v_id;
  update public.tenants set status='cancelado', updated_at=now()
   where id = p_tenant;
  if v_id is not null then
    insert into public.assinatura_eventos (assinatura_id, tenant_id, tipo, detalhes)
      values (v_id, p_tenant, 'cancelada', jsonb_build_object('motivo', p_motivo));
  end if;
end;
$$;

-- =============================================================
-- 8. Métricas SaaS
-- =============================================================
create or replace view public.v_saas_metricas as
with ativas as (
  select a.plano_id, count(*) as qtd
    from public.assinaturas a where a.status = 'ativa'
    group by a.plano_id
)
select
  (select count(*) from public.tenants where status = 'ativo')                    as empresas_ativas,
  (select count(*) from public.assinaturas where status = 'trial')                as em_trial,
  (select count(*) from public.assinaturas where status = 'ativa')                as assinantes_ativos,
  (select count(*) from public.assinaturas where status = 'inadimplente')         as inadimplentes,
  (select count(*) from public.assinaturas where status = 'cancelada')            as cancelamentos,
  (select coalesce(sum(p.preco_mensal * a.qtd), 0) from ativas a join public.planos p on p.id = a.plano_id) as mrr,
  12 * (select coalesce(sum(p.preco_mensal * a.qtd), 0) from ativas a join public.planos p on p.id = a.plano_id) as arr;
