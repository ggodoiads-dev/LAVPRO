"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { novaOrdemSchema } from "@/lib/validators";
import { canTransition } from "@/lib/status";
import type { StatusOS } from "@/types/database";

export interface ActionState {
  error?: string;
  ok?: boolean;
}

export async function createOrdem(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  // items vêm como JSON serializado do cliente.
  const itensRaw = form.get("itens");
  let itens: unknown = [];
  try {
    itens = JSON.parse(String(itensRaw ?? "[]"));
  } catch {
    return { error: "Lista de serviços inválida." };
  }

  const parsed = novaOrdemSchema.safeParse({
    unidade_id: form.get("unidade_id"),
    cliente_id: form.get("cliente_id"),
    veiculo_id: form.get("veiculo_id"),
    box_id: form.get("box_id"),
    prevista_em: form.get("prevista_em"),
    itens,
    desconto: form.get("desconto"),
    observacoes: form.get("observacoes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const session = await getSession();
  const supabase = createServerSupabase();
  if (!supabase || !session.activeTenant) {
    return { error: "Configure o Supabase e conclua o cadastro da empresa." };
  }

  const subtotal = parsed.data.itens.reduce(
    (a, it) => a + it.quantidade * it.preco_unit,
    0,
  );
  const total = Math.max(0, subtotal - parsed.data.desconto);

  // Reserva um número sequencial via RPC.
  const { data: numData, error: numError } = await supabase.rpc(
    "next_ordem_numero",
    { p_tenant: session.activeTenant.id },
  );
  if (numError) return { error: numError.message };

  const { data: os, error } = await supabase
    .from("ordens_servico")
    .insert({
      tenant_id: session.activeTenant.id,
      unidade_id: parsed.data.unidade_id,
      numero: numData as number,
      cliente_id: parsed.data.cliente_id,
      veiculo_id: parsed.data.veiculo_id,
      box_id: parsed.data.box_id ?? null,
      prevista_em: parsed.data.prevista_em ?? null,
      status: "recebido",
      subtotal,
      desconto: parsed.data.desconto,
      total,
      observacoes: parsed.data.observacoes ?? null,
    })
    .select("id, numero")
    .single();

  if (error || !os) return { error: error?.message ?? "Erro ao criar OS." };

  const itemRows = parsed.data.itens.map((it) => ({
    ordem_id: os.id,
    servico_id: it.servico_id,
    quantidade: it.quantidade,
    preco_unit: it.preco_unit,
    comissao_percentual: it.comissao_percentual,
  }));
  if (itemRows.length) await supabase.from("ordem_itens").insert(itemRows);

  revalidatePath("/ordens");
  revalidatePath("/kanban");
  revalidatePath("/dashboard");
  redirect("/kanban");
}

export async function moveOrdemStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const para = String(formData.get("para") ?? "") as StatusOS;
  const motivo = String(formData.get("motivo") ?? "").trim() || null;
  if (!id || !para) return;

  const session = await getSession();
  const supabase = createServerSupabase();
  if (!supabase || !session.activeTenant) return;

  const { data: os } = await supabase
    .from("ordens_servico")
    .select("id, status")
    .eq("id", id)
    .eq("tenant_id", session.activeTenant.id)
    .maybeSingle();
  if (!os) return;

  if (!canTransition(os.status as StatusOS, para)) return;

  const patch: Record<string, unknown> = { status: para };
  const nowIso = new Date().toISOString();
  if (para === "em_execucao") patch.inicio_execucao = nowIso;
  if (para === "pronto") patch.fim_execucao = nowIso;
  if (para === "entregue") patch.entregue_em = nowIso;
  if (para === "suspenso") patch.motivo_suspensao = motivo;

  await supabase
    .from("ordens_servico")
    .update(patch)
    .eq("id", id)
    .eq("tenant_id", session.activeTenant.id);

  revalidatePath("/kanban");
  revalidatePath("/ordens");
  revalidatePath("/dashboard");
}
