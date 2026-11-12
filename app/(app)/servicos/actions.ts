"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { servicoSchema } from "@/lib/validators";

export interface ActionState {
  error?: string;
}

export async function createServico(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = servicoSchema.safeParse({
    nome: form.get("nome"),
    categoria: form.get("categoria"),
    descricao: form.get("descricao"),
    preco_base: form.get("preco_base"),
    custo_estimado: form.get("custo_estimado"),
    duracao_min: form.get("duracao_min"),
    funcionarios_min: form.get("funcionarios_min"),
    comissao_percentual: form.get("comissao_percentual"),
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

  const { error } = await supabase.from("servicos").insert({
    ...parsed.data,
    tenant_id: session.activeTenant.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/servicos");
  redirect("/servicos");
}
