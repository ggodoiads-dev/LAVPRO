"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { veiculoSchema } from "@/lib/validators";

export interface ActionState {
  error?: string;
}

export async function createVeiculo(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = veiculoSchema.safeParse({
    cliente_id: form.get("cliente_id"),
    placa: form.get("placa"),
    marca: form.get("marca"),
    modelo: form.get("modelo"),
    versao: form.get("versao"),
    ano: form.get("ano"),
    cor: form.get("cor"),
    categoria: form.get("categoria"),
    quilometragem: form.get("quilometragem"),
    observacoes: form.get("observacoes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const session = await getSession();
  const supabase = createServerSupabase();
  if (!supabase || !session.activeTenant) {
    return {
      error:
        "É preciso estar autenticado em uma empresa para cadastrar. Configure o Supabase e conclua o registro.",
    };
  }

  const { error } = await supabase.from("veiculos").insert({
    ...parsed.data,
    tenant_id: session.activeTenant.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/veiculos");
  redirect("/veiculos");
}
