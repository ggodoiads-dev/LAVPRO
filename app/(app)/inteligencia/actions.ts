"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { campanhaEditSchema } from "@/lib/validators";

export interface ActionState {
  error?: string;
}

export async function executarCampanha(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const session = await getSession();
  const supabase = createServerSupabase();
  if (!supabase || !session.activeTenant) return;

  await supabase.rpc("executar_campanha", { p_campanha: id });

  revalidatePath("/inteligencia");
  revalidatePath("/notificacoes");
}

export async function toggleCampanha(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const ativo = formData.get("ativo") === "true";
  if (!id) return;
  const session = await getSession();
  const supabase = createServerSupabase();
  if (!supabase || !session.activeTenant) return;

  await supabase
    .from("campanhas")
    .update({ ativo: !ativo })
    .eq("id", id)
    .eq("tenant_id", session.activeTenant.id);

  revalidatePath("/inteligencia");
}

export async function salvarCampanha(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = campanhaEditSchema.safeParse({
    id: formData.get("id"),
    nome: formData.get("nome"),
    descricao: formData.get("descricao"),
    gatilho: formData.get("gatilho"),
    canal: formData.get("canal"),
    template_codigo: formData.get("template_codigo"),
    dias: formData.get("dias"),
    horas: formData.get("horas"),
    ativo: formData.get("ativo") !== "off",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const session = await getSession();
  const supabase = createServerSupabase();
  if (!supabase || !session.activeTenant) {
    return { error: "Configure o Supabase para editar campanhas reais." };
  }

  const parametros: Record<string, number> = {};
  if (parsed.data.dias !== undefined) parametros.dias = parsed.data.dias;
  if (parsed.data.horas !== undefined) parametros.horas = parsed.data.horas;

  const { error } = await supabase
    .from("campanhas")
    .update({
      nome: parsed.data.nome,
      descricao: parsed.data.descricao ?? null,
      gatilho: parsed.data.gatilho,
      canal: parsed.data.canal,
      template_codigo: parsed.data.template_codigo ?? null,
      parametros,
      ativo: parsed.data.ativo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("tenant_id", session.activeTenant.id);

  if (error) return { error: error.message };

  revalidatePath("/inteligencia");
  redirect("/inteligencia");
}
