# LAVPRO

**Sua operação sob controle.**

LAVPRO é um ERP SaaS para lava-carros, centros de estética automotiva e
detalhadores. Centraliza agendamento, ordens de serviço, clientes,
veículos, equipe, estoque, financeiro e indicadores em uma única
plataforma multi-tenant.

Este repositório contém a **Fase 1 — Fundação e Operação**:

- Autenticação (Supabase Auth) e proteção de rotas por middleware.
- Multi-tenant isolado por `tenant_id` com Row Level Security no banco.
- Perfis de acesso: `superadmin`, `proprietario`, `gerente`, `recepcao`, `operacional`, `financeiro`.
- App shell responsivo com sidebar recolhível, tema claro/escuro e identidade visual própria.
- Dashboard operacional com KPIs, série diária e serviços mais executados.
- Cadastros de clientes, veículos e serviços.
- Agenda de atendimentos com verificação básica de conflito de box.
- Ordens de serviço com numeração sequencial, itens e desconto.
- Kanban operacional com movimentação de status e destaque de atrasos.
- Landing page comercial pronta para divulgação.

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

- **Fase 1 — Fundação (atual).** Auth, multi-tenant, operação essencial, Kanban, dashboard.
- **Fase 2 — Gestão administrativa.** Funcionários, estoque, financeiro, comissões e relatórios.
- **Fase 3 — Expansão comercial.** CRM, fidelização, portal do cliente, notificações, pacotes.
- **Fase 4 — Plataforma SaaS.** Painel superadmin, planos, cobrança recorrente.
- **Fase 5 — Inteligência.** Previsão de demanda, recomendações, análise de rentabilidade.

Veja `ARCHITECTURE.md` para o detalhamento da arquitetura, o ERD e as
decisões técnicas por módulo.

---

## Licença

Proprietário. Todos os direitos reservados.
