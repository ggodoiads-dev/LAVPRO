# Deploy do LAVPRO

Guia para subir o LAVPRO em produção com **Vercel** (frontend + API +
cron) e, opcionalmente, **Railway** (instância Docker com worker,
alternativa ao Vercel ou complemento).

O banco é **Supabase gerenciado** em todos os cenários.

---

## 0. Pré-requisitos

- Projeto Supabase criado (free tier serve para começar).
- Conta Vercel conectada ao GitHub (repo `ggodoiads-dev/LAVPRO`).
- Conta Railway (apenas se for usar Railway).
- Branch da entrega: `claude/lavpro-saas-erp-atnwlm`.

---

## 1. Supabase — banco e autenticação

### 1.1 Aplicar as migrations

No **SQL Editor** do Supabase, execute na ordem:

1. `supabase/migrations/0001_init_schema.sql`
2. `supabase/migrations/0002_rls_policies.sql`
3. `supabase/migrations/0003_seed_defaults.sql`
4. `supabase/migrations/0004_phase2_admin.sql`
5. `supabase/migrations/0005_phase3_crm.sql`
6. `supabase/migrations/0006_phase4_saas.sql`
7. `supabase/migrations/0007_phase5_intelligence.sql`

> Ou use a CLI oficial: `supabase link --project-ref <ref>` e
> `supabase db push`.

### 1.2 Configurações de Auth

- Em **Authentication → URL Configuration**:
  - Site URL: `https://<seu-dominio>`
  - Redirect URLs: `https://<seu-dominio>/login`
- E-mail: ative templates em pt-BR se quiser. O registro usa o próprio
  fluxo do Supabase.

### 1.3 Chaves

Em **Project Settings → API**, anote:

- `URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (nunca exponha; só backend)

---

## 2. Vercel — frontend + API + cron (recomendado)

### 2.1 Importar repositório

1. New Project → Import `ggodoiads-dev/LAVPRO` → branch
   `claude/lavpro-saas-erp-atnwlm`.
2. Framework preset: **Next.js** (detectado).
3. Build command: padrão `next build`.
4. Install command: `pnpm install --frozen-lockfile`.

### 2.2 Variáveis de ambiente

Em **Project → Settings → Environment Variables** (Production + Preview):

| Nome | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service role (secret) |
| `NEXT_PUBLIC_APP_URL` | `https://<seu-dominio>` |
| `NEXT_PUBLIC_APP_NAME` | `LAVPRO` |
| `CRON_SECRET` | segredo opaco (gere com `openssl rand -hex 32`) |
| `GATEWAY_PROVIDER` | `stripe` \| `pagarme` \| `asaas` (quando existir) |
| `GATEWAY_WEBHOOK_SECRET` | segredo compartilhado com o gateway |
| `GATEWAY_API_KEY` | chave privada do provedor |

Sem `GATEWAY_*`, o webhook responde `503` — intencional. Nenhuma
assinatura é promovida sem evento assinado.

### 2.3 Cron (incluso no `vercel.json`)

`/api/cron/campanhas` roda **a cada 15 minutos**. A Vercel injeta o
header de autorização padrão; nosso endpoint também exige
`x-lavpro-cron: <CRON_SECRET>`. No painel, em **Settings → Cron Jobs**,
adicione o header `x-lavpro-cron` com o valor do `CRON_SECRET`.

### 2.4 Domínio

- Aponte seu domínio em **Settings → Domains**.
- Marque `Redirect www → root` se quiser.

### 2.5 Webhook do gateway

Após obter credenciais do provedor, cadastre o webhook em:
```
https://<seu-dominio>/api/webhooks/gateway
```
Protocolo: `POST`. Header de assinatura: `x-lavpro-signature`
(formato `t=<unix>,v1=<hex-hmac>`). Veja
`lib/integrations/gateway.ts`.

---

## 3. Railway — Docker alternativo (opcional)

Útil se você preferir rodar o Next.js em um container (por exemplo,
para manter workers junto, ou política de dados). Vercel continua
possível para o cron; neste caso o Railway hospeda só o app.

### 3.1 Importar repo

1. New Project → Deploy from GitHub Repo → selecione `LAVPRO`.
2. Branch `claude/lavpro-saas-erp-atnwlm`.
3. Railway detecta o `Dockerfile` e o `railway.json` automaticamente.

### 3.2 Variáveis

Em **Variables**, adicione as mesmas chaves listadas na seção da
Vercel (sem o `vercel.json` para cron). Para o cron, você tem 2
opções:

- **Railway Cron** (recomendado): em **Settings → Cron**, crie um job
  com comando:
  ```sh
  wget -qO- -S --header "x-lavpro-cron: $CRON_SECRET" \
    https://<seu-dominio>/api/cron/campanhas
  ```
  Schedule: `*/15 * * * *`.
- **Supabase Scheduled Function** chamando o mesmo endpoint.

### 3.3 Domínio e health check

- Gere um domínio público em **Settings → Networking → Public Domain**
  ou aponte um custom.
- O `railway.json` configura `healthcheckPath: /api/health`, timeout
  30s, restart `ON_FAILURE`.

### 3.4 Observação sobre rate-limit

O rate-limit atual é em memória (`lib/rate-limit.ts`). Com várias
replicas no Railway, a contagem fica por replica. Para rate-limit
global, trocar por Upstash Redis com o mesmo contrato `rateLimit()`.
Uma replica é o padrão e é suficiente para começar.

---

## 4. Verificação pós-deploy

1. **Health**: `GET https://<seu-dominio>/api/health` deve retornar
   `{ ok: true }` e listar quais integrações estão configuradas.
2. **Login**: crie uma conta em `/registro`. O Supabase chama
   `provision_tenant` e você deve ver o dashboard populado.
3. **Portal público**: `/book/<slug>` abre; `/portal/<slug>` consulta
   por placa + telefone.
4. **Webhook**: se o gateway já estiver conectado, dispare um evento
   de teste e verifique `/admin/eventos`.
5. **Cron**: aguarde até 15 min, depois confira execuções em
   `/inteligencia`.

---

## 5. Playbooks operacionais

- **Trocar segredo de webhook**: redeploy com novo `GATEWAY_WEBHOOK_SECRET`
  **e** atualizar no painel do gateway. Até ambos baterem, eventos
  entram com `401` (vide logs).
- **Forçar inadimplência**: `/admin` → **Eventos** mostra a origem;
  também dá para chamar a RPC `marcar_assinatura_inadimplente(uuid)`
  no SQL Editor.
- **Rebuild das campanhas padrão num tenant**: `select seed_campanhas_padrao('<tenant_uuid>');`.
- **Reprocessar uma OS para gerar comissão**: `select gerar_comissoes_para_ordem('<ordem_uuid>');`.

---

## 6. Roadmap pós-deploy (quando fizer sentido)

- Rate-limit distribuído com Upstash Redis.
- Fila de envio real para notificações (Z-API/Meta Cloud/Twilio/Resend).
- Emissão de recibo em PDF.
- Observabilidade: Sentry + OpenTelemetry (hooks de request).
- Backup lógico adicional além do do Supabase (pg_dump agendado em
  bucket próprio).
