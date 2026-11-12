import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2,
  CreditCard,
  Gauge,
  History,
  Package,
  ShieldCheck,
} from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { isSuperadminUser } from "@/lib/data/queries";
import { IS_SUPABASE_CONFIGURED } from "@/lib/supabase/env";
import { BrandMark } from "@/components/brand";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NAV = [
  { href: "/admin",              label: "Visão geral", icon: Gauge },
  { href: "/admin/empresas",     label: "Empresas",    icon: Building2 },
  { href: "/admin/assinaturas",  label: "Assinaturas", icon: ShieldCheck },
  { href: "/admin/planos",       label: "Planos",      icon: Package },
  { href: "/admin/faturas",      label: "Faturas",     icon: CreditCard },
  { href: "/admin/eventos",      label: "Eventos",     icon: History },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const isSuper = await isSuperadminUser();

  // Em produção exige perfil superadmin. Em modo demo liberamos para
  // navegação (identificando como DEMO).
  if (IS_SUPABASE_CONFIGURED && !isSuper) {
    if (!session.user) redirect("/login?redirect=/admin");
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden h-screen w-60 shrink-0 border-r border-border bg-primary text-primary-foreground md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-primary-foreground/10 px-5">
          <BrandMark size="md" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">LAVPRO · Admin</span>
            <span className="text-[10px] uppercase tracking-wider text-primary-foreground/70">
              SaaS Platform
            </span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-primary-foreground/10 p-3">
          <Link
            href="/dashboard"
            className="block rounded-md border border-primary-foreground/20 px-3 py-2 text-center text-xs text-primary-foreground/80 hover:bg-primary-foreground/10"
          >
            ← Voltar ao app
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-x-hidden bg-muted/20 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-7xl">
            {!IS_SUPABASE_CONFIGURED ? (
              <Badge variant="warning" className="mb-4">
                Painel em modo demonstração — métricas não representam
                dados reais.
              </Badge>
            ) : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
