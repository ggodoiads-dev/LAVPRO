"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createFuncionario,
  type ActionState,
} from "@/app/(app)/funcionarios/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="electric" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar funcionário"}
    </Button>
  );
}

export default function NovoFuncionarioPage() {
  const [state, action] = useFormState<ActionState, FormData>(createFuncionario, {});
  return (
    <div>
      <PageHeader
        title="Novo funcionário"
        description="Cadastre a equipe operacional. Vincule a um login mais tarde, se necessário."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/funcionarios">
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
              <Input id="nome" name="nome" required placeholder="Ex.: Marcelo Souza" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input id="cargo" name="cargo" placeholder="Operador, Detalhador, Recepção" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vinculo">Vínculo</Label>
              <Select name="vinculo" defaultValue="clt">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="clt">CLT</SelectItem>
                  <SelectItem value="pj">PJ</SelectItem>
                  <SelectItem value="diarista">Diarista</SelectItem>
                  <SelectItem value="terceiro">Terceiro</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admissao">Admissão</Label>
              <Input id="admissao" name="admissao" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comissao_padrao">Comissão padrão (%)</Label>
              <Input id="comissao_padrao" name="comissao_padrao" type="number" step="0.01" min={0} max={100} defaultValue={0} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea id="observacoes" name="observacoes" />
            </div>
            <label className="flex items-center gap-2 md:col-span-2 text-sm">
              <input type="checkbox" name="ativo" defaultChecked className="h-4 w-4 accent-primary" />
              Funcionário ativo
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
                <Link href="/funcionarios">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
