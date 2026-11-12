import Link from "next/link";
import { Plus, Wrench } from "lucide-react";
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
import { listServicos } from "@/lib/data/queries";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Catálogo de serviços" };

export default async function ServicosPage() {
  const servicos = await listServicos();

  return (
    <div>
      <PageHeader
        title="Catálogo de serviços"
        description="Serviços que você oferece, preços, custos e comissão."
        actions={
          <Button asChild variant="electric">
            <Link href="/servicos/novo">
              <Plus className="h-4 w-4" /> Novo serviço
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {servicos.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Wrench}
                title="Você ainda não tem serviços cadastrados"
                description="Cadastre lavagens, estéticas e pacotes para começar."
                action={{ label: "Novo serviço", href: "/servicos/novo" }}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Preço base</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Duração</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servicos.map((s) => {
                  const margem =
                    s.preco_base > 0
                      ? ((s.preco_base - s.custo_estimado) / s.preco_base) * 100
                      : 0;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium">{s.nome}</div>
                        {s.descricao ? (
                          <div className="text-xs text-muted-foreground">
                            {s.descricao}
                          </div>
                        ) : null}
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          Margem: <span className="font-medium">{margem.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{s.categoria ?? "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(s.preco_base)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(s.custo_estimado)}
                      </TableCell>
                      <TableCell className="text-right">{s.duracao_min} min</TableCell>
                      <TableCell className="text-right">{s.comissao_percentual}%</TableCell>
                      <TableCell className="text-right">
                        {s.ativo ? (
                          <Badge variant="success">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
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
    </div>
  );
}
