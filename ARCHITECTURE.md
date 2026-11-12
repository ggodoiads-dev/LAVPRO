# Arquitetura do LAVPRO

Este documento descreve as decisões técnicas da plataforma. É o
documento vivo que acompanha a evolução das fases.

---

## 1. Visão geral

LAVPRO é um ERP SaaS multi-tenant. Cada estabelecimento (empresa) é um
tenant, isolado por `tenant_id`. As camadas:

```
┌────────────────────────────────────────────────┐
│  Next.js (App Router, RSC)                     │
│  - Landing, auth, app                          │
│  - Server Actions para mutações                │
│  - Middleware refresca a sessão                │
└───────────────┬────────────────────────────────┘
                │ @supabase/ssr (cookies)
┌───────────────▼────────────────────────────────┐
│  Supabase                                      │
│  - Auth (email/senha)                          │
│  - Postgres (schema public)                    │
│  - RLS por tenant_id                           │
│  - Storage (fotos de OS — Fase 2)              │
│  - Realtime (Kanban — Fase 2)                  │
└────────────────────────────────────────────────┘
```

### Princípios

- **Isolamento no banco.** A segurança não depende do frontend: cada
  query da UI é validada pelas policies de RLS. O frontend oculta
  botões por permissão, mas o backend é a verdade.
- **Server-first.** Páginas são RSC; mutações passam por Server Actions
  que validam com Zod antes de tocar o banco.
- **Sem dados fictícios em produção.** Em `lib/data/queries.ts` há
  fallback com dados de amostra quando o Supabase não está configurado
  — explícito, para onboarding.
- **Nada no código que precise de credencial.** Todas as chaves vêm de
  `env`. Nenhum segredo entra em commits.

---

## 2. Modelo de dados (Fases 1 a 5)

```
tenants ───┬─< unidades ──< boxes
           ├─< memberships >── profiles (auth.users)
           ├─< clientes ───< veiculos
           ├─< servicos ───< servico_precos / servico_produtos
           ├─< funcionarios
           ├─< produtos ──< movimentos_estoque (ordem_id opcional)
           ├─< categorias_financeiras
           ├─< formas_pagamento
           ├─< contas_pagar / contas_receber
           ├─< pagamentos (ordem_id)
           ├─< comissoes (ordem_id, item_id, funcionario_id)
           ├─< pacotes ──< pacote_itens
           ├─< cliente_pacotes ──< cliente_pacote_saldos
           │                     < cliente_pacote_consumos (ordem_id)
           ├─< pontos_regras (1-1 tenant)
           ├─< pontos_movimentos (cliente_id, ordem_id)
           ├─< notificacoes_templates
           ├─< notificacoes (cliente_id, ordem_id)
           ├─< avaliacoes (ordem_id)
           ├─< agendamentos ──< agendamento_servicos
           ├─< assinatura (1-1 tenant) → plano
           ├─< assinatura_eventos (append-only)
           └─< ordens_servico ──┬─< ordem_itens
                                ├─< ordem_funcionarios
                                └─< ordem_historico
                                ordem_sequencias (1-1 tenant)

planos ───┬─< plano_limites (1-1)
          └─< assinaturas ──< invoices (cobranças recorrentes)

webhook_events (append-only, UNIQUE em (gateway, event_id))

campanhas ──< campanha_execucoes
            → notificacoes (fila enfileirada pela função executar_campanha)
```

### Tabelas principais

| Tabela | Finalidade |
|---|---|
| `tenants` | Empresa assinante (SaaS). |
| `unidades` | Filiais da empresa. |
| `profiles` | Dados de usuário vinculados a `auth.users`. |
| `memberships` | Vínculo usuário × empresa × perfil (RBAC). |
| `clientes` | CRM — pessoas físicas ou jurídicas. |
| `veiculos` | Veículos vinculados a um cliente. |
| `servicos` | Catálogo (preço, custo, duração, comissão). |
| `servico_precos` | Preço diferenciado por categoria de veículo. |
| `boxes` | Estações de atendimento. |
| `funcionarios` | Equipe operacional (pode ou não ser usuário). |
| `agendamentos` | Reservas futuras. |
| `ordens_servico` | OS no fluxo operacional. |
| `ordem_itens` | Serviços dentro de uma OS. |
| `ordem_funcionarios` | Quem participou da OS (múltiplos permitidos). |
| `ordem_historico` | Auditoria de mudanças de status. |
| `ordem_sequencias` | Numeração sequencial por tenant. |

### Funções e triggers

- `current_user_tenants()` — retorna os tenants do usuário
  autenticado. Base de todas as policies.
- `current_user_perfil(uuid)` — perfil do usuário em um tenant.
- `provision_tenant(nome, slug)` — cria empresa, unidade matriz, boxes,
  serviços padrão e associa o usuário como proprietário.
- `next_ordem_numero(tenant)` — concede número sequencial atômico.
- `set_updated_at` — trigger de `updated_at` em várias tabelas.
- `log_ordem_status` — grava entrada em `ordem_historico` a cada
  mudança de status de OS.

### Row Level Security

Todas as tabelas com `tenant_id` têm política:
```sql
tenant_id in (select current_user_tenants())
```

Tabelas-filhas (ex.: `ordem_itens`, `agendamento_servicos`) herdam o
isolamento via `exists (...)` sobre o pai.

---

## 3. Autenticação e sessão

- Cookies HttpOnly via `@supabase/ssr`.
- Middleware (`middleware.ts`) chama `updateSession` em cada request
  para renovar o token e proteger rotas `/dashboard`, `/clientes`,
  `/veiculos`, `/servicos`, `/agendamentos`, `/ordens`, `/kanban`,
  `/configuracoes`.
- Server Components recebem o usuário via `getSession` (cache por
  request), que:
  - Busca o `profile`.
  - Lista `memberships` ativas.
  - Define `activeTenant` (primeiro vínculo ativo — na Fase 2 virá de
    cookie/preferência).

---

## 4. Workflow da OS

Estados: `agendado`, `recebido`, `aguardando`, `em_execucao`,
`inspecao`, `pronto`, `entregue`, `cancelado`, `suspenso`.

Transições permitidas em `lib/status.ts` (`ALLOWED_TRANSITIONS`). A UI
só oferece botões válidos e o server action `moveOrdemStatus` verifica
a transição antes de persistir. A trigger `log_ordem_status` registra a
mudança.

Campos derivados ao transitar:
- `em_execucao` → `inicio_execucao = now()`
- `pronto` → `fim_execucao = now()`
- `entregue` → `entregue_em = now()`
- `suspenso` → persiste `motivo_suspensao`

---

## 5. Permissões (Fase 1)

Matriz em `lib/permissions.ts` controla a navegação:

| Ação | superadmin | proprietario | gerente | recepcao | operacional | financeiro |
|---|---|---|---|---|---|---|
| dashboard:view | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| clientes:write | ✔ | ✔ | ✔ | ✔ | — | — |
| servicos:write | ✔ | ✔ | ✔ | — | — | — |
| agenda:write | ✔ | ✔ | ✔ | ✔ | — | — |
| ordens:execute | ✔ | ✔ | ✔ | — | ✔ | — |
| financeiro:view | ✔ | ✔ | ✔ | — | — | ✔ |

A permissão final é no banco via RLS: a UI apenas esconde o que o
usuário não pode fazer.

---

## 6. Camada de dados

`lib/data/queries.ts` é a única porta de entrada aos dados. Cada
função:

1. Obtém o Supabase (server client com RLS).
2. Obtém o `tenant_id` ativo.
3. Se Supabase não configurado, retorna o fallback de demo.
4. Caso contrário, executa a query no banco.

Isso mantém as páginas limpas e permite trocar a fonte de dados sem
reescrever a UI.

---

## 7. UX

- **Design system.** Azul-marinho (`--brand-navy`) + azul elétrico
  (`--brand-electric`) como cores da marca. Tokens expostos como
  variáveis CSS, com tema claro e escuro.
- **Tipografia.** Inter via `next/font`, pesos 400–600.
- **Densidade.** Cards com padding generoso; tabelas compactas;
  status com cores inequívocas.
- **Feedback.** Estados `pending` em todos os forms (via
  `useFormStatus`), estado vazio com CTA (`EmptyState`), mensagens de
  erro visíveis.

---

## 8. Roadmap técnico

| Fase | Entregas-chave |
|---|---|
| **1 — Fundação (concluída)** | Auth, multi-tenant, operação, Kanban, dashboard. |
| **2 — Gestão administrativa (concluída)** | Funcionários, estoque, consumo por OS, financeiro, comissões, relatórios, DRE gerencial. |
| **3 — Expansão comercial (concluída)** | Pacotes pré-pagos, programa de pontos, portal público, agendamento online, fila de notificações, avaliações, exportação CSV, baixa automática de estoque, custo real da OS. |
| **4 — Plataforma SaaS (concluída)** | Painel /admin do superadmin, catálogo de planos com limites e features, assinaturas (trial → ativa → inadimplente → cancelada), invoices, webhook idempotente de gateway com verificação HMAC, view v_saas_metricas (MRR/ARR), DRE usa custo real. |
| **5 — Inteligência (concluída)** | Previsão de demanda (heatmap dia × hora), recomendações operacionais derivadas dos dados, projeção de DRE, campanhas automáticas (reativação / aniversário / pós-atendimento / lembrete) enfileirando em `notificacoes`, cron endpoint protegido por `CRON_SECRET`, views analíticas (`v_demanda_por_slot`, `v_ltv_por_cliente`, `v_servico_margem`). |
| **3 — Expansão comercial** | CRM, fidelização, portal do cliente, notificações (WhatsApp/e-mail), agendamento online, pacotes. |
| **4 — Plataforma SaaS** | Painel superadmin, planos, assinaturas, cobrança recorrente (gateway), limites por plano. |
| **5 — Inteligência** | Previsão de demanda, recomendações, análise de rentabilidade, automação de campanhas. |

### Integrações preparadas (sem credenciais ainda)

- **Gateway de pagamento** — Stripe/Pagar.me/Asaas (Fase 4).
- **Mensageria** — Z-API/Twilio/Meta (Fase 3).
- **E-mail transacional** — Resend/SendGrid (Fase 3).

A arquitetura isola essas integrações em `lib/integrations/*` (a criar
na fase respectiva), mantendo a aplicação funcional sem elas.

---

## 9. Qualidade e segurança

- Validação Zod em todas as ações do servidor.
- RLS em todas as tabelas com `tenant_id`.
- Nunca imprimir mensagens brutas do banco para o cliente em produção.
- Logs de mudança de status em `ordem_historico`.
- Preparado para LGPD: campo `consent_marketing` em clientes; na Fase 2
  entram exclusão por solicitação e política de retenção.
- Transações agrupadas via RPC (`provision_tenant`,
  `next_ordem_numero`). Operações de OS e estoque serão encapsuladas em
  funções SQL na Fase 2.
