import { CheckCircle2, X } from "lucide-react";
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
import { listPlanoLimites, listPlanos } from "@/lib/data/queries";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Admin · Planos" };

const FEATS = [
  { key: "kanban",          label: "Kanban" },
  { key: "estoque",         label: "Estoque" },
  { key: "financeiro",      label: "Financeiro" },
  { key: "pacotes",         label: "Pacotes" },
  { key: "portal_publico",  label: "Portal público" },
  { key: "comissoes",       label: "Comissões" },
  { key: "bi",              label: "BI avançado" },
  { key: "sso",             label: "SSO" },
];

export default async function PlanosPage() {
  const [planos, limites] = await Promise.all([
    listPlanos(),
    listPlanoLimites(),
  ]);
  const limPorPlano = new Map(limites.map((l) => [l.plano_id, l]));

  return (
    <div>
      <PageHeader
        title="Planos & limites"
        description="Catálogo da plataforma. Edição direta no banco por enquanto; a interface de edição chega junto com o painel comercial."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {planos.map((p) => {
          const lim = limPorPlano.get(p.id);
          return (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{p.nome}</CardTitle>
                  <Badge variant={p.ativo ? "success" : "secondary"}>
                    {p.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {p.descricao}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold">
                    {Number(p.preco_mensal) > 0
                      ? formatCurrency(p.preco_mensal)
                      : "Grátis"}
                  </span>
                  {Number(p.preco_mensal) > 0 ? (
                    <span className="text-xs text-muted-foreground">/mês</span>
                  ) : null}
                </div>

                <dl className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Trial</dt>
                    <dd className="font-medium">{p.trial_dias} dias</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Unidades</dt>
                    <dd className="font-medium">
                      {lim?.max_unidades ?? "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Usuários</dt>
                    <dd className="font-medium">
                      {(lim?.max_usuarios ?? 0) >= 999
                        ? "Ilimitado"
                        : lim?.max_usuarios}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Veículos/mês</dt>
                    <dd className="font-medium">
                      {lim?.max_veiculos_mes === 0
                        ? "Ilimitado"
                        : lim?.max_veiculos_mes}
                    </dd>
                  </div>
                </dl>

                <ul className="mt-4 space-y-1 text-xs">
                  {FEATS.map((f) => {
                    const on = Boolean(lim?.funcionalidades?.[f.key]);
                    return (
                      <li
                        key={f.key}
                        className={`flex items-center gap-1.5 ${
                          on ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {on ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <X className="h-3.5 w-3.5 opacity-50" />
                        )}
                        {f.label}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Resumo em tabela</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plano</TableHead>
                <TableHead>Preço/mês</TableHead>
                <TableHead>Unidades</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Veículos/mês</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planos.map((p) => {
                const lim = limPorPlano.get(p.id);
                return (
                  <TableRow key={p.id}>
                    <TableCell>{p.nome}</TableCell>
                    <TableCell>
                      {Number(p.preco_mensal) > 0
                        ? formatCurrency(p.preco_mensal)
                        : "Grátis"}
                    </TableCell>
                    <TableCell>{lim?.max_unidades ?? "—"}</TableCell>
                    <TableCell>
                      {(lim?.max_usuarios ?? 0) >= 999 ? "∞" : lim?.max_usuarios}
                    </TableCell>
                    <TableCell>
                      {lim?.max_veiculos_mes === 0
                        ? "∞"
                        : lim?.max_veiculos_mes}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
