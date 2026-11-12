-- LAVPRO - Fase 2: Gestão administrativa
-- Produtos / estoque, categorias e lançamentos financeiros,
-- pagamentos de OS e vínculos de comissões.

-- =============================================================
-- 1. Estoque
-- =============================================================
create table if not exists public.produtos (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  codigo         text,
  nome           text not null,
  categoria      text,
  unidade        text not null default 'un',  -- un, L, mL, kg, g, pct
  fornecedor     text,
  custo_medio    numeric(12,4) not null default 0 check (custo_medio >= 0),
  preco_venda    numeric(12,2),
  estoque_atual  numeric(14,3) not null default 0,
  estoque_minimo numeric(14,3) not null default 0,
  local          text,
  ativo          boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (tenant_id, nome)
);
create index if not exists idx_produtos_tenant on public.produtos(tenant_id);

-- Tipos de movimento: entrada (compra/ajuste), saida (consumo OS, perda,
-- venda avulsa), inventario (ajuste absoluto).
create table if not exists public.movimentos_estoque (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  produto_id     uuid not null references public.produtos(id) on delete cascade,
  tipo           text not null check (tipo in ('entrada','saida','inventario','perda','transferencia')),
  motivo         text,
  quantidade     numeric(14,3) not null check (quantidade >= 0),
  custo_unit     numeric(12,4),
  ordem_id       uuid references public.ordens_servico(id) on delete set null,
  por_user_id    uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_mov_tenant on public.movimentos_estoque(tenant_id);
create index if not exists idx_mov_produto on public.movimentos_estoque(produto_id);
create index if not exists idx_mov_ordem on public.movimentos_estoque(ordem_id);

-- Ficha técnica: produtos consumidos por serviço.
create table if not exists public.servico_produtos (
  id             uuid primary key default gen_random_uuid(),
  servico_id     uuid not null references public.servicos(id) on delete cascade,
  produto_id     uuid not null references public.produtos(id) on delete cascade,
  quantidade     numeric(14,3) not null check (quantidade > 0),
  unique (servico_id, produto_id)
);

-- Baixa automática: trigger que recalcula estoque_atual a cada movimento.
create or replace function public.apply_estoque_movimento()
returns trigger language plpgsql as $$
declare
  v_delta numeric(14,3);
begin
  if new.tipo = 'entrada' then
    v_delta := new.quantidade;
  elsif new.tipo = 'saida' or new.tipo = 'perda' then
    v_delta := -new.quantidade;
  elsif new.tipo = 'transferencia' then
    v_delta := -new.quantidade; -- origem (destino em outra linha)
  elsif new.tipo = 'inventario' then
    -- ajuste absoluto: quantidade é o novo saldo
    update public.produtos
       set estoque_atual = new.quantidade, updated_at = now()
     where id = new.produto_id;
    return new;
  else
    v_delta := 0;
  end if;

  update public.produtos
     set estoque_atual = estoque_atual + v_delta,
         custo_medio   = case
           when new.tipo = 'entrada' and new.custo_unit is not null and new.quantidade > 0
             then ((estoque_atual * custo_medio) + (new.quantidade * new.custo_unit))
                  / nullif(estoque_atual + new.quantidade, 0)
           else custo_medio
         end,
         updated_at = now()
   where id = new.produto_id;

  return new;
end;
$$;

drop trigger if exists trg_apply_estoque on public.movimentos_estoque;
create trigger trg_apply_estoque
  after insert on public.movimentos_estoque
  for each row execute function public.apply_estoque_movimento();

-- =============================================================
-- 2. Financeiro — categorias e lançamentos
-- =============================================================
create table if not exists public.categorias_financeiras (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  nome        text not null,
  tipo        text not null check (tipo in ('receita','despesa')),
  dre_grupo   text not null check (dre_grupo in (
                'receita_bruta','deducoes','custo_servicos',
                'despesa_operacional','despesa_pessoal','despesa_administrativa',
                'despesa_marketing','despesa_financeira','tributos_lucro','outras'
              )),
  ativo       boolean not null default true,
  unique (tenant_id, nome, tipo)
);
create index if not exists idx_cat_fin_tenant on public.categorias_financeiras(tenant_id);

-- Formas de pagamento (parametrizável).
create table if not exists public.formas_pagamento (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  nome        text not null,            -- Dinheiro, Pix, Débito, Crédito, ...
  taxa_percentual numeric(5,2) not null default 0, -- custo da adquirente
  ativo       boolean not null default true,
  unique (tenant_id, nome)
);

-- Contas a pagar / a receber. "Contas a receber" surgem quando uma OS
-- não é 100% quitada; "Contas a pagar" são despesas da operação.
create table if not exists public.contas_pagar (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  categoria_id  uuid references public.categorias_financeiras(id) on delete set null,
  descricao     text not null,
  valor         numeric(12,2) not null check (valor >= 0),
  vencimento    date not null,
  pago_em       date,
  forma_id      uuid references public.formas_pagamento(id) on delete set null,
  recorrente    boolean not null default false,
  observacoes   text,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists idx_cp_tenant on public.contas_pagar(tenant_id);
create index if not exists idx_cp_vencimento on public.contas_pagar(tenant_id, vencimento);

create table if not exists public.contas_receber (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  ordem_id      uuid references public.ordens_servico(id) on delete set null,
  cliente_id    uuid references public.clientes(id) on delete set null,
  descricao     text not null,
  valor         numeric(12,2) not null check (valor >= 0),
  vencimento    date not null,
  recebido_em   date,
  forma_id      uuid references public.formas_pagamento(id) on delete set null,
  observacoes   text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_cr_tenant on public.contas_receber(tenant_id);
create index if not exists idx_cr_ordem on public.contas_receber(ordem_id);

-- Pagamentos efetivos de uma OS (uma OS pode ser pago em várias parcelas
-- e formas). O somatório dos pagamentos quita a OS.
create table if not exists public.pagamentos (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  ordem_id     uuid not null references public.ordens_servico(id) on delete cascade,
  forma_id     uuid references public.formas_pagamento(id) on delete set null,
  valor        numeric(12,2) not null check (valor > 0),
  recebido_em  timestamptz not null default now(),
  observacoes  text,
  por_user_id  uuid references public.profiles(id) on delete set null
);
create index if not exists idx_pag_tenant on public.pagamentos(tenant_id);
create index if not exists idx_pag_ordem on public.pagamentos(ordem_id);

-- =============================================================
-- 3. Comissões
-- =============================================================
-- Snapshot de comissão por item da OS e funcionário. Gerado quando a OS
-- é entregue; permite estorno.
create table if not exists public.comissoes (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  ordem_id      uuid not null references public.ordens_servico(id) on delete cascade,
  item_id       uuid references public.ordem_itens(id) on delete set null,
  funcionario_id uuid not null references public.funcionarios(id) on delete restrict,
  base          numeric(12,2) not null check (base >= 0),
  percentual    numeric(5,2)  not null check (percentual >= 0 and percentual <= 100),
  valor         numeric(12,2) not null check (valor >= 0),
  status        text not null default 'aberta'
                 check (status in ('aberta','paga','estornada')),
  pago_em       date,
  created_at    timestamptz not null default now()
);
create index if not exists idx_com_tenant on public.comissoes(tenant_id);
create index if not exists idx_com_funcionario on public.comissoes(funcionario_id);
create index if not exists idx_com_ordem on public.comissoes(ordem_id);

-- Função auxiliar: distribui comissão quando uma OS é entregue.
-- Regra: para cada item, calcula base = quantidade * preco_unit e
-- distribui participacao de cada funcionario atribuído à OS.
create or replace function public.gerar_comissoes_para_ordem(p_ordem uuid)
returns int
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_funcs int;
  v_inseridas int := 0;
begin
  select tenant_id into v_tenant
    from public.ordens_servico where id = p_ordem;
  if v_tenant is null then return 0; end if;

  select count(*) into v_funcs
    from public.ordem_funcionarios where ordem_id = p_ordem;
  if v_funcs = 0 then return 0; end if;

  -- Evita duplicatas em caso de reentrega.
  delete from public.comissoes
   where ordem_id = p_ordem and status = 'aberta';

  insert into public.comissoes
    (tenant_id, ordem_id, item_id, funcionario_id, base, percentual, valor)
  select
    v_tenant,
    p_ordem,
    oi.id,
    of.funcionario_id,
    (oi.quantidade * oi.preco_unit),
    oi.comissao_percentual,
    round(
      (oi.quantidade * oi.preco_unit) * (oi.comissao_percentual / 100.0) * (of.participacao / 100.0),
      2)
    from public.ordem_itens oi
    cross join public.ordem_funcionarios of
    where oi.ordem_id = p_ordem
      and of.ordem_id = p_ordem
      and oi.comissao_percentual > 0;

  get diagnostics v_inseridas = row_count;
  return v_inseridas;
end;
$$;

-- Trigger: ao mudar status para 'entregue', gera comissões.
create or replace function public.on_ordem_entregue()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and new.status = 'entregue' and old.status is distinct from 'entregue' then
    perform public.gerar_comissoes_para_ordem(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_on_ordem_entregue on public.ordens_servico;
create trigger trg_on_ordem_entregue
  after update of status on public.ordens_servico
  for each row execute function public.on_ordem_entregue();

-- =============================================================
-- 4. RLS
-- =============================================================
alter table public.produtos                 enable row level security;
alter table public.movimentos_estoque       enable row level security;
alter table public.servico_produtos         enable row level security;
alter table public.categorias_financeiras   enable row level security;
alter table public.formas_pagamento         enable row level security;
alter table public.contas_pagar             enable row level security;
alter table public.contas_receber           enable row level security;
alter table public.pagamentos               enable row level security;
alter table public.comissoes                enable row level security;

drop policy if exists produtos_tenant on public.produtos;
create policy produtos_tenant on public.produtos
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

drop policy if exists mov_tenant on public.movimentos_estoque;
create policy mov_tenant on public.movimentos_estoque
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

drop policy if exists sp_tenant on public.servico_produtos;
create policy sp_tenant on public.servico_produtos
  for all using (
    exists (
      select 1 from public.servicos s
       where s.id = servico_id
         and s.tenant_id in (select public.current_user_tenants())
    )
  ) with check (
    exists (
      select 1 from public.servicos s
       where s.id = servico_id
         and s.tenant_id in (select public.current_user_tenants())
    )
  );

drop policy if exists cat_fin_tenant on public.categorias_financeiras;
create policy cat_fin_tenant on public.categorias_financeiras
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

drop policy if exists fp_tenant on public.formas_pagamento;
create policy fp_tenant on public.formas_pagamento
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

drop policy if exists cp_tenant on public.contas_pagar;
create policy cp_tenant on public.contas_pagar
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

drop policy if exists cr_tenant on public.contas_receber;
create policy cr_tenant on public.contas_receber
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

drop policy if exists pag_tenant on public.pagamentos;
create policy pag_tenant on public.pagamentos
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

drop policy if exists com_tenant on public.comissoes;
create policy com_tenant on public.comissoes
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

-- Aplica o trigger set_updated_at nas novas tabelas com updated_at.
do $$
declare t text;
begin
  for t in select unnest(array['produtos'])
  loop
    execute format('drop trigger if exists trg_set_updated_at on public.%I;', t);
    execute format(
      'create trigger trg_set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- =============================================================
-- 5. Semente das categorias e formas padrão (no provision_tenant).
-- =============================================================
-- Atualiza provision_tenant para também criar categorias e formas padrão.
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

  -- Categorias financeiras padrão
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

  return v_tenant_id;
end;
$$;
