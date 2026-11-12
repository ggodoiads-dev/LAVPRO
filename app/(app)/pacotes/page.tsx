import Link from "next/link";
import { Gift, Plus, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  listClientePacotes,
  listClientePacoteSaldos,
  listClientes,
  listPacotes,
  listPacoteItens,
  listServicos,
} from "@/lib/data/queries";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = { title: "Pacotes" };

export default async function PacotesPage() {
  const [pacotes, itens, clientePacotes, saldos, clientes, servicos] =
    await Promise.all([
      listPacotes(),
      listPacoteItens(),
      listClientePacotes(),
      listClientePacoteSaldos(),
      listClientes(),
      listServicos(),
    ]);

  const nomeServico = new Map(servicos.map((s) => [s.id, s.nome]));
  const nomePacote = new Map(pacotes.map((p) => [p.id, p.nome]));
  const nomeCliente = new Map(clientes.map((c) => [c.id, c.nome]));
  const saldosPorPacoteCliente = new Map<string, number>();
  for (const s of saldos) {
    saldosPorPacoteCliente.set(
      s.cliente_pacote_id,
      (saldosPorPacoteCliente.get(s.cliente_pacote_id) ?? 0) + s.saldo,
    );
  }
  const itensPorPacote = new Map<string, typeof itens>();
  for (const i of itens) {
    const arr = itensPorPacote.get(i.pacote_id) ?? [];
    arr.push(i);
    itensPorPacote.set(i.pacote_id, arr);
  }

  const totalReceita = clientePacotes
    .filter((cp) => cp.ativo)
    .reduce((a, cp) => a + Number(cp.valor_pago), 0);

  return (
    <div>
      <PageHeader
        title="Pacotes & assinaturas"
        description="Combos pré-pagos. Comprados pelo cliente, consumidos nas OS."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/pacotes/vender">
                <ShoppingCart className="h-4 w-4" /> Vender pacote
              </Link>
            </Button>
            <Button asChild variant="electric">
              <Link href="/pacotes/novo">
                <Plus className="h-4 w-4" /> Novo pacote
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Pacotes ativos
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {pacotes.filter((p) => p.ativo).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Receita antecipada (acumulada)
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {formatCurrency(totalReceita)}
            </div>
            <div className="text-xs text-muted-foreground">
              {clientePacotes.length} compras registradas
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Créditos em aberto
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {saldos.reduce((a, s) => a + s.saldo, 0)}
            </div>
            <div className="text-xs text-muted-foreground">
              Soma do saldo de todos os clientes
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Catálogo */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="h-4 w-4 text-secondary" />
            Catálogo de pacotes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pacotes.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Gift}
                title="Nenhum pacote cadastrado"
                description="Combine serviços em um combo pré-pago com validade."
                action={{ label: "Novo pacote", href: "/pacotes/novo" }}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pacote</TableHead>
                  <TableHead>Inclui</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Validade</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pacotes.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.nome}</div>
                      {p.descricao ? (
                        <div className="text-xs text-muted-foreground">
                          {p.descricao}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {(itensPorPacote.get(p.id) ?? []).map((i) => (
                          <Badge key={i.id} variant="outline" className="font-normal">
                            {i.quantidade}× {nomeServico.get(i.servico_id) ?? "serviço"}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(Number(p.preco))}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {p.validade_dias} dias
                    </TableCell>
                    <TableCell className="text-right">
                      {p.ativo ? (
                        <Badge variant="success">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Compras */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Clientes com pacote ativo</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {clientePacotes.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">
              Nenhum pacote vendido ainda.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Pacote</TableHead>
                  <TableHead>Comprado em</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Valor pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientePacotes.map((cp) => (
                  <TableRow key={cp.id}>
                    <TableCell>{nomeCliente.get(cp.cliente_id) ?? "—"}</TableCell>
                    <TableCell>{nomePacote.get(cp.pacote_id) ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(cp.comprado_em, { dateStyle: "short" })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {cp.expira_em
                        ? formatDate(cp.expira_em, { dateStyle: "short" })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {saldosPorPacoteCliente.get(cp.id) ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(cp.valor_pago))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
