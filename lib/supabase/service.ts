import { createClient } from "@supabase/supabase-js";
import {
  IS_SUPABASE_CONFIGURED,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "./env";

/**
 * Cliente com chave de SERVICE ROLE — ignora RLS. Uso restrito a
 * handlers de backend confiáveis (webhooks, jobs). NUNCA importar em
 * código client-side.
 */
export function createServiceClient() {
  if (!IS_SUPABASE_CONFIGURED || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
