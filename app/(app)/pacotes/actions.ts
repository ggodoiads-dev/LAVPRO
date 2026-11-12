"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { pacoteSchema, venderPacoteSchema } from "@/lib/validators";

export interface ActionState {
  error?: string;
}

export async function createPacote(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const itensRaw = form.get("itens");
  let itens: unknown = [];
  try {
    itens = JSON.parse(String(itensRaw ?? "[]"));
  } catch {
    return { error: "Itens inválidos." };
  }
  const parsed = pacoteSchema.safeParse({
    nome: form.get("nome"),
    descricao: form.get("descricao"),
    preco: form.get("preco"),
    validade_dias: form.get("validade_dias"),
    ativo: form.get("ativo") !== "off",
    itens,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const session = await getSession();
  const supabase = createServerSupabase();
  if (!supabase || !session.activeTenant) {
    return { error: "Configure o Supabase e conclua o cadastro da empresa." };
  }

  const { data: pack, error } = await supabase
    .from("pacotes")
    .insert({
      tenant_id: session.activeTenant.id,
      nome: parsed.data.nome,
      descricao: parsed.data.descricao ?? null,
      preco: parsed.data.preco,
      validade_dias: parsed.data.validade_dias,
      ativo: parsed.data.ativo,
    })
    .select("id")
    .single();
  if (error || !pack) return { error: error?.message ?? "Erro ao salvar pacote." };

  const rows = parsed.data.itens.map((i) => ({
    pacote_id: pack.id,
    servico_id: i.servico_id,
    quantidade: i.quantidade,
  }));
  if (rows.length) await supabase.from("pacote_itens").insert(rows);

  revalidatePath("/pacotes");
  redirect("/pacotes");
}

export async function venderPacote(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = venderPacoteSchema.safeParse({
    cliente_id: form.get("cliente_id"),
    pacote_id: form.get("pacote_id"),
    valor: form.get("valor"),
    observacoes: form.get("observacoes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const session = await getSession();
  const supabase = createServerSupabase();
  if (!supabase || !session.activeTenant) {
    return { error: "Configure o Supabase para vender pacotes reais." };
  }

  const { error } = await supabase.rpc("vender_pacote", {
    p_cliente: parsed.data.cliente_id,
    p_pacote: parsed.data.pacote_id,
    p_valor: parsed.data.valor ?? null,
    p_observacoes: parsed.data.observacoes ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/pacotes");
  redirect("/pacotes");
}
