"use client";

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
  createContaPagar,
  type ActionState,
} from "@/app/(app)/financeiro/actions";
import type { CategoriaFinanceira, FormaPagamento } from "@/types/database";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="electric" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar lançamento"}
    </Button>
  );
}

export function ContaPagarForm({
  categorias,
  formas,
}: {
  categorias: CategoriaFinanceira[];
  formas: FormaPagamento[];
}) {
  const [state, action] = useFormState<ActionState, FormData>(createContaPagar, {});
  return (
    <form action={action} className="grid gap-5 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="descricao">Descrição *</Label>
        <Input id="descricao" name="descricao" required placeholder="Aluguel · novembro" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="categoria_id">Categoria</Label>
        <Select name="categoria_id">
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="forma_id">Forma de pagamento</Label>
        <Select name="forma_id">
          <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
          <SelectContent>
            {formas.map((f) => (
              <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="valor">Valor (R$) *</Label>
        <Input id="valor" name="valor" type="number" step="0.01" min={0} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="vencimento">Vencimento *</Label>
        <Input id="vencimento" name="vencimento" type="date" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pago_em">Data de pagamento (se já pago)</Label>
        <Input id="pago_em" name="pago_em" type="date" />
      </div>
      <label className="flex items-center gap-2 text-sm md:col-span-2">
        <input type="checkbox" name="recorrente" className="h-4 w-4 accent-primary" />
        Despesa recorrente (repete mensalmente)
      </label>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" name="observacoes" />
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
