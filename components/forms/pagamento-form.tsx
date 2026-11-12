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
  registrarPagamento,
  type ActionState,
} from "@/app/(app)/financeiro/actions";
import { formatCurrency } from "@/lib/utils";
import type { FormaPagamento, OrdemServico } from "@/types/database";

interface OrdemItemPagto extends OrdemServico {
  pago: number;
  saldo: number;
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="electric" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar pagamento"}
    </Button>
  );
}

export function PagamentoForm({
  ordens,
  formas,
}: {
  ordens: OrdemItemPagto[];
  formas: FormaPagamento[];
}) {
  const [state, action] = useFormState<ActionState, FormData>(
    registrarPagamento,
    {},
  );
  const [ordemId, setOrdemId] = React.useState<string>("");
  const ordem = ordens.find((o) => o.id === ordemId);

  return (
    <form action={action} className="grid gap-5 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="ordem_id">OS *</Label>
        <Select name="ordem_id" value={ordemId} onValueChange={setOrdemId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a OS com saldo em aberto" />
          </SelectTrigger>
          <SelectContent>
            {ordens.length === 0 ? (
              <SelectItem value="_vazio" disabled>
                Nenhuma OS com saldo em aberto
              </SelectItem>
            ) : (
              ordens.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  #{o.numero} — saldo {formatCurrency(o.saldo)}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {ordem ? (
        <div className="md:col-span-2 grid grid-cols-3 gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="font-semibold">
              {formatCurrency(Number(ordem.total))}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Já pago</div>
            <div className="font-semibold text-success">
              {formatCurrency(ordem.pago)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Saldo</div>
            <div className="font-semibold text-destructive">
              {formatCurrency(ordem.saldo)}
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="forma_id">Forma de pagamento</Label>
        <Select name="forma_id">
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {formas.map((f) => (
              <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="valor">Valor (R$) *</Label>
        <Input
          id="valor"
          name="valor"
          type="number"
          step="0.01"
          min={0.01}
          defaultValue={ordem?.saldo.toFixed(2)}
          required
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" name="observacoes" placeholder="NSU, parcelas, etc." />
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
          <Link href="/financeiro">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
