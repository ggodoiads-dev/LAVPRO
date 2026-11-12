import Link from "next/link";
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

export const metadata = { title: "Admin · Empresas" };

export default async function EmpresasPage() {
  const [tenants, planos, assinaturas] = await Promise.all([
    listTenantsAdmin(),
    listPlanos(),
    listAssinaturasAdmin(),
  ]);
  const nomePlano = new Map(planos.map((p) => [p.id, p.nome]));
  const assinPorTenant = new Map(assinaturas.map((a) => [a.tenant_id, a]));

  return (
    <div>
      <PageHeader
        title="Empresas assinantes"
        description="Todos os tenants da plataforma e seu estado atual."
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Portal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((t) => {
                const a = assinPorTenant.get(t.id);
                const planoLabel = a
                  ? nomePlano.get(a.plano_id) ?? t.plano
                  : t.plano;
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="font-medium">{t.nome}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.slug}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {planoLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {a ? (
                        <Badge
                          variant={
                            a.status === "ativa"
                              ? "success"
                              : a.status === "inadimplente"
                                ? "destructive"
                                : a.status === "trial"
                                  ? "secondary"
                                  : "outline"
                          }
                          className="capitalize"
                        >
                          {a.status}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="capitalize">
                          {t.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{t.telefone ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.email ?? ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(t.created_at, { dateStyle: "short" })}
                    </TableCell>
                    <TableCell>
                      <Link
                        className="text-xs text-secondary hover:underline"
                        href={`/book/${t.slug}`}
                        target="_blank"
                      >
                        /book/{t.slug}
                      </Link>
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
