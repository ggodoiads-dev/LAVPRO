import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  listCategoriasFinanceiras,
  listFormasPagamento,
} from "@/lib/data/queries";
import { ContaPagarForm } from "@/components/forms/conta-pagar-form";

export const metadata = { title: "Nova despesa" };

export default async function NovaContaPagarPage() {
  const [categorias, formas] = await Promise.all([
    listCategoriasFinanceiras(),
    listFormasPagamento(),
  ]);
  return (
    <div>
      <PageHeader
        title="Lançar despesa"
        description="Conta a pagar vinculada a uma categoria do DRE."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/financeiro">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <ContaPagarForm
            categorias={categorias.filter((c) => c.tipo === "despesa")}
            formas={formas}
          />
        </CardContent>
      </Card>
    </div>
  );
}
