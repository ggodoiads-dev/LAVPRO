"use client";

import * as React from "react";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { portalConsultaAction } from "./actions";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Resultado {
  cliente?: { nome: string };
  veiculos?: { placa: string; marca: string | null; modelo: string | null }[];
  agendamentos?: {
    inicio: string;
    status: string;
    observacoes?: string | null;
  }[];
  ordens?: {
    numero: number;
    status: string;
    total: number;
    entregue_em: string | null;
    aberta_em?: string | null;
  }[];
  pontos?: number;
  error?: string;
}

export function PortalBuscaForm({ slug }: { slug: string }) {
  const [state, setState] = React.useState<Resultado | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    const data = new FormData(e.currentTarget);
    const res = await portalConsultaAction({
      slug,
      placa: String(data.get("placa") ?? ""),
      telefone: String(data.get("telefone") ?? ""),
    });
    setLoading(false);
    if (res?.error) {
      setErro(traduzirErro(res.error));
      setState(null);
      return;
    }
    setState(res as Resultado);
  }

  function traduzirErro(code: string) {
    switch (code) {
      case "estabelecimento_nao_encontrado":
        return "Estabelecimento não encontrado.";
      case "veiculo_nao_encontrado":
        return "Não encontramos esse veículo. Verifique a placa.";
      case "telefone_divergente":
        return "O telefone informado não confere com o cadastro do veículo.";
      default:
        return code;
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="placa">Placa</Label>
          <Input id="placa" name="placa" required maxLength={10} className="font-mono uppercase" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input id="telefone" name="telefone" required placeholder="(11) 99999-0000" />
        </div>
        <div className="flex items-end">
          <Button type="submit" variant="electric" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Consultar
          </Button>
        </div>
      </form>

      {erro ? (
        <div className="mt-6 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{erro}</span>
        </div>
      ) : null}

      {state ? (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 p-4">
            <div>
              <div className="text-xs text-muted-foreground">Cliente</div>
              <div className="text-lg font-semibold">
                {state.cliente?.nome}
              </div>
            </div>
            <Badge variant="secondary">
              {state.pontos ?? 0} pontos
            </Badge>
          </div>

          {state.agendamentos && state.agendamentos.length > 0 ? (
            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Próximos agendamentos
              </h3>
              <ul className="divide-y divide-border rounded-md border border-border bg-card">
                {state.agendamentos.map((a, idx) => (
                  <li key={idx} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <div className="font-medium">
                        {formatDate(a.inicio)}
                      </div>
                      {a.observacoes ? (
                        <div className="text-xs text-muted-foreground">
                          {a.observacoes}
                        </div>
                      ) : null}
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {a.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {state.ordens && state.ordens.length > 0 ? (
            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Últimas OS
              </h3>
              <ul className="divide-y divide-border rounded-md border border-border bg-card">
                {state.ordens.map((o) => (
                  <li key={o.numero} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <div className="font-mono font-semibold">#{o.numero}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {o.entregue_em
                          ? `Entregue em ${formatDate(o.entregue_em, { dateStyle: "short" })}`
                          : o.status}
                      </div>
                    </div>
                    <div className="font-semibold">
                      {formatCurrency(Number(o.total))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
