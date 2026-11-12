import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listClientes } from "@/lib/data/queries";
import { VeiculoForm } from "@/components/forms/veiculo-form";

export const metadata = { title: "Novo veículo" };

export default async function NovoVeiculoPage({
  searchParams,
}: {
  searchParams: { cliente?: string };
}) {
  const clientes = await listClientes();
  return (
    <div>
      <PageHeader
        title="Novo veículo"
        description="Vincule um veículo a um cliente existente."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/veiculos">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <VeiculoForm
            clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
            defaultClienteId={searchParams.cliente ?? undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
