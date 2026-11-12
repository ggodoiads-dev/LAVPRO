import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import {
  listClientes,
  listServicos,
  listVeiculos,
} from "@/lib/data/queries";
import { OrdemForm } from "@/components/forms/ordem-form";

export const metadata = { title: "Nova OS" };

export default async function NovaOrdemPage() {
  const [session, clientes, veiculos, servicos] = await Promise.all([
    getSession(),
    listClientes(),
    listVeiculos(),
    listServicos(),
  ]);
  return (
    <div>
      <PageHeader
        title="Nova ordem de serviço"
        description="Vincule cliente, veículo e serviços. A OS entra no Kanban como Recebida."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/kanban">
              <ArrowLeft className="h-4 w-4" /> Voltar ao Kanban
            </Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <OrdemForm
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
