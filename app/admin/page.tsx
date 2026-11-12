import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CreditCard,
  Gauge,
  TrendingUp,
} from "lucide-react";
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
  listAssinaturaEventosAdmin,
  listAssinaturasAdmin,
  listInvoicesAdmin,
  listPlanos,
  listTenantsAdmin,
  saasMetricas,
} from "@/lib/data/queries";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = { title: "Admin · Visão geral" };

export default async function AdminHome() {
  const [metricas, tenants, planos, assinaturas, invoices, eventos] =
    await Promise.all([
      saasMetricas(),
      listTenantsAdmin(),
      listPlanos(),
      listAssinaturasAdmin(),
      listInvoicesAdmin(),
      listAssinaturaEventosAdmin(),
    ]);

  const planoNome = new Map(planos.map((p) => [p.id, p.nome]));
  const tenantNome = new Map(tenants.map((t) => [t.id, t.nome]));

  const porPlano = new Map<string, number>();
  for (const a of assinaturas.filter((a) => a.status === "ativa")) {
    porPlano.set(a.plano_id, (porPlano.get(a.plano_id) ?? 0) + 1);
  }

  const openInvoicesValor = invoices
    .filter((i) => i.status === "aberta" || i.status === "atrasada")
    .reduce((a, i) => a + Number(i.valor), 0);

  return (
    <div>
      <PageHeader
        title="Plataforma LAVPRO"
        description="Visão geral de empresas assinantes, planos e saúde financeira do SaaS."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              MRR
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {formatCurrency(metricas.mrr)}
            </div>
            <div className="text-xs text-muted-foreground">
              Receita recorrente mensal
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              ARR
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {formatCurrency(metricas.arr)}
            </div>
            <div className="text-xs text-muted-foreground">
              Projeção anual (MRR × 12)
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Assinantes ativos
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {metricas.assinantes_ativos}
            </div>
            <div className="text-xs text-muted-foreground">
              {metricas.em_trial} em trial
            </div>
          </CardContent>
        </Card>
        <Card
          className={
            metricas.inadimplentes > 0 ? "border-destructive/40" : ""
          }
        >
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Inadimplentes
            </div>
            <div
              className={`mt-2 text-2xl font-semibold ${
                metricas.inadimplentes > 0 ? "text-destructive" : ""
              }`}
            >
              {metricas.inadimplentes}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatCurrency(openInvoicesValor)} em faturas pendentes
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por plano */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-secondary" />
              Distribuição por plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {planos.map((p) => {
                const qtd = porPlano.get(p.id) ?? 0;
                const max = Math.max(1, ...[...porPlano.values()]);
                return (
                  <li key={p.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{p.nome}</span>
                      <span className="text-muted-foreground">
                        {qtd} ·{" "}
                        <b className="text-foreground">
                          {formatCurrency(qtd * Number(p.preco_mensal))}
                        </b>
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(qtd / max) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" />
              Empresas mais recentes
            </CardTitle>
            <Link href="/admin/empresas" className="text-xs text-secondary hover:underline">
              Ver todas
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.slice(0, 6).map((t) => {
                  const a = assinaturas.find((x) => x.tenant_id === t.id);
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.nome}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {a ? (planoNome.get(a.plano_id) ?? t.plano) : t.plano}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(t.created_at, { dateStyle: "short" })}
                      </TableCell>
                      <TableCell className="text-right">
                        {a ? (
                          <StatusBadge status={a.status} />
                        ) : (
                          <Badge variant="secondary">—</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Eventos recentes */}
      <Card className="mt-6">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-4 w-4 text-success" />
            Eventos recentes de assinatura
          </CardTitle>
          <Link
            href="/admin/eventos"
            className="text-xs text-secondary hover:underline"
          >
            Ver histórico
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {eventos.slice(0, 8).map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between px-6 py-3 text-sm"
              >
                <div>
                  <div className="font-medium">
                    {tenantNome.get(e.tenant_id) ?? e.tenant_id.slice(0, 6)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {e.tipo.replaceAll("_", " ")} ·{" "}
                    {formatDate(e.created_at, { dateStyle: "short" })}
                  </div>
                </div>
                <EventoIcone tipo={e.tipo} />
              </li>
            ))}
            {eventos.length === 0 ? (
              <li className="p-6 text-center text-sm text-muted-foreground">
                Nenhum evento registrado.
              </li>
            ) : null}
          </ul>
        </CardContent>
      </Card>

      {/* Alerta operacional */}
      <Card className="mt-6 border-warning/40 bg-warning/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="max-w-xl text-sm">
            <b>Gateway de pagamento.</b> O LAVPRO expõe um{" "}
            <code>webhook endpoint</code> idempotente em{" "}
            <code>/api/webhooks/gateway</code>. Assinaturas só mudam para
            &ldquo;ativa&rdquo; quando um evento assinado é recebido do gateway.
          </div>
          <Link
            href="/admin/eventos"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            <CreditCard className="h-3.5 w-3.5" />
            Ver histórico
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "ativa":
      return <Badge variant="success">Ativa</Badge>;
    case "trial":
      return <Badge variant="secondary">Trial</Badge>;
    case "inadimplente":
      return <Badge variant="destructive">Inadimplente</Badge>;
    case "pausada":
      return <Badge variant="warning">Pausada</Badge>;
    case "cancelada":
      return <Badge variant="outline">Cancelada</Badge>;
    case "expirada":
      return <Badge variant="outline">Expirada</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function EventoIcone({ tipo }: { tipo: string }) {
  if (tipo === "ativada" || tipo === "renovada")
    return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (tipo === "inadimplente" || tipo === "pagamento_falhou")
    return <AlertTriangle className="h-4 w-4 text-destructive" />;
  return <span className="h-2 w-2 rounded-full bg-muted-foreground" />;
}
