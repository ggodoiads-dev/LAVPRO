import Link from "next/link";
import { Bell, Plus } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { Badge } from "@/components/ui/badge";

export async function Header() {
  const session = await getSession();
  const nome = session.profile?.nome ?? session.user?.email ?? "Operador";
  const empresa = session.activeTenant?.nome ?? null;
  const plano = session.activeTenant?.plano;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex flex-1 items-center gap-3">
        {session.isDemo ? (
          <Badge variant="warning" className="hidden md:inline-flex">
            Modo demonstração — configure o Supabase em .env.local
          </Badge>
        ) : plano ? (
          <Badge variant={plano === "trial" ? "warning" : "secondary"} className="hidden md:inline-flex capitalize">
            {plano}
          </Badge>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5">
        <Button asChild variant="electric" size="sm" className="hidden sm:inline-flex">
          <Link href="/ordens/novo">
            <Plus className="h-4 w-4" /> Nova OS
          </Link>
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notificações">
          <Bell className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        <UserMenu nome={nome} email={session.user?.email} empresa={empresa} />
      </div>
    </header>
  );
}
