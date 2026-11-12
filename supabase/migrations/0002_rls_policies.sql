-- LAVPRO - Row Level Security
-- Isolamento por tenant. Cada tabela que carrega tenant_id só permite acesso
-- quando o usuário possui membership (ativa) naquele tenant.
-- A chave de service_role continua passando por cima (uso em jobs).

alter table public.tenants             enable row level security;
alter table public.unidades            enable row level security;
alter table public.profiles            enable row level security;
alter table public.memberships         enable row level security;
alter table public.clientes            enable row level security;
alter table public.veiculos            enable row level security;
alter table public.boxes               enable row level security;
alter table public.servicos            enable row level security;
alter table public.servico_precos      enable row level security;
alter table public.funcionarios        enable row level security;
alter table public.agendamentos        enable row level security;
alter table public.agendamento_servicos enable row level security;
alter table public.ordens_servico      enable row level security;
alter table public.ordem_itens         enable row level security;
alter table public.ordem_funcionarios  enable row level security;
alter table public.ordem_historico     enable row level security;
alter table public.ordem_sequencias    enable row level security;

-- Helper inline: tenant_id pertence ao usuário?
--   tenant_id in (select current_user_tenants())
-- Usado em todas as políticas.

-- profiles --------------------------------------------------------
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
  for select using (id = auth.uid()
                   or id in (
                     select m.user_id from public.memberships m
                      where m.tenant_id in (select public.current_user_tenants())
                   ));

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles
  for insert with check (id = auth.uid());

-- tenants ---------------------------------------------------------
drop policy if exists tenants_member_select on public.tenants;
create policy tenants_member_select on public.tenants
  for select using (id in (select public.current_user_tenants()));

drop policy if exists tenants_owner_update on public.tenants;
create policy tenants_owner_update on public.tenants
  for update using (
    public.current_user_perfil(id) in ('superadmin','proprietario')
  ) with check (
    public.current_user_perfil(id) in ('superadmin','proprietario')
  );

-- memberships -----------------------------------------------------
drop policy if exists memberships_select on public.memberships;
create policy memberships_select on public.memberships
  for select using (
    user_id = auth.uid()
    or tenant_id in (select public.current_user_tenants())
  );

drop policy if exists memberships_admin_write on public.memberships;
create policy memberships_admin_write on public.memberships
  for all using (
    public.current_user_perfil(tenant_id) in ('superadmin','proprietario','gerente')
  ) with check (
    public.current_user_perfil(tenant_id) in ('superadmin','proprietario','gerente')
  );

-- Macro: aplica policy "só tenants do usuário" nas tabelas de dados
--
-- As políticas abaixo são explícitas para clareza e para permitir
-- diferenças futuras entre SELECT e INSERT/UPDATE.

-- unidades --------------------------------------------------------
drop policy if exists unidades_tenant_all on public.unidades;
create policy unidades_tenant_all on public.unidades
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

-- clientes --------------------------------------------------------
drop policy if exists clientes_tenant_all on public.clientes;
create policy clientes_tenant_all on public.clientes
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

-- veiculos --------------------------------------------------------
drop policy if exists veiculos_tenant_all on public.veiculos;
create policy veiculos_tenant_all on public.veiculos
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

-- boxes -----------------------------------------------------------
drop policy if exists boxes_tenant_all on public.boxes;
create policy boxes_tenant_all on public.boxes
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

-- servicos --------------------------------------------------------
drop policy if exists servicos_tenant_all on public.servicos;
create policy servicos_tenant_all on public.servicos
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

drop policy if exists servico_precos_tenant_all on public.servico_precos;
create policy servico_precos_tenant_all on public.servico_precos
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

-- funcionarios ----------------------------------------------------
drop policy if exists funcionarios_tenant_all on public.funcionarios;
create policy funcionarios_tenant_all on public.funcionarios
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

-- agendamentos ----------------------------------------------------
drop policy if exists agendamentos_tenant_all on public.agendamentos;
create policy agendamentos_tenant_all on public.agendamentos
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

drop policy if exists ag_servicos_tenant_all on public.agendamento_servicos;
create policy ag_servicos_tenant_all on public.agendamento_servicos
  for all using (
    exists (
      select 1 from public.agendamentos a
       where a.id = agendamento_id
         and a.tenant_id in (select public.current_user_tenants())
    )
  ) with check (
    exists (
      select 1 from public.agendamentos a
       where a.id = agendamento_id
         and a.tenant_id in (select public.current_user_tenants())
    )
  );

-- ordens de serviço ----------------------------------------------
drop policy if exists ordens_tenant_all on public.ordens_servico;
create policy ordens_tenant_all on public.ordens_servico
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));

drop policy if exists ordem_itens_tenant_all on public.ordem_itens;
create policy ordem_itens_tenant_all on public.ordem_itens
  for all using (
    exists (
      select 1 from public.ordens_servico o
       where o.id = ordem_id
         and o.tenant_id in (select public.current_user_tenants())
    )
  ) with check (
    exists (
      select 1 from public.ordens_servico o
       where o.id = ordem_id
         and o.tenant_id in (select public.current_user_tenants())
    )
  );

drop policy if exists ordem_funcs_tenant_all on public.ordem_funcionarios;
create policy ordem_funcs_tenant_all on public.ordem_funcionarios
  for all using (
    exists (
      select 1 from public.ordens_servico o
       where o.id = ordem_id
         and o.tenant_id in (select public.current_user_tenants())
    )
  ) with check (
    exists (
      select 1 from public.ordens_servico o
       where o.id = ordem_id
         and o.tenant_id in (select public.current_user_tenants())
    )
  );

drop policy if exists ordem_hist_tenant_all on public.ordem_historico;
create policy ordem_hist_tenant_all on public.ordem_historico
  for select using (tenant_id in (select public.current_user_tenants()));

drop policy if exists ordem_sequencias_tenant on public.ordem_sequencias;
create policy ordem_sequencias_tenant on public.ordem_sequencias
  for all using (tenant_id in (select public.current_user_tenants()))
         with check (tenant_id in (select public.current_user_tenants()));
