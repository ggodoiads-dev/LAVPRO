"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { registroSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";
import { APP_URL } from "@/lib/supabase/env";

export interface RegistroState {
  error?: string;
  info?: string;
}

export async function registroAction(
  _prev: RegistroState,
  formData: FormData,
): Promise<RegistroState> {
  const supabase = createServerSupabase();
  if (!supabase) {
    return {
      error:
        "Supabase não configurado. Adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY ao .env.local.",
    };
  }

  const parsed = registroSchema.safeParse({
    nome: formData.get("nome"),
    empresa: formData.get("empresa"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { email, password, nome, empresa } = parsed.data;
  const slug = `${slugify(empresa)}-${Math.random().toString(36).slice(2, 6)}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${APP_URL}/login`,
      data: { nome, empresa },
    },
  });

  if (error) return { error: error.message };

  // Se o Supabase não exigir confirmação por e-mail, provisiona já.
  if (data.user && !data.user.identities?.length) {
    return {
      info: "Confirme seu e-mail para ativar a conta.",
    };
  }

  // Cria profile + tenant via função RPC.
  await supabase.from("profiles").upsert({ id: data.user!.id, nome, email });
  const { error: rpcError } = await supabase.rpc("provision_tenant", {
    p_nome: empresa,
    p_slug: slug,
  });

  if (rpcError) {
    return {
      info: "Conta criada. Faça login para concluir a configuração.",
    };
  }

  redirect("/dashboard");
}
