import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listClientes, listPacotes } from "@/lib/data/queries";
import { VenderPacoteForm } from "@/components/forms/vender-pacote-form";

export const metadata = { title: "Vender pacote" };

export default async function VenderPacotePage() {
  const [clientes, pacotes] = await Promise.all([
    listClientes(),
    listPacotes(),
  ]);
  return (
    <div>
      <PageHeader
        title="Vender pacote"
        description="Associe um pacote a um cliente. Saldo e validade são gerados automaticamente."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/pacotes">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <VenderPacoteForm
            clientes={clientes}
            pacotes={pacotes.filter((p) => p.ativo)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
