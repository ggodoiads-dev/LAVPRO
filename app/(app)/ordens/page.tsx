import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
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
import { EmptyState } from "@/components/ui/empty-state";
import {
  listClientes,
  listOrdens,
  listVeiculos,
} from "@/lib/data/queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import { statusConfig } from "@/lib/status";

export const metadata = { title: "Ordens de serviço" };

export default async function OrdensPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const ordens = await listOrdens();
  const [clientes, veiculos] = await Promise.all([
    listClientes(),
    listVeiculos(),
  ]);
  const nomeCliente = new Map(clientes.map((c) => [c.id, c.nome]));
  const placa = new Map(veiculos.map((v) => [v.id, v.placa]));

  const status = searchParams.status ?? "ativas";
  const filtradas =
    status === "ativas"
      ? ordens.filter(
          (o) =>
            !["entregue", "cancelado"].includes(o.status),
        )
      : status === "todas"
        ? ordens
        : ordens.filter((o) => o.status === status);

  return (
    <div>
      <PageHeader
        title="Ordens de serviço"
        description="Histórico completo de atendimentos."
        actions={
          <Button asChild variant="electric">
            <Link href="/ordens/novo">
              <Plus className="h-4 w-4" /> Nova OS
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { v: "ativas", l: "Ativas" },
          { v: "todas", l: "Todas" },
          { v: "entregue", l: "Entregues" },
          { v: "cancelado", l: "Canceladas" },
        ].map((tab) => (
          <Button
            key={tab.v}
            asChild
            variant={status === tab.v ? "default" : "outline"}
            size="sm"
          >
            <Link href={`/ordens?status=${tab.v}`}>{tab.l}</Link>
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {filtradas.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={ClipboardList}
                title="Nenhuma OS neste filtro"
                description="Mude o filtro acima ou abra uma nova OS."
                action={{ label: "Nova OS", href: "/ordens/novo" }}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OS</TableHead>
                  <TableHead>Cliente / Veículo</TableHead>
                  <TableHead>Aberta em</TableHead>
                  <TableHead>Previsão</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((o) => {
                  const s = statusConfig[o.status];
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono font-semibold">
                        #{o.numero}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {nomeCliente.get(o.cliente_id) ?? "—"}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {placa.get(o.veiculo_id) ?? ""}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(o.aberta_em)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {o.prevista_em ? formatDate(o.prevista_em) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(Number(o.total))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={s.badge}>{s.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
