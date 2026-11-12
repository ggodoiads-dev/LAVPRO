"use client";

import Link from "next/link";
import * as React from "react";
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
import {
  registrarMovimento,
  type ActionState,
} from "@/app/(app)/estoque/actions";
import type { Produto } from "@/types/database";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="electric" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar movimento"}
    </Button>
  );
}

export function MovimentoForm({ produtos }: { produtos: Produto[] }) {
  const [state, action] = useFormState<ActionState, FormData>(
    registrarMovimento,
    {},
  );
  const [tipo, setTipo] = React.useState<string>("entrada");

  return (
    <form action={action} className="grid gap-5 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="produto_id">Produto *</Label>
        <Select name="produto_id">
          <SelectTrigger>
            <SelectValue placeholder="Selecione o produto" />
          </SelectTrigger>
          <SelectContent>
            {produtos.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome} · saldo {p.estoque_atual} {p.unidade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tipo">Tipo *</Label>
        <Select name="tipo" value={tipo} onValueChange={setTipo}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="entrada">Entrada (compra)</SelectItem>
            <SelectItem value="saida">Saída (consumo avulso)</SelectItem>
            <SelectItem value="perda">Perda</SelectItem>
            <SelectItem value="inventario">Inventário (novo saldo)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantidade">
          {tipo === "inventario" ? "Novo saldo *" : "Quantidade *"}
        </Label>
        <Input
          id="quantidade"
          name="quantidade"
          type="number"
          step="0.001"
          min={0.001}
          required
        />
      </div>

      {tipo === "entrada" ? (
        <div className="space-y-2">
          <Label htmlFor="custo_unit">Custo unitário</Label>
          <Input id="custo_unit" name="custo_unit" type="number" step="0.01" min={0} />
          <p className="text-[11px] text-muted-foreground">
            Com custo, o custo médio do produto é recalculado.
          </p>
        </div>
      ) : null}

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="motivo">Motivo</Label>
        <Textarea id="motivo" name="motivo" placeholder="Nota fiscal, descarte, acerto de inventário…" />
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
          <Link href="/estoque">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
