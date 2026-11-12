import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listProdutos } from "@/lib/data/queries";
import { MovimentoForm } from "@/components/forms/movimento-form";

export const metadata = { title: "Movimentar estoque" };

export default async function MovimentoEstoquePage() {
  const produtos = await listProdutos();
  return (
    <div>
      <PageHeader
        title="Movimentar estoque"
        description="Registre entrada, saída, perda ou ajuste de inventário."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/estoque">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <MovimentoForm produtos={produtos} />
        </CardContent>
      </Card>
    </div>
  );
}
