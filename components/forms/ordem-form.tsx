"use client";

import * as React from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
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
  createOrdem,
  type ActionState,
} from "@/app/(app)/ordens/actions";
import type { Cliente, Servico, Veiculo } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

interface Props {
  unidadeId: string;
  clientes: Cliente[];
  veiculos: Veiculo[];
  servicos: Servico[];
}

type Item = {
  servico_id: string;
  quantidade: number;
  preco_unit: number;
  comissao_percentual: number;
  nome: string;
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="electric" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Abrir OS"}
    </Button>
  );
}

export function OrdemForm({
  unidadeId,
  clientes,
  veiculos,
  servicos,
}: Props) {
  const [state, action] = useFormState<ActionState, FormData>(createOrdem, {});
  const [clienteId, setClienteId] = React.useState("");
  const [items, setItems] = React.useState<Item[]>([]);
  const [desconto, setDesconto] = React.useState(0);

  const veiculosCliente = React.useMemo(
    () => veiculos.filter((v) => v.cliente_id === clienteId),
    [veiculos, clienteId],
  );

  const subtotal = items.reduce(
    (a, i) => a + i.quantidade * i.preco_unit,
    0,
  );
  const total = Math.max(0, subtotal - (desconto || 0));

  function addServico(id: string) {
    const s = servicos.find((x) => x.id === id);
    if (!s) return;
    if (items.find((i) => i.servico_id === id)) return;
    setItems((prev) => [
      ...prev,
      {
        servico_id: s.id,
        nome: s.nome,
        quantidade: 1,
        preco_unit: Number(s.preco_base),
        comissao_percentual: Number(s.comissao_percentual),
      },
    ]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.servico_id !== id));
  }

  function updateItem(id: string, patch: Partial<Item>) {
    setItems((prev) =>
      prev.map((i) => (i.servico_id === id ? { ...i, ...patch } : i)),
    );
  }

  return (
    <form action={action} className="grid gap-5 md:grid-cols-2">
      <input type="hidden" name="unidade_id" value={unidadeId} />
      <input
        type="hidden"
        name="itens"
        value={JSON.stringify(
          items.map(({ nome: _nome, ...i }) => i),
        )}
      />
      <input type="hidden" name="desconto" value={desconto || 0} />

      <div className="space-y-2">
        <Label htmlFor="cliente_id">Cliente *</Label>
        <Select name="cliente_id" value={clienteId} onValueChange={setClienteId}>
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
        <Select name="veiculo_id" disabled={!clienteId}>
          <SelectTrigger>
            <SelectValue
              placeholder={
                clienteId
                  ? veiculosCliente.length === 0
                    ? "Nenhum veículo deste cliente"
                    : "Selecione o veículo"
                  : "Selecione o cliente primeiro"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {veiculosCliente.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.placa} · {[v.marca, v.modelo].filter(Boolean).join(" ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prevista_em">Previsão de conclusão</Label>
        <Input id="prevista_em" name="prevista_em" type="datetime-local" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="desconto">Desconto (R$)</Label>
        <Input
          id="desconto"
          type="number"
          min={0}
          step="0.01"
          value={desconto}
          onChange={(e) => setDesconto(Number(e.target.value) || 0)}
        />
      </div>

      {/* Adicionar serviço */}
      <div className="space-y-2 md:col-span-2">
        <Label>Serviços da OS *</Label>
        <div className="flex items-center gap-2">
          <Select
            onValueChange={(v) => {
              addServico(v);
            }}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Adicionar serviço do catálogo" />
            </SelectTrigger>
            <SelectContent>
              {servicos.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nome} — {formatCurrency(s.preco_base)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-2 rounded-md border border-border">
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nenhum serviço selecionado.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((it) => (
                <li key={it.servico_id} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{it.nome}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={it.quantidade}
                      onChange={(e) =>
                        updateItem(it.servico_id, {
                          quantidade: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="w-20"
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={it.preco_unit}
                      onChange={(e) =>
                        updateItem(it.servico_id, {
                          preco_unit: Number(e.target.value) || 0,
                        })
                      }
                      className="w-28"
                    />
                    <div className="w-28 text-right font-semibold">
                      {formatCurrency(it.quantidade * it.preco_unit)}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(it.servico_id)}
                      aria-label="Remover"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="md:col-span-2 flex items-center justify-between rounded-md border border-border bg-muted/40 p-3">
        <div>
          <div className="text-xs text-muted-foreground">Subtotal</div>
          <div className="text-sm font-medium">{formatCurrency(subtotal)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Desconto</div>
          <div className="text-sm font-medium">{formatCurrency(desconto)}</div>
        </div>
        <div>
          <Badge variant="secondary" className="mb-1">Total</Badge>
          <div className="text-xl font-semibold">{formatCurrency(total)}</div>
        </div>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" name="observacoes" placeholder="Checklist, instruções para operação…" />
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
          <Link href="/kanban">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
