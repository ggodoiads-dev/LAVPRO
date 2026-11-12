import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Package,
  Plus,
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
import { EmptyState } from "@/components/ui/empty-state";
import { listProdutos } from "@/lib/data/queries";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Estoque" };

export default async function EstoquePage() {
  const produtos = await listProdutos();

  const totalItens = produtos.reduce(
    (a, p) => a + Number(p.estoque_atual),
    0,
  );
  const valorEstoque = produtos.reduce(
    (a, p) => a + Number(p.estoque_atual) * Number(p.custo_medio),
    0,
  );
  const abaixoMin = produtos.filter(
    (p) => Number(p.estoque_atual) <= Number(p.estoque_minimo),
  );

  return (
    <div>
      <PageHeader
        title="Estoque"
        description="Produtos, movimentações e alertas de mínimo."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/estoque/movimento">
                <ArrowUpCircle className="h-4 w-4" /> Movimentação
              </Link>
            </Button>
            <Button asChild variant="electric">
              <Link href="/estoque/novo">
                <Plus className="h-4 w-4" /> Novo produto
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Produtos ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {produtos.filter((p) => p.ativo).length}
            </div>
            <div className="text-xs text-muted-foreground">
              {totalItens.toLocaleString("pt-BR")} itens em estoque
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Valor em estoque (custo)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatCurrency(valorEstoque)}
            </div>
          </CardContent>
        </Card>
        <Card className={abaixoMin.length > 0 ? "border-warning/40" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Abaixo do mínimo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{abaixoMin.length}</div>
            <div className="text-xs text-muted-foreground">
              {abaixoMin.slice(0, 2).map((p) => p.nome).join(" · ") || "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {produtos.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Package}
                title="Nenhum produto cadastrado"
                description="Cadastre os insumos para controlar consumo e custo por serviço."
                action={{ label: "Novo produto", href: "/estoque/novo" }}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Custo médio</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map((p) => {
                  const baixo =
                    Number(p.estoque_atual) <= Number(p.estoque_minimo);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium">{p.nome}</div>
                        <div className="text-xs text-muted-foreground">
                          {[p.codigo, p.fornecedor].filter(Boolean).join(" · ")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{p.categoria ?? "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(p.custo_medio))} / {p.unidade}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {Number(p.estoque_atual).toLocaleString("pt-BR")} {p.unidade}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {Number(p.estoque_minimo)} {p.unidade}
                      </TableCell>
                      <TableCell className="text-right">
                        {baixo ? (
                          <Badge variant="warning">Repor</Badge>
                        ) : (
                          <Badge variant="success">OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <ArrowUpCircle className="h-3.5 w-3.5 text-success" /> Entrada
        </span>
        <span className="inline-flex items-center gap-1">
          <ArrowDownCircle className="h-3.5 w-3.5 text-destructive" /> Saída / consumo
        </span>
        <span>
          A baixa de estoque das OS acontece quando o serviço entra em
          execução (trigger + ficha técnica).
        </span>
      </div>
    </div>
  );
}
