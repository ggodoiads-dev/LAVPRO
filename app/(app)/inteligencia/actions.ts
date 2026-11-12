"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";

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
