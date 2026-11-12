import Link from "next/link";
import { Calendar, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  listAgendamentos,
  listClientes,
  listVeiculos,
} from "@/lib/data/queries";

export const metadata = { title: "Agenda" };

export default async function AgendamentosPage() {
  const [agendamentos, clientes, veiculos] = await Promise.all([
    listAgendamentos(),
    listClientes(),
    listVeiculos(),
  ]);

  const nomeCliente = new Map(clientes.map((c) => [c.id, c.nome]));
  const veiculoLabel = new Map(
    veiculos.map((v) => [
      v.id,
      `${v.placa} · ${[v.marca, v.modelo].filter(Boolean).join(" ")}`.trim(),
    ]),
  );

  // Agrupa por dia
  const porDia = new Map<string, typeof agendamentos>();
  for (const a of agendamentos) {
    const day = new Date(a.inicio).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
    const key = day;
    if (!porDia.has(key)) porDia.set(key, []);
    porDia.get(key)!.push(a);
  }

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Reservas confirmadas, pendências e encaixes."
        actions={
          <Button asChild variant="electric">
            <Link href="/agendamentos/novo">
              <Plus className="h-4 w-4" /> Novo agendamento
            </Link>
          </Button>
        }
      />

      {agendamentos.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Nenhum agendamento ativo"
          description="Crie o primeiro agendamento para começar."
          action={{ label: "Novo agendamento", href: "/agendamentos/novo" }}
        />
      ) : (
        <div className="space-y-5">
          {[...porDia.entries()].map(([dia, lista]) => (
            <Card key={dia}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base capitalize">{dia}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {lista.map((a) => {
                    const inicio = new Date(a.inicio);
                    const fim = new Date(a.fim);
                    return (
                      <li key={a.id} className="flex items-center gap-4 p-4">
                        <div className="w-20 shrink-0 text-center font-mono text-sm">
                          <div className="font-semibold">
                            {inicio.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            →{" "}
                            {fim.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">
                            {nomeCliente.get(a.cliente_id) ?? "Cliente"}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {veiculoLabel.get(a.veiculo_id) ?? "Veículo"}
                            {a.observacoes ? ` · ${a.observacoes}` : ""}
                          </div>
                        </div>
                        <Badge
                          variant={
                            a.status === "pendente" ? "warning" : "secondary"
                          }
                          className="capitalize"
                        >
                          {a.status}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
