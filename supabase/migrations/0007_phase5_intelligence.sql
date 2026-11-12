-- LAVPRO - Fase 5: Inteligência & automação
-- Campanhas (gatilhos parametrizados que enfileiram notificações),
-- views analíticas para previsão de demanda, LTV por cliente e
-- indicadores preditivos.

-- =============================================================
-- 1. Campanhas (motor de regras)
-- =============================================================
create table if not exists public.campanhas (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  codigo          text not null,
  nome            text not null,
  descricao       text,
  gatilho         text not null check (gatilho in (
                    'reativacao',            -- cliente inativo há N dias
                    'aniversario',           -- aniversário do cliente
                    'pos_atendimento',       -- X dias após OS entregue
                    'lembrete_agendamento',  -- X horas antes do agendamento
                    'manual'                 -- disparo sob demanda
                  )),
  canal           text not null check (canal in ('whatsapp','sms','email','push','console')),
  template_codigo text,
  parametros      jsonb not null default '{}'::jsonb,
  ativo           boolean not null default true,
  ultima_execucao timestamptz,
  proxima_execucao timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, codigo)
);
create index if not exists idx_camp_tenant on public.campanhas(tenant_id);

-- Log append-only de execuções.
create table if not exists public.campanha_execucoes (
  id              uuid primary key default gen_random_uuid(),
  campanha_id     uuid not null references public.campanhas(id) on delete cascade,
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  iniciada_em     timestamptz not null default now(),
  concluida_em    timestamptz,
  alvos           int not null default 0,
  enfileiradas    int not null default 0,
  erro            text,
  detalhes        jsonb not null default '{}'::jsonb
);
create index if not exists idx_camp_exec_tenant on public.campanha_execucoes(tenant_id, iniciada_em desc);

alter table public.campanhas           enable row level security;
alter table public.campanha_execucoes  enable row level security;

drop policy if exists camp_tenant on public.campanhas;
create policy camp_tenant on public.campanhas
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

drop policy if exists camp_exec_tenant on public.campanha_execucoes;
create policy camp_exec_tenant on public.campanha_execucoes
  for select using (tenant_id in (select public.current_user_tenants()));

-- =============================================================
-- 2. Função: executar uma campanha (idempotente por janela)
-- =============================================================
-- Resolve o conjunto de clientes-alvo conforme o gatilho e enfileira
-- notificações em public.notificacoes. Não envia nada por si só; o
-- worker externo é quem muda o status para "enviada".
create or replace function public.executar_campanha(p_campanha uuid)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_camp     public.campanhas%rowtype;
  v_exec_id  uuid;
  v_alvos    int := 0;
  v_filas    int := 0;
  v_tpl      public.notificacoes_templates%rowtype;
  v_corpo    text;
  v_dest     text;
  v_now      timestamptz := now();
  v_dias     int;
  v_horas    int;
  rec        record;
begin
  select * into v_camp from public.campanhas where id = p_campanha and ativo = true;
  if v_camp.id is null then
    return jsonb_build_object('error','campanha_inativa_ou_inexistente');
  end if;

  insert into public.campanha_execucoes (campanha_id, tenant_id)
    values (v_camp.id, v_camp.tenant_id)
    returning id into v_exec_id;

  -- Resolve template padrão por canal/código.
  if v_camp.template_codigo is not null then
    select * into v_tpl from public.notificacoes_templates
      where tenant_id = v_camp.tenant_id
        and codigo = v_camp.template_codigo
        and canal = v_camp.canal
        and ativo = true
      limit 1;
  end if;

  v_dias  := coalesce((v_camp.parametros->>'dias')::int, 30);
  v_horas := coalesce((v_camp.parametros->>'horas')::int, 24);

  if v_camp.gatilho = 'reativacao' then
    for rec in
      select c.id, c.nome, coalesce(c.whatsapp, c.telefone, c.email) as destino
        from public.clientes c
       where c.tenant_id = v_camp.tenant_id
         and (c.consent_marketing = true or v_camp.canal = 'console')
         and not exists (
           select 1 from public.ordens_servico o
            where o.cliente_id = c.id
              and o.aberta_em > v_now - make_interval(days => v_dias)
         )
         and not exists (
           select 1 from public.notificacoes n
            where n.cliente_id = c.id
              and n.template_codigo = v_camp.codigo
              and n.created_at > v_now - interval '30 days'
         )
    loop
      v_alvos := v_alvos + 1;
      v_dest  := coalesce(rec.destino, 'cliente-'||rec.id);
      v_corpo := coalesce(v_tpl.corpo, 'Olá '||rec.nome||', sentimos sua falta.');
      v_corpo := replace(v_corpo, '{nome}', rec.nome);
      insert into public.notificacoes
        (tenant_id, cliente_id, template_codigo, canal, destinatario, assunto, corpo, status)
      values
        (v_camp.tenant_id, rec.id, v_camp.codigo, v_camp.canal, v_dest, v_tpl.assunto, v_corpo, 'pendente');
      v_filas := v_filas + 1;
    end loop;

  elsif v_camp.gatilho = 'aniversario' then
    for rec in
      select c.id, c.nome, coalesce(c.whatsapp, c.telefone, c.email) as destino
        from public.clientes c
       where c.tenant_id = v_camp.tenant_id
         and c.nascimento is not null
         and extract(month from c.nascimento) = extract(month from v_now)
         and extract(day   from c.nascimento) = extract(day   from v_now)
    loop
      v_alvos := v_alvos + 1;
      v_dest  := coalesce(rec.destino, 'cliente-'||rec.id);
      v_corpo := coalesce(v_tpl.corpo, 'Feliz aniversário, '||rec.nome||'! Preparamos um presente para você.');
      v_corpo := replace(v_corpo, '{nome}', rec.nome);
      insert into public.notificacoes
        (tenant_id, cliente_id, template_codigo, canal, destinatario, assunto, corpo, status)
      values
        (v_camp.tenant_id, rec.id, v_camp.codigo, v_camp.canal, v_dest, v_tpl.assunto, v_corpo, 'pendente');
      v_filas := v_filas + 1;
    end loop;

  elsif v_camp.gatilho = 'pos_atendimento' then
    for rec in
      select o.id as ordem_id, o.cliente_id, c.nome,
             coalesce(c.whatsapp, c.telefone, c.email) as destino, o.numero
        from public.ordens_servico o
        join public.clientes c on c.id = o.cliente_id
       where o.tenant_id = v_camp.tenant_id
         and o.status = 'entregue'
         and o.entregue_em between v_now - make_interval(days => v_dias) and v_now
         and not exists (
           select 1 from public.notificacoes n
            where n.ordem_id = o.id
              and n.template_codigo = v_camp.codigo
         )
    loop
      v_alvos := v_alvos + 1;
      v_dest  := coalesce(rec.destino, 'cliente-'||rec.cliente_id);
      v_corpo := coalesce(v_tpl.corpo,
        'Olá '||rec.nome||', obrigado pela confiança. Pode nos avaliar? Referência OS #'||rec.numero);
      v_corpo := replace(v_corpo, '{nome}', rec.nome);
      v_corpo := replace(v_corpo, '{os}', rec.numero::text);
      insert into public.notificacoes
        (tenant_id, cliente_id, ordem_id, template_codigo, canal, destinatario, assunto, corpo, status)
      values
        (v_camp.tenant_id, rec.cliente_id, rec.ordem_id, v_camp.codigo, v_camp.canal, v_dest, v_tpl.assunto, v_corpo, 'pendente');
      v_filas := v_filas + 1;
    end loop;

  elsif v_camp.gatilho = 'lembrete_agendamento' then
    for rec in
      select a.id as ag_id, a.inicio, c.id as cliente_id, c.nome,
             coalesce(c.whatsapp, c.telefone, c.email) as destino
        from public.agendamentos a
        join public.clientes c on c.id = a.cliente_id
       where a.tenant_id = v_camp.tenant_id
         and a.status in ('pendente','confirmado')
         and a.inicio between v_now and v_now + make_interval(hours => v_horas)
         and not exists (
           select 1 from public.notificacoes n
            where n.cliente_id = c.id
              and n.template_codigo = v_camp.codigo
              and n.created_at > v_now - interval '48 hours'
         )
    loop
      v_alvos := v_alvos + 1;
      v_dest  := coalesce(rec.destino, 'cliente-'||rec.cliente_id);
      v_corpo := coalesce(v_tpl.corpo,
        'Lembrete: '||rec.nome||', seu atendimento está marcado para '||
        to_char(rec.inicio at time zone 'America/Sao_Paulo','DD/MM HH24:MI')||'.');
      v_corpo := replace(v_corpo, '{nome}', rec.nome);
      v_corpo := replace(v_corpo, '{data}', to_char(rec.inicio,'DD/MM'));
      v_corpo := replace(v_corpo, '{hora}', to_char(rec.inicio,'HH24:MI'));
      insert into public.notificacoes
        (tenant_id, cliente_id, template_codigo, canal, destinatario, assunto, corpo, status, agendada_para)
      values
        (v_camp.tenant_id, rec.cliente_id, v_camp.codigo, v_camp.canal, v_dest, v_tpl.assunto, v_corpo, 'pendente', rec.inicio - interval '2 hours');
      v_filas := v_filas + 1;
    end loop;
  end if;

  update public.campanha_execucoes
     set concluida_em = now(), alvos = v_alvos, enfileiradas = v_filas
   where id = v_exec_id;
  update public.campanhas set ultima_execucao = now(), updated_at = now()
   where id = v_camp.id;

  return jsonb_build_object('alvos', v_alvos, 'enfileiradas', v_filas, 'exec_id', v_exec_id);
end;
$$;

-- =============================================================
-- 3. Views analíticas
-- =============================================================
-- Heatmap de demanda: por dia-da-semana (0=dom..6=sab) × hora (0..23).
create or replace view public.v_demanda_por_slot as
  select
    o.tenant_id,
    extract(dow  from o.aberta_em at time zone 'America/Sao_Paulo')::int as dia_semana,
    extract(hour from o.aberta_em at time zone 'America/Sao_Paulo')::int as hora,
    count(*)                                                             as qtd,
    coalesce(sum(o.total) filter (where o.status = 'entregue'), 0)       as receita
    from public.ordens_servico o
   where o.aberta_em >= now() - interval '180 days'
     and o.status not in ('cancelado')
  group by 1, 2, 3;

-- LTV por cliente.
create or replace view public.v_ltv_por_cliente as
  select
    o.tenant_id,
    o.cliente_id,
    count(*)                                   as visitas,
    min(o.aberta_em)                           as primeira_visita,
    max(o.aberta_em)                           as ultima_visita,
    sum(o.total) filter (where o.status='entregue')  as total_gasto,
    (sum(o.total) filter (where o.status='entregue')
       / nullif(count(*) filter (where o.status='entregue'),0)) as ticket_medio
    from public.ordens_servico o
   group by o.tenant_id, o.cliente_id;

-- Serviço × margem (quando há consumo lançado para OS daquele serviço).
create or replace view public.v_servico_margem as
  with por_item as (
    select
      s.tenant_id,
      s.id as servico_id,
      s.nome,
      oi.preco_unit * oi.quantidade as receita,
      coalesce(public.custo_real_ordem(oi.ordem_id), 0) as custo_total_ordem,
      1.0 * oi.preco_unit * oi.quantidade / nullif(o.subtotal, 0) as peso
      from public.ordem_itens oi
      join public.ordens_servico o on o.id = oi.ordem_id
      join public.servicos s on s.id = oi.servico_id
     where o.status = 'entregue' and o.entregue_em >= now() - interval '90 days'
  )
  select
    tenant_id,
    servico_id,
    nome,
    sum(receita)                                                       as receita,
    sum(custo_total_ordem * coalesce(peso, 0))                         as custo,
    sum(receita) - sum(custo_total_ordem * coalesce(peso, 0))          as margem,
    case when sum(receita) > 0
      then 100 * (sum(receita) - sum(custo_total_ordem * coalesce(peso, 0))) / sum(receita)
      else 0 end                                                       as margem_pct
    from por_item
   group by tenant_id, servico_id, nome;

-- =============================================================
-- 4. Semeia campanhas padrão em provision_tenant
-- =============================================================
-- Não refaço provision_tenant inteiro; apenas criamos aqui um helper
-- opcional. O cliente pode criar via UI também.
create or replace function public.seed_campanhas_padrao(p_tenant uuid)
returns int
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.campanhas
    (tenant_id, codigo, nome, descricao, gatilho, canal, template_codigo, parametros, ativo)
  values
    (p_tenant, 'reativacao',           'Reativar clientes inativos',  'Cliente sem OS por 30 dias',           'reativacao',           'whatsapp', 'reativacao',           '{"dias":30}'::jsonb, true),
    (p_tenant, 'aniversario',          'Aniversariantes',             'Mensagem no dia do aniversário',        'aniversario',          'whatsapp', 'aniversario',          '{}'::jsonb,         true),
    (p_tenant, 'pos_atendimento',      'Pedir avaliação (NPS)',       '2 dias após entrega',                   'pos_atendimento',      'whatsapp', 'pos_atendimento',      '{"dias":2}'::jsonb, true),
    (p_tenant, 'lembrete_agendamento', 'Lembrete de agendamento',     '2h antes do início',                    'lembrete_agendamento', 'whatsapp', 'lembrete_agendamento', '{"horas":4}'::jsonb,true)
  on conflict (tenant_id, codigo) do nothing;
  return 4;
end;
$$;
