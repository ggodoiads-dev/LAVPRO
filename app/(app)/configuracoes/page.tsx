import Link from "next/link";
import { Building2, ChevronRight, Palette, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSession } from "@/lib/auth/session";
import { IS_SUPABASE_CONFIGURED } from "@/lib/supabase/env";

export const metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const session = await getSession();

  const grupos = [
    {
      icon: Building2,
      titulo: "Empresa",
      itens: [
        { label: "Dados cadastrais", status: "disponivel" as const },
        { label: "Unidades", status: "disponivel" as const },
        { label: "Horário de funcionamento", status: "fase2" as const },
        { label: "Boxes de atendimento", status: "fase2" as const },
      ],
    },
    {
      icon: Users,
      titulo: "Equipe & permissões",
      itens: [
        { label: "Usuários", status: "disponivel" as const },
        { label: "Perfis de acesso", status: "disponivel" as const },
        { label: "Funcionários operacionais", status: "fase2" as const },
        { label: "Regras de comissão", status: "fase2" as const },
      ],
    },
    {
      icon: Palette,
      titulo: "Aparência",
      itens: [
        { label: "Tema claro / escuro", status: "disponivel" as const },
        { label: "Logotipo", status: "fase2" as const },
        { label: "Identidade visual", status: "fase2" as const },
      ],
    },
    {
      icon: ShieldCheck,
      titulo: "Segurança & LGPD",
      itens: [
        { label: "RLS multi-tenant ativo", status: "disponivel" as const },
        { label: "Logs de auditoria", status: "fase2" as const },
        { label: "Política de retenção", status: "fase2" as const },
      ],
    },
  ];

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Ajuste o LAVPRO às particularidades da sua operação."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Estado do ambiente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Supabase</span>
              {IS_SUPABASE_CONFIGURED ? (
                <Badge variant="success">Conectado</Badge>
              ) : (
                <Badge variant="warning">Pendente</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Empresa ativa</span>
              <span className="font-medium">
                {session.activeTenant?.nome ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Plano</span>
              <span className="font-medium capitalize">
                {session.activeTenant?.plano ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Seu perfil</span>
              <span className="font-medium capitalize">
                {session.activeMembership?.perfil ?? "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Primeiros passos</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ol className="list-decimal space-y-2 pl-4">
              <li>
                Configure o projeto Supabase em{" "}
                <code className="rounded bg-muted px-1 py-0.5">.env.local</code>.
              </li>
              <li>Execute as migrations em <code>supabase/migrations</code>.</li>
              <li>
                Finalize o cadastro da empresa em{" "}
                <Link
                  href="/registro"
                  className="font-medium text-secondary hover:underline"
                >
                  /registro
                </Link>
                .
              </li>
              <li>Cadastre clientes, veículos e serviços.</li>
              <li>Abra sua primeira OS e acompanhe pelo Kanban.</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {grupos.map((g) => (
          <Card key={g.titulo}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <g.icon className="h-4 w-4 text-muted-foreground" />
                {g.titulo}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {g.itens.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center justify-between px-6 py-3 text-sm"
                  >
                    <span>{item.label}</span>
                    <div className="flex items-center gap-2">
                      {item.status === "disponivel" ? (
                        <Badge variant="success">Disponível</Badge>
                      ) : (
                        <Badge variant="secondary">Fase 2</Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
