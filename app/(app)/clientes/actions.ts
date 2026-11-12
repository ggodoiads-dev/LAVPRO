"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { clienteSchema } from "@/lib/validators";

export interface ActionState {
  error?: string;
  ok?: boolean;
}

export async function createCliente(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = clienteSchema.safeParse({
    nome: form.get("nome"),
    documento: form.get("documento"),
    telefone: form.get("telefone"),
    whatsapp: form.get("whatsapp"),
    email: form.get("email"),
    endereco: form.get("endereco"),
    nascimento: form.get("nascimento"),
    observacoes: form.get("observacoes"),
    consent_marketing: form.get("consent_marketing") === "on",
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

  const { error } = await supabase.from("clientes").insert({
    ...parsed.data,
    tenant_id: session.activeTenant.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/clientes");
  redirect("/clientes");
}
