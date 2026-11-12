import {
  AlertTriangle,
  Calendar,
  Car,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Gauge,
  Receipt,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueChart, TopServicosChart } from "@/components/dashboard/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dashboardKpis, listOrdens } from "@/lib/data/queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import { statusConfig } from "@/lib/status";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const kpis = await dashboardKpis();
  const ordens = (await listOrdens()).slice(0, 6);

  return (
    <div>
      <PageHeader
        title="Visão geral"
        description="O que está acontecendo hoje no seu lava-carros."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Faturamento do dia"
          value={formatCurrency(kpis.faturamentoDia)}
          hint="OS entregues hoje"
          icon={CircleDollarSign}
          accent="primary"
        />
        <KpiCard
          label="Faturamento do mês"
          value={formatCurrency(kpis.faturamentoMes)}
          hint="OS entregues no mês"
          icon={Receipt}
          accent="secondary"
        />
        <KpiCard
          label="Ticket médio"
          value={formatCurrency(kpis.ticketMedio)}
          hint="Mês corrente"
          icon={Gauge}
          accent="success"
        />
        <KpiCard
          label="Veículos atendidos hoje"
          value={String(kpis.veiculosAtendidos)}
          hint={`${kpis.veiculosEmAtendimento} em atendimento agora`}
          icon={Car}
          accent="primary"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Em atendimento"
          value={String(kpis.veiculosEmAtendimento)}
          icon={Clock}
          accent="secondary"
        />
        <KpiCard
          label="Agendamentos ativos"
          value={String(kpis.agendamentosPendentes)}
          icon={Calendar}
          accent="primary"
        />
        <KpiCard
          label="Concluídos hoje"
          value={String(kpis.servicosConcluidos)}
          icon={CheckCircle2}
          accent="success"
        />
        <KpiCard
          label="Atrasados"
          value={String(kpis.servicosAtrasados)}
          icon={AlertTriangle}
          accent={kpis.servicosAtrasados > 0 ? "destructive" : "success"}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Faturamento — últimos 14 dias</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Receita de OS entregues, por dia.
              </p>
            </div>
            <Badge variant="outline">BRL</Badge>
          </CardHeader>
          <CardContent>
            <RevenueChart data={kpis.serieDiaria} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Serviços mais executados</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Mês corrente</p>
          </CardHeader>
          <CardContent>
            <TopServicosChart data={kpis.topServicos} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Ordens recentes
          </CardTitle>
          <a
            href="/ordens"
            className="text-xs font-medium text-secondary hover:underline"
          >
            Ver todas
          </a>
        </CardHeader>
        <CardContent>
          {ordens.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma ordem ainda. Abra a primeira pelo botão &ldquo;Nova OS&rdquo;.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {ordens.map((o) => {
                const s = statusConfig[o.status];
                return (
                  <div key={o.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-mono text-sm">
                        <span className="font-semibold">#{o.numero}</span>
                        <Badge variant={s.badge}>{s.label}</Badge>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Aberta em {formatDate(o.aberta_em)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {formatCurrency(Number(o.total))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {o.prevista_em
                          ? `Previsto ${formatDate(o.prevista_em, { hour: "2-digit", minute: "2-digit" })}`
                          : "—"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
