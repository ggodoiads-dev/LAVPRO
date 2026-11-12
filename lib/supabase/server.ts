import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { IS_SUPABASE_CONFIGURED, SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Cliente no servidor com cookies da sessão do usuário (RLS aplicada).
 * Retorna null quando Supabase não está configurado — o chamador deve
 * verificar isso e tratar modo demo.
 */
export function createServerSupabase() {
  if (!IS_SUPABASE_CONFIGURED) return null;
  const cookieStore = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // chamadas fora de um Server Action — ok ignorar.
        }
      },
    },
  });
}
