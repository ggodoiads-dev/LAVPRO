"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { funcionarioSchema } from "@/lib/validators";

export interface ActionState {
  error?: string;
}

export async function createFuncionario(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = funcionarioSchema.safeParse({
    nome: form.get("nome"),
    cargo: form.get("cargo"),
    vinculo: form.get("vinculo") ?? "clt",
    admissao: form.get("admissao"),
    comissao_padrao: form.get("comissao_padrao"),
    ativo: form.get("ativo") !== "off",
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

  const { error } = await supabase.from("funcionarios").insert({
    ...parsed.data,
    tenant_id: session.activeTenant.id,
    unidade_id: session.activeMembership?.unidade_id ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/funcionarios");
  redirect("/funcionarios");
}
