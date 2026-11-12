import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  Download,
  LineChart,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
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
import {
  dreMensal,
  listCategoriasFinanceiras,
  listContasPagar,
  listContasReceber,
  listFormasPagamento,
  listPagamentos,
} from "@/lib/data/queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toggleContaPaga } from "./actions";

export const metadata = { title: "Financeiro" };

export default async function FinanceiroPage() {
  const [contasPagar, contasReceber, formas, categorias, pagamentos, dre] =
    await Promise.all([
      listContasPagar(),
      listContasReceber(),
      listFormasPagamento(),
      listCategoriasFinanceiras(),
      listPagamentos(),
      dreMensal(),
    ]);

  void formas;
  void categorias;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const emAberto = contasPagar.filter((c) => !c.pago_em);
  const vencidas = emAberto.filter(
    (c) => new Date(c.vencimento) < hoje,
  );
  const aVencer = emAberto.filter(
    (c) => new Date(c.vencimento) >= hoje,
  );

  const totalAberto = emAberto.reduce((a, c) => a + Number(c.valor), 0);
  const totalVencido = vencidas.reduce((a, c) => a + Number(c.valor), 0);
  const totalReceber = contasReceber
    .filter((c) => !c.recebido_em)
    .reduce((a, c) => a + Number(c.valor), 0);
  const recebidoMes = pagamentos
    .filter((p) => {
      const d = new Date(p.recebido_em);
      const ini = new Date();
      ini.setDate(1);
      ini.setHours(0, 0, 0, 0);
      return d >= ini;
    })
    .reduce((a, p) => a + Number(p.valor), 0);

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Contas a pagar, a receber, DRE gerencial e fluxo do mês."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/financeiro/receber">
                <Receipt className="h-4 w-4" /> Registrar pagamento
              </Link>
            </Button>
            <Button asChild variant="electric">
              <Link href="/financeiro/novo">
                <Plus className="h-4 w-4" /> Lançar despesa
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Recebido no mês
              </span>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {formatCurrency(recebidoMes)}
            </div>
            <div className="text-xs text-muted-foreground">
              {pagamentos.length} recebimentos registrados
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                A receber
              </span>
              <Wallet className="h-4 w-4 text-secondary" />
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {formatCurrency(totalReceber)}
            </div>
            <div className="text-xs text-muted-foreground">
              {contasReceber.filter((c) => !c.recebido_em).length} títulos em aberto
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                A pagar
              </span>
              <TrendingDown className="h-4 w-4 text-warning" />
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {formatCurrency(totalAberto)}
            </div>
            <div className="text-xs text-muted-foreground">
              {emAberto.length} títulos · {aVencer.length} a vencer
            </div>
          </CardContent>
        </Card>
        <Card className={vencidas.length ? "border-destructive/40" : ""}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Vencidas
              </span>
              <ArrowDownRight className="h-4 w-4 text-destructive" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-destructive">
              {formatCurrency(totalVencido)}
            </div>
            <div className="text-xs text-muted-foreground">
              {vencidas.length} títulos vencidos
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Contas a pagar */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-warning" />
              Contas a pagar — próximas 30 dias
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/financeiro/novo">
                <Plus className="h-4 w-4" /> Nova
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contasPagar.map((c) => {
                  const venc = new Date(c.vencimento);
                  const vencido = !c.pago_em && venc < hoje;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        {c.descricao}
                        {c.recorrente ? (
                          <Badge
                            variant="secondary"
                            className="ml-2 h-5 px-1.5 text-[10px]"
                          >
                            recorrente
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(c.vencimento, { dateStyle: "short" })}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(Number(c.valor))}
                      </TableCell>
                      <TableCell className="text-right">
                        <form action={toggleContaPaga}>
                          <input type="hidden" name="id" value={c.id} />
                          <input
                            type="hidden"
                            name="pago"
                            value={c.pago_em ? "true" : "false"}
                          />
                          {c.pago_em ? (
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success hover:bg-success/20"
                            >
                              Pago em{" "}
                              {formatDate(c.pago_em, { dateStyle: "short" })}
                            </button>
                          ) : vencido ? (
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive hover:bg-destructive/20"
                            >
                              Vencida · marcar paga
                            </button>
                          ) : (
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning-foreground hover:bg-warning/25"
                            >
                              Em aberto · marcar paga
                            </button>
                          )}
                        </form>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {contasPagar.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-muted-foreground"
                    >
                      Sem lançamentos.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* DRE gerencial */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-4 w-4 text-primary" />
                DRE gerencial · mês corrente
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Regime de caixa, baseado em pagamentos efetivos.
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4" /> Exportar
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {dre.map((linha) => (
                <li
                  key={linha.rotulo}
                  className={`flex items-center justify-between px-6 py-3 text-sm ${
                    linha.destaque ? "bg-muted/40 font-medium" : ""
                  }`}
                >
                  <span
                    className={
                      linha.negativa
                        ? "text-destructive"
                        : linha.destaque
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }
                  >
                    {linha.rotulo}
                  </span>
                  <span className="flex items-center gap-2">
                    {linha.margem != null && !Number.isNaN(linha.margem) ? (
                      <span className="text-[11px] text-muted-foreground">
                        {linha.margem.toFixed(1)}%
                      </span>
                    ) : null}
                    <span
                      className={`font-semibold ${
                        linha.negativa
                          ? "text-destructive"
                          : linha.destaque
                            ? "text-foreground"
                            : "text-muted-foreground"
                      }`}
                    >
                      {linha.negativa ? "−" : ""}
                      {formatCurrency(Math.abs(linha.valor))}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Contas a receber */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-success" />
            Contas a receber
          </CardTitle>
          <Badge variant="outline">
            <CircleDollarSign className="h-3 w-3" />
            {formatCurrency(totalReceber)} em aberto
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contasReceber.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-sm text-muted-foreground"
                  >
                    Nenhum título em aberto. OS são quitadas pelo registro de
                    pagamento.
                  </TableCell>
                </TableRow>
              ) : (
                contasReceber.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.descricao}</TableCell>
                    <TableCell>
                      {formatDate(c.vencimento, { dateStyle: "short" })}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(Number(c.valor))}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.recebido_em ? (
                        <Badge variant="success">Recebido</Badge>
                      ) : (
                        <Badge variant="warning">Em aberto</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
