import { NextResponse, type NextRequest } from "next/server";
import {
  GATEWAY_PROVIDER,
  IS_GATEWAY_CONFIGURED,
  verifyWebhookSignature,
  type GatewayEvent,
} from "@/lib/integrations/gateway";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Endpoint de webhook do gateway de pagamento.
 *
 * Comportamento:
 *   1. Lê o corpo RAW e verifica o header `x-lavpro-signature`.
 *   2. Decodifica o JSON e valida que existe um `event.id`.
 *   3. INSERT em webhook_events com `event_id` UNIQUE — se já existia,
 *      responde 200 (idempotente) sem reprocessar.
 *   4. Resolve o tenant (por id ou slug) e chama a RPC apropriada:
 *        ativar_assinatura / marcar_assinatura_inadimplente /
 *        cancelar_assinatura. O frontend nunca executa essa transição.
 *   5. Marca o evento como processado. Em erro, grava `erro` e responde
 *      500 para que o gateway retransmita.
 */
export async function POST(req: NextRequest) {
  if (!IS_GATEWAY_CONFIGURED) {
    return NextResponse.json(
      {
        ok: false,
        reason: "gateway_not_configured",
        hint:
          "Defina GATEWAY_PROVIDER e GATEWAY_WEBHOOK_SECRET nas variáveis de ambiente.",
      },
      { status: 503 },
    );
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get("x-lavpro-signature");

  const verification = verifyWebhookSignature({ rawBody, signatureHeader });
  if (!verification.ok) {
    return NextResponse.json(
      { ok: false, reason: verification.reason },
      { status: 401 },
    );
  }

  let event: GatewayEvent;
  try {
    event = JSON.parse(rawBody) as GatewayEvent;
  } catch {
    return NextResponse.json(
      { ok: false, reason: "invalid_json" },
      { status: 400 },
    );
  }
  if (!event?.id || !event.type) {
    return NextResponse.json(
      { ok: false, reason: "missing_fields" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, reason: "service_client_unavailable" },
      { status: 503 },
    );
  }

  // Idempotência: tenta inserir; se houver conflito em (gateway, event_id),
  // significa que já processamos esse evento antes.
  const { error: insErr } = await supabase.from("webhook_events").insert({
    gateway: GATEWAY_PROVIDER ?? "unknown",
    event_id: event.id,
    event_type: event.type,
    payload: event,
  });

  if (insErr) {
    // Supabase retorna o código "23505" para unique_violation.
    if ((insErr as { code?: string }).code === "23505") {
      return NextResponse.json({ ok: true, deduped: true });
    }
    return NextResponse.json(
      { ok: false, reason: "persist_failed", detail: insErr.message },
      { status: 500 },
    );
  }

  // Resolve tenant por id direto ou pelo slug.
  const tenantId = await resolveTenant(supabase, event);
  if (!tenantId) {
    await markProcessed(supabase, event.id, "tenant_not_resolved");
    return NextResponse.json(
      { ok: false, reason: "tenant_not_resolved" },
      { status: 404 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.completed":
      case "subscription.active":
      case "subscription.renewed":
      case "invoice.paid": {
        const plano = event.data?.plano_codigo ?? "starter";
        await supabase.rpc("ativar_assinatura", {
          p_tenant: tenantId,
          p_plano_codigo: plano,
          p_gateway: GATEWAY_PROVIDER ?? null,
          p_subscription_id: event.data?.subscription_id ?? null,
        });
        break;
      }
      case "subscription.payment_failed":
      case "invoice.payment_failed": {
        await supabase.rpc("marcar_assinatura_inadimplente", {
          p_tenant: tenantId,
          p_motivo: event.data?.motivo ?? null,
        });
        break;
      }
      case "subscription.canceled": {
        await supabase.rpc("cancelar_assinatura", {
          p_tenant: tenantId,
          p_motivo: event.data?.motivo ?? null,
        });
        break;
      }
      default:
        // Evento desconhecido: só armazenamos. 200 para o gateway não reenviar.
        await markProcessed(supabase, event.id, null, "unhandled");
        return NextResponse.json({ ok: true, handled: false });
    }

    await markProcessed(supabase, event.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markProcessed(supabase, event.id, msg);
    return NextResponse.json(
      { ok: false, reason: "processing_failed", detail: msg },
      { status: 500 },
    );
  }
}

async function resolveTenant(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  event: GatewayEvent,
): Promise<string | null> {
  const direto = event.data?.tenant_id;
  if (direto) return String(direto);

  const slug = event.data?.tenant_slug;
  if (slug) {
    const { data } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    return (data as { id: string } | null)?.id ?? null;
  }

  const subId = event.data?.subscription_id;
  if (subId) {
    const { data } = await supabase
      .from("assinaturas")
      .select("tenant_id")
      .eq("gateway_subscription_id", subId)
      .maybeSingle();
    return (data as { tenant_id: string } | null)?.tenant_id ?? null;
  }

  return null;
}

async function markProcessed(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  eventId: string,
  erro: string | null = null,
  _tag: string | null = null,
) {
  await supabase
    .from("webhook_events")
    .update({ processed_at: new Date().toISOString(), erro })
    .eq("event_id", eventId);
}
