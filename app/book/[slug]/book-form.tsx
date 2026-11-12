"use client";

import * as React from "react";
import { useFormState, useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
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
  reservarAgendamento,
  type PublicBookState,
} from "@/app/book/[slug]/actions";
import type { Servico } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="electric" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar pedido de agendamento"}
    </Button>
  );
}

export function BookForm({
  slug,
  servicos,
}: {
  slug: string;
  servicos: Servico[];
}) {
  const [state, action] = useFormState<PublicBookState, FormData>(
    reservarAgendamento,
    {},
  );
  const [selecionados, setSelecionados] = React.useState<string[]>([]);

  const resumo = servicos
    .filter((s) => selecionados.includes(s.id))
    .reduce(
      (a, s) => ({ valor: a.valor + s.preco_base, duracao: a.duracao + s.duracao_min }),
      { valor: 0, duracao: 0 },
    );

  function toggle(id: string) {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  if (state.ok) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-semibold">Pedido enviado!</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Seu pedido foi recebido. A recepção vai confirmar em instantes e
          entrar em contato pelo WhatsApp informado.
        </p>
        {state.codigo ? (
          <Badge variant="outline">Protocolo: {state.codigo}</Badge>
        ) : null}
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-5 md:grid-cols-2">
      <input type="hidden" name="slug" value={slug} />

      <div className="space-y-2 md:col-span-2">
        <Label>Serviços *</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {servicos.map((s) => {
            const on = selecionados.includes(s.id);
            return (
              <label
                key={s.id}
                className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                  on ? "border-secondary bg-secondary/5" : "border-border"
                }`}
              >
                <input
                  type="checkbox"
                  name="servico_ids"
                  value={s.id}
                  checked={on}
                  onChange={() => toggle(s.id)}
                  className="mt-1 h-4 w-4 accent-primary"
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

      <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 p-3 md:col-span-2">
        <span className="text-sm text-muted-foreground">Resumo</span>
        <div className="flex items-center gap-3">
          <Badge variant="outline">{resumo.duracao || 0} min</Badge>
          <span className="text-base font-semibold">
            {formatCurrency(resumo.valor)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nome">Seu nome *</Label>
        <Input id="nome" name="nome" required placeholder="Ex.: Ana Silva" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="telefone">WhatsApp *</Label>
        <Input id="telefone" name="telefone" required placeholder="(11) 99999-0000" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" placeholder="opcional" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="inicio">Data e hora *</Label>
        <Input id="inicio" name="inicio" type="datetime-local" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="placa">Placa *</Label>
        <Input id="placa" name="placa" required maxLength={10} className="font-mono uppercase" placeholder="ABC1D23" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="categoria">Categoria</Label>
        <Select name="categoria" defaultValue="hatch">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="moto">Moto</SelectItem>
            <SelectItem value="hatch">Hatch</SelectItem>
            <SelectItem value="sedan">Sedan</SelectItem>
            <SelectItem value="suv">SUV</SelectItem>
            <SelectItem value="picape">Picape</SelectItem>
            <SelectItem value="caminhonete">Caminhonete</SelectItem>
            <SelectItem value="van">Van</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="marca">Marca</Label>
        <Input id="marca" name="marca" placeholder="Toyota" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="modelo">Modelo</Label>
        <Input id="modelo" name="modelo" placeholder="Corolla" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" name="observacoes" placeholder="Algum detalhe do veículo ou do atendimento." />
      </div>

      {state.error ? (
        <div className="md:col-span-2 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <div className="md:col-span-2">
        <Submit />
      </div>
    </form>
  );
}
