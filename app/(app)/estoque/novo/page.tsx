"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  createProduto,
  type ActionState,
} from "@/app/(app)/estoque/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="electric" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar produto"}
    </Button>
  );
}

export default function NovoProdutoPage() {
  const [state, action] = useFormState<ActionState, FormData>(createProduto, {});
  return (
    <div>
      <PageHeader
        title="Novo produto"
        description="Insumos consumidos pelas OS. A ficha técnica fica no cadastro do serviço."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/estoque">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <form action={action} className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input id="codigo" name="codigo" placeholder="SHP01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade</Label>
              <Input id="unidade" name="unidade" defaultValue="un" placeholder="un / L / kg / pct" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" name="nome" required placeholder="Shampoo Automotivo 5L" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Input id="categoria" name="categoria" placeholder="Lavagem, Estética, Acessório…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Input id="fornecedor" name="fornecedor" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custo_medio">Custo médio (R$)</Label>
              <Input id="custo_medio" name="custo_medio" type="number" step="0.01" min={0} defaultValue={0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preco_venda">Preço de venda avulso (R$)</Label>
              <Input id="preco_venda" name="preco_venda" type="number" step="0.01" min={0} defaultValue={0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estoque_atual">Estoque inicial</Label>
              <Input id="estoque_atual" name="estoque_atual" type="number" step="0.001" min={0} defaultValue={0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estoque_minimo">Estoque mínimo</Label>
              <Input id="estoque_minimo" name="estoque_minimo" type="number" step="0.001" min={0} defaultValue={0} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="local">Local de armazenamento</Label>
              <Input id="local" name="local" placeholder="Prateleira / Almoxarifado" />
            </div>
            <label className="flex items-center gap-2 md:col-span-2 text-sm">
              <input type="checkbox" name="ativo" defaultChecked className="h-4 w-4 accent-primary" />
              Produto ativo
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
                <Link href="/estoque">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
