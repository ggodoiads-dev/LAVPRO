"use server";

import { headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  IS_SUPABASE_CONFIGURED,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from "@/lib/supabase/env";
import { agendamentoPublicoSchema } from "@/lib/validators";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export interface PublicBookState {
  error?: string;
  ok?: boolean;
  codigo?: string;
}

export async function reservarAgendamento(
  _prev: PublicBookState,
  form: FormData,
): Promise<PublicBookState> {
  const ip = clientIp(headers());
  const limited = rateLimit("book", ip);
  if (!limited.ok) {
    return {
      error: `Muitas tentativas. Tente novamente em ${limited.retryAfter}s.`,
    };
  }

  const servicoIds = form.getAll("servico_ids").map((x) => String(x));
  const parsed = agendamentoPublicoSchema.safeParse({
    slug: form.get("slug"),
    nome: form.get("nome"),
    telefone: form.get("telefone"),
    email: form.get("email"),
    placa: form.get("placa"),
    marca: form.get("marca"),
    modelo: form.get("modelo"),
    categoria: form.get("categoria") ?? "hatch",
    inicio: form.get("inicio"),
    servico_ids: servicoIds,
    observacoes: form.get("observacoes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  if (!IS_SUPABASE_CONFIGURED) {
    // Modo demo: não envia ao banco; retorna sucesso simbólico.
    return {
      ok: true,
      codigo: "DEMO-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
    };
  }

  // Cliente anônimo (sem sessão) — a RPC é SECURITY DEFINER.
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: { getAll() { return []; }, setAll() {} },
  });

  const { data, error } = await supabase.rpc("criar_agendamento_publico", {
    p_slug: parsed.data.slug,
    p_nome: parsed.data.nome,
    p_telefone: parsed.data.telefone,
    p_email: parsed.data.email ?? "",
    p_placa: parsed.data.placa,
    p_marca: parsed.data.marca ?? null,
    p_modelo: parsed.data.modelo ?? null,
    p_categoria: parsed.data.categoria,
    p_inicio: new Date(parsed.data.inicio).toISOString(),
    p_servico_ids: parsed.data.servico_ids,
    p_observacoes: parsed.data.observacoes ?? null,
  });

  if (error) return { error: error.message };
  return { ok: true, codigo: String(data).slice(0, 8).toUpperCase() };
}
