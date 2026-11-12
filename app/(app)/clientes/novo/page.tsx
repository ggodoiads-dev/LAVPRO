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
import { createCliente, type ActionState } from "../actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="electric" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar cliente"}
    </Button>
  );
}

export default function NovoClientePage() {
  const [state, action] = useFormState<ActionState, FormData>(createCliente, {});

  return (
    <div>
      <PageHeader
        title="Novo cliente"
        description="Preencha os dados do cliente. Apenas o nome é obrigatório."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/clientes">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <form action={action} className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input id="nome" name="nome" required placeholder="Ex.: Ana Silva" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documento">CPF ou CNPJ</Label>
              <Input id="documento" name="documento" placeholder="Somente números" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" name="telefone" placeholder="(11) 99999-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" name="whatsapp" placeholder="(11) 99999-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" placeholder="voce@exemplo.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nascimento">Nascimento</Label>
              <Input id="nascimento" name="nascimento" type="date" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input id="endereco" name="endereco" placeholder="Rua, número, bairro, cidade" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                placeholder="Preferências de atendimento, alergias, forma de pagamento habitual…"
              />
            </div>
            <label className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                name="consent_marketing"
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <span className="text-sm text-muted-foreground">
                Cliente autorizou receber comunicações promocionais.
              </span>
            </label>

            {state.error ? (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive md:col-span-2">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <span>{state.error}</span>
              </div>
            ) : null}

            <div className="flex items-center gap-2 md:col-span-2">
              <Submit />
              <Button asChild variant="ghost" type="button">
                <Link href="/clientes">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
