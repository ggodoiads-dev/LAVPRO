"use client";

import * as React from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createPacote,
  type ActionState,
} from "@/app/(app)/pacotes/actions";
import type { Servico } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="electric" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar pacote"}
    </Button>
  );
}

type Item = { servico_id: string; quantidade: number; nome: string; preco: number };

export function PacoteForm({ servicos }: { servicos: Servico[] }) {
  const [state, action] = useFormState<ActionState, FormData>(createPacote, {});
  const [itens, setItens] = React.useState<Item[]>([]);

  function add(id: string) {
    const s = servicos.find((x) => x.id === id);
    if (!s || itens.find((i) => i.servico_id === id)) return;
    setItens((prev) => [
      ...prev,
      { servico_id: s.id, quantidade: 1, nome: s.nome, preco: Number(s.preco_base) },
    ]);
  }
  function remove(id: string) {
    setItens((prev) => prev.filter((i) => i.servico_id !== id));
  }
  function setQtd(id: string, q: number) {
    setItens((prev) =>
      prev.map((i) =>
        i.servico_id === id ? { ...i, quantidade: Math.max(1, q || 1) } : i,
      ),
    );
  }

  const valorAvulso = itens.reduce((a, i) => a + i.preco * i.quantidade, 0);

  return (
    <form action={action} className="grid gap-5 md:grid-cols-2">
      <input
        type="hidden"
        name="itens"
        value={JSON.stringify(
          itens.map(({ nome: _n, preco: _p, ...rest }) => rest),
        )}
      />

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="nome">Nome *</Label>
        <Input id="nome" name="nome" required placeholder="Frequente — 4 lavagens completas" />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" name="descricao" placeholder="O que está incluso e para quem é indicado." />
      </div>

      <div className="space-y-2">
        <Label htmlFor="preco">Preço do pacote (R$) *</Label>
        <Input id="preco" name="preco" type="number" step="0.01" min={0} required />
        <p className="text-[11px] text-muted-foreground">
          Se avulso somaria <b>{formatCurrency(valorAvulso)}</b>.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="validade_dias">Validade (dias) *</Label>
        <Input id="validade_dias" name="validade_dias" type="number" min={1} defaultValue={90} required />
      </div>

      <div className="md:col-span-2">
        <Label className="mb-2 block">Itens do pacote *</Label>
        <Select onValueChange={add}>
          <SelectTrigger>
            <SelectValue placeholder="Adicionar serviço" />
          </SelectTrigger>
          <SelectContent>
            {servicos.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.nome} · {formatCurrency(s.preco_base)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="mt-2 rounded-md border border-border">
          {itens.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nenhum serviço selecionado.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {itens.map((it) => (
                <li key={it.servico_id} className="flex items-center gap-3 p-3">
                  <div className="flex-1">
                    <div className="font-medium">{it.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      Avulso: {formatCurrency(it.preco)} / unidade
                    </div>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    className="w-20"
                    value={it.quantidade}
                    onChange={(e) => setQtd(it.servico_id, Number(e.target.value))}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(it.servico_id)}
                    aria-label="Remover"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 md:col-span-2 text-sm">
        <input type="checkbox" name="ativo" defaultChecked className="h-4 w-4 accent-primary" />
        Pacote ativo (pode ser vendido)
      </label>

      {state.error ? (
        <div className="md:col-span-2 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <div className="flex items-center gap-2 md:col-span-2">
        <Submit />
        <Button asChild variant="ghost" type="button">
          <Link href="/pacotes">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
