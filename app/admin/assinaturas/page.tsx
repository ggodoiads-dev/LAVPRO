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
  listAssinaturasAdmin,
  listPlanos,
  listTenantsAdmin,
} from "@/lib/data/queries";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Admin · Assinaturas" };

export default async function AssinaturasPage() {
  const [assinaturas, planos, tenants] = await Promise.all([
    listAssinaturasAdmin(),
    listPlanos(),
    listTenantsAdmin(),
  ]);
  const planoNome = new Map(planos.map((p) => [p.id, p.nome]));
  const tenantNome = new Map(tenants.map((t) => [t.id, t.nome]));

  const groups: Record<string, typeof assinaturas> = {
    trial: [], ativa: [], inadimplente: [], pausada: [], cancelada: [], expirada: [],
  };
  for (const a of assinaturas) (groups[a.status] ??= []).push(a);

  return (
    <div>
      <PageHeader
        title="Assinaturas"
        description="Ciclo de vida das assinaturas. Alterações só ocorrem via webhook idempotente do gateway."
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {(["ativa","trial","inadimplente","pausada","cancelada"] as const).map((s) => (
          <Card key={s}>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground capitalize">
                {s}
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {groups[s].length}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Próxima cobrança</TableHead>
                <TableHead>Gateway</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assinaturas.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    {tenantNome.get(a.tenant_id) ?? a.tenant_id.slice(0, 6)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {planoNome.get(a.plano_id) ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        a.status === "ativa"
                          ? "success"
                          : a.status === "inadimplente"
                            ? "destructive"
                            : a.status === "trial"
                              ? "secondary"
                              : a.status === "pausada"
                                ? "warning"
                                : "outline"
                      }
                      className="capitalize"
                    >
                      {a.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(a.periodo_inicio, { dateStyle: "short" })} →{" "}
                    {formatDate(a.periodo_fim, { dateStyle: "short" })}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {a.proxima_cobranca
                      ? formatDate(a.proxima_cobranca, { dateStyle: "short" })
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {a.gateway ?? "—"}
                    {a.gateway_subscription_id ? (
                      <div className="font-mono text-[10px]">
                        {a.gateway_subscription_id}
                      </div>
                    ) : null}
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
