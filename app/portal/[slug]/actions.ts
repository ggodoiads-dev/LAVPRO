"use server";

import { headers } from "next/headers";
import { portalConsulta } from "@/lib/data/public";
import { portalConsultaSchema } from "@/lib/validators";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function portalConsultaAction(input: {
  slug: string;
  placa: string;
  telefone: string;
}) {
  const ip = clientIp(headers());
  const limited = rateLimit("portal", ip);
  if (!limited.ok) {
    return { error: "rate_limited" };
  }

  const parsed = portalConsultaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "dados_invalidos" };
  }
  return portalConsulta(parsed.data.slug, parsed.data.placa, parsed.data.telefone);
}
