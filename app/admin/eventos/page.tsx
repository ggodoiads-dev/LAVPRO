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
  listAssinaturaEventosAdmin,
  listTenantsAdmin,
} from "@/lib/data/queries";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Admin · Eventos" };

const TIPO_META: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "outline" | "secondary" }> = {
  criada:              { label: "Criada",              variant: "outline" },
  iniciou_trial:       { label: "Iniciou trial",       variant: "secondary" },
  trial_expirou:       { label: "Trial expirou",       variant: "warning" },
  ativada:             { label: "Ativada",             variant: "success" },
  renovada:            { label: "Renovada",            variant: "success" },
  pagamento_falhou:    { label: "Pagamento falhou",    variant: "destructive" },
  inadimplente:        { label: "Inadimplente",        variant: "destructive" },
  pausada:             { label: "Pausada",             variant: "warning" },
  cancelada:           { label: "Cancelada",           variant: "outline" },
  plano_alterado:      { label: "Plano alterado",      variant: "secondary" },
};

export default async function EventosPage() {
  const [eventos, tenants] = await Promise.all([
    listAssinaturaEventosAdmin(),
    listTenantsAdmin(),
  ]);
  const tenantNome = new Map(tenants.map((t) => [t.id, t.nome]));

  return (
    <div>
      <PageHeader
        title="Histórico de eventos"
        description="Trilha de auditoria do ciclo de vida das assinaturas."
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventos.map((e) => {
                const meta = TIPO_META[e.tipo] ?? {
                  label: e.tipo,
                  variant: "outline" as const,
                };
                return (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(e.created_at)}
                    </TableCell>
                    <TableCell>
                      {tenantNome.get(e.tenant_id) ?? e.tenant_id.slice(0, 6)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {Object.keys(e.detalhes).length === 0
                        ? "—"
                        : JSON.stringify(e.detalhes)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {eventos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    Nenhum evento registrado.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
