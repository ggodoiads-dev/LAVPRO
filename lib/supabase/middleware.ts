import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { IS_SUPABASE_CONFIGURED, SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Atualiza/propaga cookies da sessão do Supabase em cada request.
 * Retorna um NextResponse pronto para continuar o pipeline.
 */
export async function updateSession(req: NextRequest) {
  const res = NextResponse.next({ request: req });
  if (!IS_SUPABASE_CONFIGURED) return { res, user: null };

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          req.cookies.set(name, value),
        );
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { res, user };
}
