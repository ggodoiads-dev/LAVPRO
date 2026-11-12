import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listServicos } from "@/lib/data/queries";
import { PacoteForm } from "@/components/forms/pacote-form";

export const metadata = { title: "Novo pacote" };

export default async function NovoPacotePage() {
  const servicos = await listServicos();
  return (
    <div>
      <PageHeader
        title="Novo pacote"
        description="Combine serviços e defina validade."
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
          <PacoteForm servicos={servicos} />
        </CardContent>
      </Card>
    </div>
  );
}
