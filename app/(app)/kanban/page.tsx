import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  listClientes,
  listOrdens,
  listVeiculos,
} from "@/lib/data/queries";
import { ALLOWED_TRANSITIONS, KANBAN_COLUMNS, statusConfig } from "@/lib/status";
import { formatCurrency, formatDate, minutesBetween } from "@/lib/utils";
import { StatusMove } from "@/components/kanban/status-move";
import type { OrdemServico, StatusOS } from "@/types/database";

export const metadata = { title: "Kanban" };

function TempoDecorrido({ os }: { os: OrdemServico }) {
  const inicio =
    os.inicio_execucao ? new Date(os.inicio_execucao) : new Date(os.aberta_em);
  const now = new Date();
  const mins = minutesBetween(inicio, now);
  const horas = Math.floor(mins / 60);
  const resto = mins % 60;
  const atrasado =
    os.prevista_em && new Date(os.prevista_em).getTime() < now.getTime();
  return (
    <div
      className={`inline-flex items-center gap-1 text-[11px] font-medium ${
        atrasado ? "text-destructive" : "text-muted-foreground"
      }`}
    >
      {atrasado ? <AlertTriangle className="h-3 w-3" /> : null}
      {horas > 0 ? `${horas}h${String(resto).padStart(2, "0")}` : `${mins} min`}
    </div>
  );
}

export default async function KanbanPage() {
  const [ordens, clientes, veiculos] = await Promise.all([
    listOrdens(),
    listClientes(),
    listVeiculos(),
  ]);
  const nomeCliente = new Map(clientes.map((c) => [c.id, c.nome]));
  const veiculoLabel = new Map(veiculos.map((v) => [v.id, v.placa]));

  const ordensAtivas = ordens.filter((o) =>
    KANBAN_COLUMNS.includes(o.status as StatusOS),
  );
  const colunas = KANBAN_COLUMNS.map((s) => ({
    status: s,
    config: statusConfig[s],
    cards: ordensAtivas
      .filter((o) => o.status === s)
      .sort((a, b) => a.aberta_em.localeCompare(b.aberta_em)),
  }));

  const total = ordensAtivas.length;
  const faturando = ordensAtivas.reduce(
    (a, b) => a + Number(b.total),
    0,
  );

  return (
    <div>
      <PageHeader
        title="Kanban operacional"
        description="Movimente as OS entre as etapas. Atrasos aparecem destacados."
        actions={
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <div className="text-xs text-muted-foreground">
                {total} em andamento · {formatCurrency(faturando)}
              </div>
            </div>
            <Button asChild variant="electric">
              <Link href="/ordens/novo">
                <Plus className="h-4 w-4" /> Nova OS
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {colunas.map((col) => (
          <section
            key={col.status}
            className="flex min-h-[220px] flex-col rounded-xl border border-border bg-card"
          >
            <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${col.config.color}`} />
                <h2 className="text-sm font-semibold">{col.config.label}</h2>
              </div>
              <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                {col.cards.length}
              </Badge>
            </header>
            <div className="flex-1 space-y-2 p-3">
              {col.cards.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  Vazio
                </div>
              ) : (
                col.cards.map((o) => (
                  <article
                    key={o.id}
                    className="rounded-lg border border-border bg-background p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-xs font-semibold">
                        #{o.numero}
                      </div>
                      <TempoDecorrido os={o} />
                    </div>
                    <div className="mt-2 font-mono text-sm font-semibold">
                      {veiculoLabel.get(o.veiculo_id) ?? "—"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {nomeCliente.get(o.cliente_id) ?? "Cliente"}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {o.prevista_em
                          ? `Previsto ${formatDate(o.prevista_em, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                          : "Sem previsão"}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(Number(o.total))}
                      </span>
                    </div>
                    <StatusMove
                      id={o.id}
                      transicoes={ALLOWED_TRANSITIONS[o.status as StatusOS].filter(
                        (t) => !["cancelado", "suspenso"].includes(t),
                      )}
                    />
                  </article>
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
