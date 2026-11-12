import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Cron endpoint que percorre todas as campanhas ativas de todos os
 * tenants e chama `executar_campanha` para cada uma. Projeto para ser
 * disparado por Supabase Scheduled Function ou Vercel Cron a cada
 * 15 minutos.
 *
 * Proteção: exige header `x-lavpro-cron: <CRON_SECRET>`. Sem CRON_SECRET,
 * responde 503 e não roda nada.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, reason: "cron_not_configured" },
      { status: 503 },
    );
  }
  const header = req.headers.get("x-lavpro-cron");
  if (header !== secret) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, reason: "service_client_unavailable" },
      { status: 503 },
    );
  }

  const { data: campanhas, error } = await supabase
    .from("campanhas")
    .select("id, tenant_id, codigo")
    .eq("ativo", true);
  if (error) {
    return NextResponse.json(
      { ok: false, reason: "query_failed", detail: error.message },
      { status: 500 },
    );
  }

  const resultados: {
    id: string;
    tenant_id: string;
    codigo: string;
    alvos?: number;
    enfileiradas?: number;
    erro?: string;
  }[] = [];

  for (const c of campanhas ?? []) {
    const { data, error: runErr } = await supabase.rpc("executar_campanha", {
      p_campanha: c.id,
    });
    if (runErr) {
      resultados.push({ ...c, erro: runErr.message });
      continue;
    }
    const payload = (data ?? {}) as { alvos?: number; enfileiradas?: number };
    resultados.push({
      ...c,
      alvos: payload.alvos,
      enfileiradas: payload.enfileiradas,
    });
  }

  return NextResponse.json({ ok: true, total: resultados.length, resultados });
}
