import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AgendamentoForm } from "@/components/forms/agendamento-form";
import { getSession } from "@/lib/auth/session";
import {
  listClientes,
  listServicos,
  listVeiculos,
} from "@/lib/data/queries";

export const metadata = { title: "Novo agendamento" };

export default async function NovoAgendamentoPage() {
  const [session, clientes, veiculos, servicos] = await Promise.all([
    getSession(),
    listClientes(),
    listVeiculos(),
    listServicos(),
  ]);

  return (
    <div>
      <PageHeader
        title="Novo agendamento"
        description="Reserve data, hora e recursos do atendimento."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/agendamentos">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <AgendamentoForm
            tenantId={session.activeTenant?.id ?? "demo-tenant"}
            unidadeId={session.activeMembership?.unidade_id ?? "demo-unidade"}
            clientes={clientes}
            veiculos={veiculos}
            servicos={servicos}
          />
        </CardContent>
      </Card>
    </div>
  );
}
