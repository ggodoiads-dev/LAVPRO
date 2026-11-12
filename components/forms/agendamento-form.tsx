"use client";

import * as React from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  createAgendamento,
  type ActionState,
} from "@/app/(app)/agendamentos/actions";
import type { Cliente, Servico, Veiculo } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

interface Props {
  tenantId: string;
  unidadeId: string;
  clientes: Cliente[];
  veiculos: Veiculo[];
  servicos: Servico[];
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="electric" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar agendamento"}
    </Button>
  );
}

export function AgendamentoForm({
  unidadeId,
  clientes,
  veiculos,
  servicos,
}: Props) {
  const [state, action] = useFormState<ActionState, FormData>(
    createAgendamento,
    {},
  );
  const [clienteId, setClienteId] = React.useState<string>("");
  const [selecionados, setSelecionados] = React.useState<string[]>([]);

  const veiculosDoCliente = React.useMemo(
    () => veiculos.filter((v) => v.cliente_id === clienteId),
    [veiculos, clienteId],
  );

  const resumo = React.useMemo(() => {
    const items = servicos.filter((s) => selecionados.includes(s.id));
    return {
      valor: items.reduce((a, s) => a + Number(s.preco_base), 0),
      duracao: items.reduce((a, s) => a + s.duracao_min, 0),
    };
  }, [selecionados, servicos]);

  function toggleServico(id: string) {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <form action={action} className="grid gap-5 md:grid-cols-2">
      <input type="hidden" name="unidade_id" value={unidadeId} />
      <input type="hidden" name="duracao_min" value={resumo.duracao || 60} />

      <div className="space-y-2">
        <Label htmlFor="cliente_id">Cliente *</Label>
        <Select
          name="cliente_id"
          value={clienteId}
          onValueChange={(v) => {
            setClienteId(v);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o cliente" />
          </SelectTrigger>
          <SelectContent>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="veiculo_id">Veículo *</Label>
        <Select name="veiculo_id" disabled={veiculosDoCliente.length === 0}>
          <SelectTrigger>
            <SelectValue
              placeholder={
                clienteId
                  ? veiculosDoCliente.length === 0
                    ? "Nenhum veículo deste cliente"
                    : "Selecione o veículo"
                  : "Selecione o cliente primeiro"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {veiculosDoCliente.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.placa} · {[v.marca, v.modelo].filter(Boolean).join(" ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="inicio">Início *</Label>
        <Input id="inicio" name="inicio" type="datetime-local" required />
      </div>

      <div className="space-y-2">
        <Label>Duração estimada</Label>
        <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm">
          {resumo.duracao || 60} min
        </div>
      </div>

      <div className="md:col-span-2">
        <Label className="mb-2 block">Serviços *</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {servicos.map((s) => {
            const checked = selecionados.includes(s.id);
            return (
              <label
                key={s.id}
                className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                  checked
                    ? "border-secondary bg-secondary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-primary"
                  checked={checked}
                  onChange={() => toggleServico(s.id)}
                  name="servico_ids"
                  value={s.id}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{s.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.duracao_min} min · {formatCurrency(s.preco_base)}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="md:col-span-2 flex items-center justify-between rounded-md border border-border bg-muted/40 p-3">
        <div className="text-sm text-muted-foreground">Resumo</div>
        <div className="flex items-center gap-4">
          <Badge variant="outline">{resumo.duracao || 0} min</Badge>
          <div className="text-base font-semibold">
            {formatCurrency(resumo.valor)}
          </div>
        </div>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" name="observacoes" placeholder="Instruções para a equipe…" />
      </div>

      {state.error ? (
        <div className="md:col-span-2 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <div className="flex items-center gap-2 md:col-span-2">
        <Submit />
        <Button asChild variant="ghost" type="button">
          <Link href="/agendamentos">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
