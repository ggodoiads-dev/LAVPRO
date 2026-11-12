-- LAVPRO - Função auxiliar: provisiona o workspace de uma nova empresa.
-- Chame ao finalizar o cadastro de uma empresa: a função cria o tenant,
-- a unidade matriz, os serviços e boxes padrão, e associa o usuário
-- autenticado como proprietário.

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

  -- Serviços padrão (ajustáveis depois pelo cliente).
  insert into public.servicos
    (tenant_id, nome, categoria, descricao, preco_base, custo_estimado,
     duracao_min, comissao_percentual) values
    (v_tenant_id, 'Lavagem Simples', 'Lavagem',
     'Lavagem externa com shampoo neutro', 35, 5, 30, 20),
    (v_tenant_id, 'Lavagem Completa', 'Lavagem',
     'Lavagem externa + aspiração + painéis', 65, 8, 50, 25),
    (v_tenant_id, 'Lavagem Técnica', 'Lavagem',
     'Lavagem detalhada com descontaminação leve', 120, 15, 90, 25),
    (v_tenant_id, 'Higienização Interna', 'Estética',
     'Limpeza profunda do interior', 220, 25, 180, 30),
    (v_tenant_id, 'Polimento Comercial', 'Estética',
     'Polimento de uma etapa', 350, 40, 240, 30),
    (v_tenant_id, 'Vitrificação', 'Estética',
     'Aplicação de coating com proteção', 950, 90, 480, 25);

  insert into public.memberships (tenant_id, user_id, perfil)
    values (v_tenant_id, v_user_id, 'proprietario')
    on conflict (tenant_id, user_id) do update set perfil = excluded.perfil;

  return v_tenant_id;
end;
$$;

-- View materializada leve para dashboard: agrega por dia (últimos 30 dias).
create or replace view public.v_dashboard_diario as
  select
    o.tenant_id,
    date_trunc('day', coalesce(o.entregue_em, o.aberta_em))::date as dia,
    count(*) filter (where o.status = 'entregue')               as entregues,
    count(*) filter (where o.status not in ('cancelado'))        as total,
    coalesce(sum(case when o.status = 'entregue' then o.total end), 0) as faturamento
    from public.ordens_servico o
   where o.aberta_em >= now() - interval '60 days'
  group by 1, 2;
