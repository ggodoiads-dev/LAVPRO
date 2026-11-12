"use client";

import { createBrowserClient } from "@supabase/ssr";
import { IS_SUPABASE_CONFIGURED, SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Cliente de navegador. Requer envs públicas.
 * Em modo demo (envs ausentes) retorna null e a UI deve checar isso.
 */
export function createClient() {
  if (!IS_SUPABASE_CONFIGURED) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
