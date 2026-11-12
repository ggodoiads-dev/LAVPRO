"use server";

import { portalConsulta } from "@/lib/data/public";
import { portalConsultaSchema } from "@/lib/validators";

export async function portalConsultaAction(input: {
  slug: string;
  placa: string;
  telefone: string;
}) {
  const parsed = portalConsultaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "dados_invalidos" };
  }
  return portalConsulta(parsed.data.slug, parsed.data.placa, parsed.data.telefone);
}
