"use client";

import * as React from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { AlertCircle, Loader2 } from "lucide-react";
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
  venderPacote,
  type ActionState,
} from "@/app/(app)/pacotes/actions";
import type { Cliente, Pacote } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="electric" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar venda"}
    </Button>
  );
}

export function VenderPacoteForm({
  clientes,
  pacotes,
}: {
  clientes: Cliente[];
  pacotes: Pacote[];
}) {
  const [state, action] = useFormState<ActionState, FormData>(venderPacote, {});
  const [pacoteId, setPacoteId] = React.useState<string>("");
  const pacote = pacotes.find((p) => p.id === pacoteId);

  return (
    <form action={action} className="grid gap-5 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="cliente_id">Cliente *</Label>
        <Select name="cliente_id">
          <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
          <SelectContent>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pacote_id">Pacote *</Label>
        <Select name="pacote_id" value={pacoteId} onValueChange={setPacoteId}>
          <SelectTrigger><SelectValue placeholder="Selecione o pacote" /></SelectTrigger>
          <SelectContent>
            {pacotes.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome} · {formatCurrency(p.preco)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {pacote ? (
        <div className="md:col-span-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
          <div className="font-medium">{pacote.nome}</div>
          <div className="text-xs text-muted-foreground">
            {pacote.descricao} · validade {pacote.validade_dias} dias
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="valor">Valor pago (R$)</Label>
        <Input
          id="valor"
          name="valor"
          type="number"
          step="0.01"
          min={0}
          defaultValue={pacote?.preco ?? 0}
          placeholder="Vazio usa o preço do pacote"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" name="observacoes" placeholder="Forma de pagamento usada, comentários…" />
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
          <Link href="/pacotes">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
