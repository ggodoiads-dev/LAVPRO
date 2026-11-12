"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Calendar,
  ChevronLeft,
  ClipboardList,
  Gift,
  KanbanSquare,
  LayoutDashboard,
  Package,
  Settings,
  Sparkles,
  Users,
  Wrench,
  Car,
  Wallet,
  LineChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo, BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import type { Perfil } from "@/types/database";
import { can, PERMISSIONS } from "@/lib/permissions";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  group: "operacao" | "gestao" | "comercial" | "config";
  permission: keyof typeof PERMISSIONS;
}

const NAV: NavItem[] = [
  { href: "/dashboard",     label: "Dashboard",     icon: LayoutDashboard, group: "operacao", permission: "dashboard:view" },
  { href: "/kanban",        label: "Kanban",        icon: KanbanSquare,    group: "operacao", permission: "kanban:view" },
  { href: "/agendamentos",  label: "Agenda",        icon: Calendar,        group: "operacao", permission: "agenda:view" },
  { href: "/ordens",        label: "Ordens",        icon: ClipboardList,   group: "operacao", permission: "ordens:view" },

  { href: "/clientes",      label: "Clientes",      icon: Users,           group: "gestao",   permission: "clientes:view" },
  { href: "/veiculos",      label: "Veículos",      icon: Car,             group: "gestao",   permission: "veiculos:view" },
  { href: "/servicos",      label: "Serviços",      icon: Wrench,          group: "gestao",   permission: "servicos:view" },
  { href: "/funcionarios",  label: "Equipe",        icon: Users,           group: "gestao",   permission: "clientes:view" },
  { href: "/estoque",       label: "Estoque",       icon: Package,         group: "gestao",   permission: "servicos:view" },
  { href: "/financeiro",    label: "Financeiro",    icon: Wallet,          group: "gestao",   permission: "financeiro:view" },
  { href: "/relatorios",    label: "Relatórios",    icon: LineChart,       group: "gestao",   permission: "dashboard:view" },

  { href: "/pacotes",       label: "Pacotes",       icon: Gift,            group: "comercial",permission: "servicos:view" },
  { href: "/fidelidade",    label: "Fidelidade",    icon: Sparkles,        group: "comercial",permission: "clientes:view" },
  { href: "/notificacoes",  label: "Notificações",  icon: Bell,            group: "comercial",permission: "clientes:view" },

  { href: "/configuracoes", label: "Configurações", icon: Settings,        group: "config",   permission: "config:view" },
];

const GROUPS = [
  { id: "operacao" as const, label: "Operação" },
  { id: "gestao" as const, label: "Gestão" },
  { id: "comercial" as const, label: "Comercial" },
  { id: "config" as const, label: "Sistema" },
];

export function Sidebar({ perfil }: { perfil?: Perfil | null }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  const itens = NAV.filter((i) => (perfil ? can(perfil, i.permission) : true));

  return (
    <aside
      className={cn(
        "relative hidden h-screen shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 md:flex",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-border",
          collapsed ? "justify-center px-2" : "px-5",
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          {collapsed ? <BrandMark size="md" /> : <BrandLogo size="md" />}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {GROUPS.map((g) => {
          const items = itens.filter((i) => i.group === g.id);
          if (items.length === 0) return null;
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
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          collapsed && "justify-center px-2",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-4 w-4 flex-shrink-0",
                            active && "text-primary-foreground",
                          )}
                        />
                        {!collapsed ? (
                          <span className="truncate">{item.label}</span>
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
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
          />
          {!collapsed ? <span>Recolher</span> : null}
        </Button>
      </div>
    </aside>
  );
}
