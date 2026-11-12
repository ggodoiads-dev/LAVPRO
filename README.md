# LAVPRO

**Sua operação sob controle.**

LAVPRO é um ERP SaaS para lava-carros, centros de estética automotiva e
detalhadores. Centraliza agendamento, ordens de serviço, clientes,
veículos, equipe, estoque, financeiro e indicadores em uma única
plataforma multi-tenant.

Este repositório contém as **Fases 1, 2 e 3 — Fundação, Operação, Gestão administrativa e Expansão comercial**:

**Fase 1 — Fundação & operação**

- Autenticação (Supabase Auth) e proteção de rotas por middleware.
- Multi-tenant isolado por `tenant_id` com Row Level Security no banco.
- Perfis de acesso: `superadmin`, `proprietario`, `gerente`, `recepcao`, `operacional`, `financeiro`.
- App shell responsivo com sidebar recolhível (filtrada por perfil), tema claro/escuro e identidade visual própria.
- Dashboard operacional com KPIs, série diária e serviços mais executados.
- Cadastros de clientes, veículos e serviços.
- Agenda de atendimentos com verificação básica de conflito de box.
- Ordens de serviço com numeração sequencial, itens e desconto.
- Kanban operacional com movimentação de status e destaque de atrasos.
- Landing page comercial pronta para divulgação.

**Fase 2 — Gestão administrativa**

- Funcionários com ranking de produtividade e comissões apuradas.
- Estoque: produtos, custo médio recalculado em cada entrada, alertas
  de mínimo, movimentações (entrada, saída, perda e inventário).
- Ficha técnica: produtos consumidos por serviço.
- Comissões geradas automaticamente ao entregar uma OS (trigger).
- Financeiro: contas a pagar/receber, formas de pagamento, pagamentos
  de OS parciais ou totais, destaque de vencidas, marcar como paga.
- DRE gerencial mensal (regime de caixa) com margem por linha.
- Central de relatórios com receita por serviço, comissões por
  funcionário, produtos a repor e resumo do DRE.

**Fase 3 — Expansão comercial**

- Pacotes pré-pagos com saldo por serviço; venda via RPC atômica
  `vender_pacote`.
- Programa de pontos: regra parametrizável, acúmulo automático ao
  entregar a OS (trigger), ranking de clientes e cálculo do passivo em
  crédito.
- Portal público do cliente em `/portal/[slug]` (consulta por placa +
  telefone) e agendamento online em `/book/[slug]` via função
  `criar_agendamento_publico`.
- Notificações: fila `notificacoes` + templates padronizados em
  `lib/integrations/notifications.ts`; integração real plugável sem
  alterar os pontos de chamada.
- Avaliações (NPS) pós-OS com nota 0–10 e comentário.
- Baixa automática de estoque a partir da ficha técnica quando a OS
  entra em execução.
- Custo real da OS (RPC `custo_real_ordem`) e view `v_dre_mensal`
  pronta para substituir a aproximação do DRE.
- Exportação CSV em `/api/export/:recurso` para clientes, veículos,
  serviços, ordens, produtos, funcionários, comissões e contas a pagar.

---

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) + TypeScript |
| Estilo | Tailwind CSS + componentes shadcn-style |
| UI primitivos | Radix UI + Lucide Icons |
| Formulários | React Hook Form (opcional) + validação [Zod](https://zod.dev/) |
| Charts | [Recharts](https://recharts.org/) |
| Banco de dados | [Supabase](https://supabase.com/) PostgreSQL |
| Autenticação | Supabase Auth (@supabase/ssr) |
| Isolamento | Row Level Security multi-tenant (`tenant_id`) |
| Hospedagem | Vercel (frontend) + Supabase (dados) |

---

## Estrutura do projeto

```
LAVPRO/
├── app/
│   ├── (auth)/              Rotas públicas: login, registro, recuperar
│   ├── (app)/               Rotas protegidas: dashboard, clientes, veículos,
│   │                        serviços, agendamentos, ordens, kanban,
│   │                        configurações
│   ├── layout.tsx
│   └── page.tsx             Landing page comercial
├── components/              UI, forms, layout, dashboard, kanban
├── lib/
│   ├── auth/                Session helper (RSC)
│   ├── data/                Camada de dados (queries + modo demo)
│   ├── supabase/            Clients browser/server/middleware
│   ├── validators/          Schemas Zod
│   ├── permissions.ts       Matriz de permissões por perfil
│   ├── status.ts            Estados da OS e transições permitidas
│   └── utils.ts             Formatação, helpers
├── middleware.ts            Proteção de rotas e refresh de sessão
├── supabase/migrations/     DDL + RLS + helpers (0001..0003)
├── types/                   Tipos espelhando o schema do banco
└── ...configs (next, tailwind, tsconfig)
```

---

## Setup local

### Pré-requisitos

- Node.js 20+
- pnpm 9+ (ou npm/yarn)
- Projeto Supabase (free tier serve)

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Variáveis de ambiente

```bash
cp .env.example .env.local
# edite e preencha os valores do seu projeto Supabase
```

### 3. Aplicar migrations no Supabase

No painel do Supabase → SQL Editor, execute na ordem:

1. `supabase/migrations/0001_init_schema.sql` — tabelas, índices e triggers
2. `supabase/migrations/0002_rls_policies.sql` — Row Level Security
3. `supabase/migrations/0003_seed_defaults.sql` — função `provision_tenant` e `v_dashboard_diario`
4. `supabase/migrations/0004_phase2_admin.sql` — estoque, financeiro, comissões, DRE
5. `supabase/migrations/0005_phase3_crm.sql` — pacotes, pontos, notificações, avaliações, portal público

> Se preferir, use a CLI do Supabase (`supabase db push`) com o
> projeto linkado.

### 4. Rodar em desenvolvimento

```bash
pnpm dev
```

A aplicação sobe em http://localhost:3000.

### 5. Primeiro acesso

- Abra `/registro` e crie sua conta.
- O backend chama `provision_tenant` e cria a empresa, a unidade matriz,
  boxes e serviços padrão, associando seu usuário como `proprietario`.
- A partir daí, use a aplicação normalmente.

### Modo demo

Enquanto as variáveis `NEXT_PUBLIC_SUPABASE_URL` e
`NEXT_PUBLIC_SUPABASE_ANON_KEY` **não** estão definidas, a aplicação
roda em **modo demonstração**: a camada de dados devolve registros de
exemplo (ver `lib/data/demo.ts`) para que a navegação permaneça
funcional durante o setup. Um aviso visível aparece no topo. Nenhum
dado é persistido nesse modo.

---

## Scripts

| Comando | Descrição |
|---|---|
| `pnpm dev` | Modo desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm start` | Servir o build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Checagem de tipos |

---

## Roadmap

- **Fase 1 — Fundação (concluída).** Auth, multi-tenant, operação essencial, Kanban, dashboard.
- **Fase 2 — Gestão administrativa (concluída).** Funcionários, estoque, financeiro, comissões, DRE, relatórios.
- **Fase 3 — Expansão comercial (concluída).** Pacotes, fidelização, portal do cliente, agendamento online, fila de notificações, avaliações, exportações.
- **Fase 4 — Plataforma SaaS.** Painel superadmin, planos, cobrança recorrente.
- **Fase 5 — Inteligência.** Previsão de demanda, recomendações, análise de rentabilidade.

Veja `ARCHITECTURE.md` para o detalhamento da arquitetura, o ERD e as
decisões técnicas por módulo.

---

## Licença

Proprietário. Todos os direitos reservados.
