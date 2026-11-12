import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listInvoicesAdmin,
  listTenantsAdmin,
} from "@/lib/data/queries";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = { title: "Admin · Faturas" };

export default async function FaturasPage() {
  const [invoices, tenants] = await Promise.all([
    listInvoicesAdmin(),
    listTenantsAdmin(),
  ]);
  const tenantNome = new Map(tenants.map((t) => [t.id, t.nome]));

  const porStatus = {
    aberta:    invoices.filter((i) => i.status === "aberta"),
    atrasada:  invoices.filter((i) => i.status === "atrasada"),
    paga:      invoices.filter((i) => i.status === "paga"),
    cancelada: invoices.filter((i) => i.status === "cancelada"),
  };

  return (
    <div>
      <PageHeader
        title="Faturas"
        description="Histórico de cobranças recorrentes recebidas via gateway."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Abertas
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {formatCurrency(
                porStatus.aberta.reduce((a, i) => a + Number(i.valor), 0),
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {porStatus.aberta.length} faturas
            </div>
          </CardContent>
        </Card>
        <Card className={porStatus.atrasada.length ? "border-destructive/40" : ""}>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Atrasadas
            </div>
            <div
              className={`mt-2 text-2xl font-semibold ${
                porStatus.atrasada.length ? "text-destructive" : ""
              }`}
            >
              {formatCurrency(
                porStatus.atrasada.reduce((a, i) => a + Number(i.valor), 0),
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {porStatus.atrasada.length} faturas
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Pagas (histórico)
            </div>
            <div className="mt-2 text-2xl font-semibold text-success">
              {formatCurrency(
                porStatus.paga.reduce((a, i) => a + Number(i.valor), 0),
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {porStatus.paga.length} faturas
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Canceladas
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {porStatus.cancelada.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono">{i.numero}</TableCell>
                  <TableCell>
                    {tenantNome.get(i.tenant_id) ?? i.tenant_id.slice(0, 6)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(i.competencia, { dateStyle: "short" })}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(i.vencimento, { dateStyle: "short" })}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(Number(i.valor))}
                  </TableCell>
                  <TableCell className="text-right">
                    {i.status === "paga" ? (
                      <Badge variant="success">Paga</Badge>
                    ) : i.status === "atrasada" ? (
                      <Badge variant="destructive">Atrasada</Badge>
                    ) : i.status === "cancelada" ? (
                      <Badge variant="outline">Cancelada</Badge>
                    ) : (
                      <Badge variant="warning">Aberta</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
