"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { agendamentoSchema } from "@/lib/validators";

export interface ActionState {
  error?: string;
}

export async function createAgendamento(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const servicoIds = form.getAll("servico_ids").map((v) => String(v));
  const parsed = agendamentoSchema.safeParse({
    unidade_id: form.get("unidade_id"),
    cliente_id: form.get("cliente_id"),
    veiculo_id: form.get("veiculo_id"),
    box_id: form.get("box_id"),
    funcionario_id: form.get("funcionario_id"),
    inicio: form.get("inicio"),
    duracao_min: form.get("duracao_min"),
    servico_ids: servicoIds,
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

  const inicio = new Date(parsed.data.inicio);
  const fim = new Date(inicio.getTime() + parsed.data.duracao_min * 60_000);

  // Verifica conflito simples de box (se informado).
  if (parsed.data.box_id) {
    const { count } = await supabase
      .from("agendamentos")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", session.activeTenant.id)
      .eq("box_id", parsed.data.box_id)
      .in("status", ["pendente", "confirmado"])
      .lt("inicio", fim.toISOString())
      .gt("fim", inicio.toISOString());
    if ((count ?? 0) > 0) {
      return {
        error:
          "Box já ocupado neste horário. Escolha outro horário ou outro box.",
      };
    }
  }

  const { data: ag, error } = await supabase
    .from("agendamentos")
    .insert({
      tenant_id: session.activeTenant.id,
      unidade_id: parsed.data.unidade_id,
      cliente_id: parsed.data.cliente_id,
      veiculo_id: parsed.data.veiculo_id,
      box_id: parsed.data.box_id ?? null,
      funcionario_id: parsed.data.funcionario_id ?? null,
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
      observacoes: parsed.data.observacoes ?? null,
      status: "confirmado",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Serviços do agendamento
  if (ag) {
    const { data: servs } = await supabase
      .from("servicos")
      .select("id, preco_base, duracao_min")
      .in("id", parsed.data.servico_ids);
    const rows = (servs ?? []).map((s) => ({
      agendamento_id: ag.id,
      servico_id: s.id,
      preco: s.preco_base,
      duracao_min: s.duracao_min,
    }));
    if (rows.length) await supabase.from("agendamento_servicos").insert(rows);
  }

  revalidatePath("/agendamentos");
  redirect("/agendamentos");
}
