"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { contaPagarSchema, pagamentoSchema } from "@/lib/validators";

export interface ActionState {
  error?: string;
}

export async function createContaPagar(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = contaPagarSchema.safeParse({
    categoria_id: form.get("categoria_id"),
    descricao: form.get("descricao"),
    valor: form.get("valor"),
    vencimento: form.get("vencimento"),
    forma_id: form.get("forma_id"),
    recorrente: form.get("recorrente") === "on",
    pago_em: form.get("pago_em"),
    observacoes: form.get("observacoes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const session = await getSession();
  const supabase = createServerSupabase();
  if (!supabase || !session.activeTenant) {
    return { error: "Configure o Supabase para registrar lançamentos reais." };
  }

  const { error } = await supabase.from("contas_pagar").insert({
    tenant_id: session.activeTenant.id,
    categoria_id: parsed.data.categoria_id ?? null,
    descricao: parsed.data.descricao,
    valor: parsed.data.valor,
    vencimento: parsed.data.vencimento,
    forma_id: parsed.data.forma_id ?? null,
    recorrente: parsed.data.recorrente,
    pago_em: parsed.data.pago_em ?? null,
    observacoes: parsed.data.observacoes ?? null,
    created_by: session.user?.id ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/financeiro");
  redirect("/financeiro");
}

export async function toggleContaPaga(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const atualPago = formData.get("pago") === "true";
  if (!id) return;

  const session = await getSession();
  const supabase = createServerSupabase();
  if (!supabase || !session.activeTenant) return;

  await supabase
    .from("contas_pagar")
    .update({
      pago_em: atualPago ? null : new Date().toISOString().slice(0, 10),
    })
    .eq("id", id)
    .eq("tenant_id", session.activeTenant.id);

  revalidatePath("/financeiro");
}

export async function registrarPagamento(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = pagamentoSchema.safeParse({
    ordem_id: form.get("ordem_id"),
    forma_id: form.get("forma_id"),
    valor: form.get("valor"),
    observacoes: form.get("observacoes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const session = await getSession();
  const supabase = createServerSupabase();
  if (!supabase || !session.activeTenant) {
    return { error: "Configure o Supabase para registrar pagamentos reais." };
  }

  const { error } = await supabase.from("pagamentos").insert({
    tenant_id: session.activeTenant.id,
    ordem_id: parsed.data.ordem_id,
    forma_id: parsed.data.forma_id ?? null,
    valor: parsed.data.valor,
    observacoes: parsed.data.observacoes ?? null,
    por_user_id: session.user?.id ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/financeiro");
  redirect("/financeiro");
}
