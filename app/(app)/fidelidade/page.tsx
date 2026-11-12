import Link from "next/link";
import { Settings, Sparkles, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
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
  getPontosRegra,
  listClientes,
  listPontosMovimentos,
} from "@/lib/data/queries";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = { title: "Fidelidade" };

export default async function FidelidadePage() {
  const [regra, movimentos, clientes] = await Promise.all([
    getPontosRegra(),
    listPontosMovimentos(),
    listClientes(),
  ]);

  const saldo = new Map<string, number>();
  for (const m of movimentos) {
    saldo.set(m.cliente_id, (saldo.get(m.cliente_id) ?? 0) + m.pontos);
  }
  const ranking = [...saldo.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, pts]) => ({
      id,
      pontos: pts,
      nome: clientes.find((c) => c.id === id)?.nome ?? "—",
    }));

  const resgatePossivel = (pontos: number) =>
    pontos * Number(regra.reais_por_ponto);

  const pontosAcumulados = movimentos
    .filter((m) => m.tipo === "acumulo")
    .reduce((a, m) => a + m.pontos, 0);
  const pontosResgatados = Math.abs(
    movimentos.filter((m) => m.tipo === "resgate").reduce((a, m) => a + m.pontos, 0),
  );

  return (
    <div>
      <PageHeader
        title="Fidelidade"
        description="Programa de pontos: cada OS entregue acumula automaticamente."
        actions={
          <Button asChild variant="outline">
            <Link href="/configuracoes">
              <Settings className="h-4 w-4" /> Configurar regra
            </Link>
          </Button>
        }
      />

      <div className="mb-4 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Programa
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={regra.ativo ? "success" : "secondary"}>
                {regra.ativo ? "Ativo" : "Inativo"}
              </Badge>
              <Sparkles className="h-4 w-4 text-secondary" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {regra.pontos_por_real} pto / R$1 · R${" "}
              {Number(regra.reais_por_ponto).toFixed(2)} / ponto
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Pontos acumulados
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {pontosAcumulados.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Pontos resgatados
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {pontosResgatados.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Passivo em créditos
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {formatCurrency(
                [...saldo.values()].reduce((a, p) => a + p, 0) *
                  Number(regra.reais_por_ponto),
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-success" />
              Top clientes por pontos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ranking.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Sem acúmulo registrado ainda.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Pontos</TableHead>
                    <TableHead className="text-right">
                      Equivalente em crédito
                    </TableHead>
                    <TableHead className="text-right">Pode resgatar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranking.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.nome}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {r.pontos.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(resgatePossivel(r.pontos))}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.pontos >= regra.min_resgate_pontos ? (
                          <Badge variant="success">Sim</Badge>
                        ) : (
                          <Badge variant="secondary">
                            Faltam {regra.min_resgate_pontos - r.pontos}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Movimentos recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {movimentos.slice(0, 10).map((m) => {
                const cliente =
                  clientes.find((c) => c.id === m.cliente_id)?.nome ?? "—";
                return (
                  <li
                    key={m.id}
                    className="flex items-center justify-between px-6 py-3 text-sm"
                  >
                    <div>
                      <div className="font-medium">{cliente}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(m.criado_em, { dateStyle: "short" })} ·{" "}
                        {m.motivo ?? m.tipo}
                      </div>
                    </div>
                    <span
                      className={`font-semibold ${
                        m.pontos >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {m.pontos > 0 ? "+" : ""}
                      {m.pontos}
                    </span>
                  </li>
                );
              })}
              {movimentos.length === 0 ? (
                <li className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum movimento registrado.
                </li>
              ) : null}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
