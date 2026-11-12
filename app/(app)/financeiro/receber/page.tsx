import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  listFormasPagamento,
  listOrdens,
  listPagamentos,
} from "@/lib/data/queries";
import { PagamentoForm } from "@/components/forms/pagamento-form";

export const metadata = { title: "Registrar pagamento" };

export default async function PagamentoPage() {
  const [ordens, formas, pagamentos] = await Promise.all([
    listOrdens(),
    listFormasPagamento(),
    listPagamentos(),
  ]);

  // OS passíveis de pagamento (não canceladas) com saldo pendente.
  const pagoPorOrdem = new Map<string, number>();
  for (const p of pagamentos) {
    pagoPorOrdem.set(
      p.ordem_id,
      (pagoPorOrdem.get(p.ordem_id) ?? 0) + Number(p.valor),
    );
  }
  const passiveis = ordens
    .filter((o) => o.status !== "cancelado")
    .map((o) => ({
      ...o,
      pago: pagoPorOrdem.get(o.id) ?? 0,
      saldo: Math.max(0, Number(o.total) - (pagoPorOrdem.get(o.id) ?? 0)),
    }))
    .filter((o) => o.saldo > 0);

  return (
    <div>
      <PageHeader
        title="Registrar pagamento"
        description="Quite uma OS, parcial ou integralmente."
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
          <PagamentoForm ordens={passiveis} formas={formas} />
        </CardContent>
      </Card>
    </div>
  );
}
