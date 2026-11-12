/**
 * LAVPRO - Camada de gateway de pagamento.
 *
 * Esta porta define o contrato que qualquer gateway (Stripe, Pagar.me,
 * Asaas, etc.) deve expor. A Fase 4 entrega:
 *
 *   • o endpoint seguro /api/webhooks/gateway, que verifica assinatura
 *     HMAC-SHA256, é idempotente (gravação em webhook_events com UNIQUE
 *     em event_id) e nunca marca assinatura como ativa sem um evento
 *     assinado do gateway;
 *   • as RPCs de transição (ativar/inadimplente/cancelar) implementadas
 *     no banco em 0006_phase4_saas.sql — frontend não altera estado;
 *   • o stub `createCheckoutSession` para iniciar um checkout no
 *     provedor real quando as credenciais existirem.
 *
 * Variáveis de ambiente esperadas (não comitadas):
 *   GATEWAY_PROVIDER=stripe|pagarme|asaas
 *   GATEWAY_WEBHOOK_SECRET=<segredo da assinatura do webhook>
 *   GATEWAY_API_KEY=<chave privada do provedor>
 *
 * Enquanto GATEWAY_WEBHOOK_SECRET não estiver presente, o endpoint
 * retorna 503 e registra o motivo em webhook_events.erro — nenhuma
 * assinatura é alterada.
 */

import crypto from "node:crypto";

export type GatewayProvider = "stripe" | "pagarme" | "asaas";

export interface GatewayEvent {
  id: string;
  type:
    | "checkout.completed"
    | "subscription.active"
    | "subscription.renewed"
    | "subscription.payment_failed"
    | "subscription.canceled"
    | "invoice.paid"
    | "invoice.payment_failed"
    | string;
  data: Record<string, unknown> & {
    tenant_id?: string;
    tenant_slug?: string;
    plano_codigo?: string;
    subscription_id?: string;
    invoice_id?: string;
    valor?: number;
    motivo?: string;
  };
}

export const GATEWAY_PROVIDER: GatewayProvider | null =
  (process.env.GATEWAY_PROVIDER as GatewayProvider | undefined) ?? null;

export const GATEWAY_WEBHOOK_SECRET = process.env.GATEWAY_WEBHOOK_SECRET ?? "";

export const IS_GATEWAY_CONFIGURED =
  Boolean(GATEWAY_PROVIDER) && Boolean(GATEWAY_WEBHOOK_SECRET);

/**
 * Verifica a assinatura HMAC-SHA256 do webhook.
 * Convenção adotada (compatível com Stripe/Asaas e similar):
 *   header `x-lavpro-signature: t=<timestamp>,v1=<hex-hmac>`
 * O HMAC é calculado sobre `${timestamp}.${rawBody}` usando a chave
 * compartilhada em GATEWAY_WEBHOOK_SECRET. Rejeita se:
 *   - secret ausente,
 *   - formato inválido,
 *   - timestamp mais antigo que 5 minutos (replay protection),
 *   - HMAC não confere.
 */
export function verifyWebhookSignature(opts: {
  rawBody: string;
  signatureHeader: string | null;
  toleranceSeconds?: number;
}): { ok: true } | { ok: false; reason: string } {
  const { rawBody, signatureHeader, toleranceSeconds = 300 } = opts;
  if (!GATEWAY_WEBHOOK_SECRET) {
    return { ok: false, reason: "secret_not_configured" };
  }
  if (!signatureHeader) return { ok: false, reason: "missing_signature" };

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k?.trim(), v?.trim()];
    }),
  ) as Record<string, string | undefined>;

  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return { ok: false, reason: "bad_signature_format" };

  const ts = Number(t);
  if (!Number.isFinite(ts)) return { ok: false, reason: "bad_timestamp" };
  const skew = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (skew > toleranceSeconds) {
    return { ok: false, reason: "signature_too_old" };
  }

  const expected = crypto
    .createHmac("sha256", GATEWAY_WEBHOOK_SECRET)
    .update(`${t}.${rawBody}`)
    .digest("hex");

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(v1, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: "signature_mismatch" };
  }
  return { ok: true };
}

/**
 * Cria sessão de checkout no gateway. Stub — implementar com o SDK do
 * provedor escolhido quando as credenciais existirem.
 */
export async function createCheckoutSession(_opts: {
  tenantId: string;
  planoCodigo: string;
  returnUrl: string;
}): Promise<{ url: string } | { error: string }> {
  if (!IS_GATEWAY_CONFIGURED) {
    return { error: "gateway_not_configured" };
  }
  // Implementação real plugada aqui quando houver credenciais:
  //   switch (GATEWAY_PROVIDER) {
  //     case "stripe":  return stripeCheckout(opts);
  //     case "pagarme": return pagarmeCheckout(opts);
  //     case "asaas":   return asaasCheckout(opts);
  //   }
  return { error: "not_implemented" };
}
