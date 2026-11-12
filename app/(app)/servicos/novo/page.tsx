"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  createServico,
  type ActionState,
} from "@/app/(app)/servicos/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="electric" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar serviço"}
    </Button>
  );
}

export default function NovoServicoPage() {
  const [state, action] = useFormState<ActionState, FormData>(createServico, {});
  return (
    <div>
      <PageHeader
        title="Novo serviço"
        description="Cadastre serviços do catálogo com preço, custo, duração e comissão."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/servicos">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <form action={action} className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" name="nome" required placeholder="Lavagem completa" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Input id="categoria" name="categoria" placeholder="Lavagem, Estética, Polimento…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duracao_min">Duração padrão (min) *</Label>
              <Input id="duracao_min" name="duracao_min" type="number" min={5} defaultValue={60} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preco_base">Preço base (R$) *</Label>
              <Input id="preco_base" name="preco_base" type="number" step="0.01" min={0} defaultValue={0} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custo_estimado">Custo estimado (R$)</Label>
              <Input id="custo_estimado" name="custo_estimado" type="number" step="0.01" min={0} defaultValue={0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comissao_percentual">Comissão (%)</Label>
              <Input id="comissao_percentual" name="comissao_percentual" type="number" step="0.01" min={0} max={100} defaultValue={0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="funcionarios_min">Funcionários necessários</Label>
              <Input id="funcionarios_min" name="funcionarios_min" type="number" min={1} defaultValue={1} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" name="descricao" placeholder="O que está incluso no serviço…" />
            </div>
            <label className="flex items-center gap-2 md:col-span-2 text-sm">
              <input type="checkbox" name="ativo" defaultChecked className="h-4 w-4 accent-primary" />
              Serviço ativo no catálogo
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
                <Link href="/servicos">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
