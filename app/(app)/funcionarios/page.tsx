import Link from "next/link";
import { Award, Plus, Users } from "lucide-react";
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
  listComissoes,
  listFuncionarios,
  listOrdens,
} from "@/lib/data/queries";
import { formatCurrency, initials } from "@/lib/utils";

export const metadata = { title: "Equipe" };

export default async function FuncionariosPage() {
  const [funcionarios, comissoes, ordens] = await Promise.all([
    listFuncionarios(),
    listComissoes(),
    listOrdens(),
  ]);

  const atendidos = new Map<string, number>();
  const receita = new Map<string, number>();
  const comissaoValor = new Map<string, number>();

  for (const c of comissoes) {
    if (c.status === "estornada") continue;
    comissaoValor.set(
      c.funcionario_id,
      (comissaoValor.get(c.funcionario_id) ?? 0) + Number(c.valor),
    );
    receita.set(
      c.funcionario_id,
      (receita.get(c.funcionario_id) ?? 0) + Number(c.base),
    );
    atendidos.set(c.funcionario_id, (atendidos.get(c.funcionario_id) ?? 0) + 1);
  }

  const ranking = [...funcionarios]
    .map((f) => ({
      ...f,
      atendidos: atendidos.get(f.id) ?? 0,
      receita: receita.get(f.id) ?? 0,
      comissao: comissaoValor.get(f.id) ?? 0,
    }))
    .sort((a, b) => b.receita - a.receita);

  const total = ordens.length;
  void total;

  return (
    <div>
      <PageHeader
        title="Equipe"
        description="Funcionários, produtividade e comissões apuradas."
        actions={
          <Button asChild variant="electric">
            <Link href="/funcionarios/novo">
              <Plus className="h-4 w-4" /> Novo funcionário
            </Link>
          </Button>
        }
      />

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4 text-secondary" />
              Top produtividade (mês)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ranking.slice(0, 3).map((f, i) => (
              <div key={f.id} className="flex items-center gap-3">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    i === 0
                      ? "bg-warning/20 text-warning-foreground"
                      : i === 1
                        ? "bg-muted text-foreground"
                        : "bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="font-medium">{f.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {f.atendidos} serviços · {formatCurrency(f.receita)}
                  </div>
                </div>
                <div className="text-xs font-medium text-success">
                  {formatCurrency(f.comissao)}
                </div>
              </div>
            ))}
            {ranking.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Sem dados ainda.
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Funcionários ativos</span>
              <span className="font-semibold">
                {funcionarios.filter((f) => f.ativo).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Comissões em aberto
              </span>
              <span className="font-semibold">
                {formatCurrency(
                  comissoes
                    .filter((c) => c.status === "aberta")
                    .reduce((a, c) => a + Number(c.valor), 0),
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Comissões pagas</span>
              <span className="font-semibold">
                {formatCurrency(
                  comissoes
                    .filter((c) => c.status === "paga")
                    .reduce((a, c) => a + Number(c.valor), 0),
                )}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Como funciona</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            A comissão é gerada automaticamente quando uma OS muda para{" "}
            <b>entregue</b>. Cada item usa seu percentual e a participação do
            funcionário na OS. Estornos criam uma contrapartida sem deletar o
            histórico.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {funcionarios.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="Sem funcionários cadastrados"
                description="Cadastre a equipe para alocar nas OS e apurar comissões."
                action={{ label: "Novo funcionário", href: "/funcionarios/novo" }}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Vínculo</TableHead>
                  <TableHead className="text-right">Comissão padrão</TableHead>
                  <TableHead className="text-right">Serviços</TableHead>
                  <TableHead className="text-right">Comissão apurada</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {initials(f.nome)}
                        </div>
                        <div>
                          <div className="font-medium">{f.nome}</div>
                          {f.observacoes ? (
                            <div className="text-xs text-muted-foreground">
                              {f.observacoes}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{f.cargo ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase">
                        {f.vinculo ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(f.comissao_padrao).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right">{f.atendidos}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(f.comissao)}
                    </TableCell>
                    <TableCell className="text-right">
                      {f.ativo ? (
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
    </div>
  );
}
