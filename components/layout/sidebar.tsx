"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  ChevronLeft,
  ClipboardList,
  Gauge,
  KanbanSquare,
  LayoutDashboard,
  Package,
  Settings,
  Users,
  Wrench,
  Car,
  Wallet,
  LineChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo, BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  group: "operacao" | "gestao" | "config";
  future?: boolean;
}

const NAV: NavItem[] = [
  { href: "/dashboard",     label: "Dashboard",     icon: LayoutDashboard, group: "operacao" },
  { href: "/kanban",        label: "Kanban",        icon: KanbanSquare,    group: "operacao" },
  { href: "/agendamentos",  label: "Agenda",        icon: Calendar,        group: "operacao" },
  { href: "/ordens",        label: "Ordens",        icon: ClipboardList,   group: "operacao" },

  { href: "/clientes",      label: "Clientes",      icon: Users,           group: "gestao" },
  { href: "/veiculos",      label: "Veículos",      icon: Car,             group: "gestao" },
  { href: "/servicos",      label: "Serviços",      icon: Wrench,          group: "gestao" },
  { href: "/funcionarios",  label: "Equipe",        icon: Users,           group: "gestao", future: true },
  { href: "/estoque",       label: "Estoque",       icon: Package,         group: "gestao", future: true },
  { href: "/financeiro",    label: "Financeiro",    icon: Wallet,          group: "gestao", future: true },
  { href: "/relatorios",    label: "Relatórios",    icon: LineChart,       group: "gestao", future: true },

  { href: "/configuracoes", label: "Configurações", icon: Settings,        group: "config" },
];

const GROUPS = [
  { id: "operacao" as const, label: "Operação" },
  { id: "gestao" as const, label: "Gestão" },
  { id: "config" as const, label: "Sistema" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        "relative hidden h-screen shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 md:flex",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      <div className={cn("flex h-16 items-center border-b border-border", collapsed ? "justify-center px-2" : "px-5")}>
        <Link href="/dashboard" className="flex items-center gap-2">
          {collapsed ? <BrandMark size="md" /> : <BrandLogo size="md" />}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {GROUPS.map((g) => {
          const items = NAV.filter((i) => i.group === g.id);
          return (
            <div key={g.id} className="mb-5">
              {!collapsed ? (
                <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {g.label}
                </div>
              ) : (
                <div className="h-1" />
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.future ? "#" : item.href}
                        title={collapsed ? item.label : undefined}
                        aria-disabled={item.future}
                        className={cn(
                          "group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          item.future &&
                            "pointer-events-none opacity-60",
                          collapsed && "justify-center px-2",
                        )}
                      >
                        <item.icon className={cn("h-4 w-4 flex-shrink-0", active && "text-primary-foreground")} />
                        {!collapsed ? (
                          <>
                            <span className="truncate">{item.label}</span>
                            {item.future ? (
                              <span className="ml-auto rounded bg-muted-foreground/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                Fase 2
                              </span>
                            ) : null}
                          </>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => setCollapsed((c) => !c)}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed ? <span>Recolher</span> : null}
        </Button>
      </div>
    </aside>
  );
}
