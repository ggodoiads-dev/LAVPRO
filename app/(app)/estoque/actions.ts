"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { movimentoSchema, produtoSchema } from "@/lib/validators";

export interface ActionState {
  error?: string;
}

export async function createProduto(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = produtoSchema.safeParse({
    codigo: form.get("codigo"),
    nome: form.get("nome"),
    categoria: form.get("categoria"),
    unidade: form.get("unidade") ?? "un",
    fornecedor: form.get("fornecedor"),
    custo_medio: form.get("custo_medio"),
    preco_venda: form.get("preco_venda"),
    estoque_atual: form.get("estoque_atual"),
    estoque_minimo: form.get("estoque_minimo"),
    local: form.get("local"),
    ativo: form.get("ativo") !== "off",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const session = await getSession();
  const supabase = createServerSupabase();
  if (!supabase || !session.activeTenant) {
    return { error: "Configure o Supabase e conclua o cadastro da empresa." };
  }

  const { error } = await supabase.from("produtos").insert({
    ...parsed.data,
    tenant_id: session.activeTenant.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/estoque");
  redirect("/estoque");
}

export async function registrarMovimento(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = movimentoSchema.safeParse({
    produto_id: form.get("produto_id"),
    tipo: form.get("tipo"),
    quantidade: form.get("quantidade"),
    custo_unit: form.get("custo_unit"),
    motivo: form.get("motivo"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const session = await getSession();
  const supabase = createServerSupabase();
  if (!supabase || !session.activeTenant) {
    return { error: "Configure o Supabase e conclua o cadastro da empresa." };
  }

  const { error } = await supabase.from("movimentos_estoque").insert({
    tenant_id: session.activeTenant.id,
    produto_id: parsed.data.produto_id,
    tipo: parsed.data.tipo,
    quantidade: parsed.data.quantidade,
    custo_unit: parsed.data.custo_unit ?? null,
    motivo: parsed.data.motivo ?? null,
    por_user_id: session.user?.id ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/estoque");
  redirect("/estoque");
}
