import { NextResponse } from "next/server";
import { IS_SUPABASE_CONFIGURED } from "@/lib/supabase/env";
import { IS_GATEWAY_CONFIGURED } from "@/lib/integrations/gateway";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Health check usado por Vercel, Railway e uptime monitors. Sempre
 * responde 200 enquanto a aplicação responder — não exige que
 * dependências externas estejam ligadas (isso é questão de readiness
 * por dependência, não de liveness).
 *
 * O payload mostra *quais* integrações estão configuradas; apenas o
 * campo `ok` é contratual.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "lavpro",
    uptime: process.uptime(),
    now: new Date().toISOString(),
    build: process.env.VERCEL_GIT_COMMIT_SHA ??
           process.env.RAILWAY_GIT_COMMIT_SHA ??
           process.env.GIT_COMMIT ?? null,
    integrations: {
      supabase: IS_SUPABASE_CONFIGURED,
      gateway: IS_GATEWAY_CONFIGURED,
      cron: Boolean(process.env.CRON_SECRET),
    },
  });
}
