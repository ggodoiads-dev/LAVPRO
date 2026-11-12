import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const APP_ROUTES = [
  "/dashboard",
  "/clientes",
  "/veiculos",
  "/servicos",
  "/agendamentos",
  "/ordens",
  "/kanban",
  "/funcionarios",
  "/estoque",
  "/financeiro",
  "/relatorios",
  "/pacotes",
  "/fidelidade",
  "/notificacoes",
  "/inteligencia",
  "/configuracoes",
];

const AUTH_ROUTES = ["/login", "/registro", "/recuperar"];

export async function middleware(req: NextRequest) {
  const { res, user } = await updateSession(req);
  const { pathname } = req.nextUrl;

  const isAppRoute = APP_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  // Protege rotas da aplicação quando Supabase está configurado.
  if (isAppRoute && !user && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Usuário logado não deve ver páginas de autenticação.
  if (isAuthRoute && user) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    // Executa em todas as rotas exceto assets estáticos.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
