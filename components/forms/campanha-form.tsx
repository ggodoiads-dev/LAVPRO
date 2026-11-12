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
  salvarCampanha,
  type ActionState,
} from "@/app/(app)/inteligencia/actions";
import type { Campanha } from "@/types/database";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="electric" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar campanha"}
    </Button>
  );
}

const GATILHO_LABEL: Record<Campanha["gatilho"], string> = {
  reativacao: "Reativação de inativos",
  aniversario: "Aniversário do cliente",
  pos_atendimento: "Pós-atendimento (NPS)",
  lembrete_agendamento: "Lembrete de agendamento",
  manual: "Manual (só executa sob demanda)",
};

export function CampanhaForm({ campanha }: { campanha: Campanha }) {
  const [state, action] = useFormState<ActionState, FormData>(
    salvarCampanha,
    {},
  );
  const [gatilho, setGatilho] = React.useState<Campanha["gatilho"]>(
    campanha.gatilho,
  );

  const dias =
    (campanha.parametros as Record<string, number> | null)?.dias ?? "";
  const horas =
    (campanha.parametros as Record<string, number> | null)?.horas ?? "";

  const mostraDias = gatilho === "reativacao" || gatilho === "pos_atendimento";
  const mostraHoras = gatilho === "lembrete_agendamento";

  return (
    <form action={action} className="grid gap-5 md:grid-cols-2">
      <input type="hidden" name="id" value={campanha.id} />

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="nome">Nome *</Label>
        <Input id="nome" name="nome" required defaultValue={campanha.nome} />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" name="descricao" defaultValue={campanha.descricao ?? ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gatilho">Gatilho *</Label>
        <Select
          name="gatilho"
          value={gatilho}
          onValueChange={(v) => setGatilho(v as Campanha["gatilho"])}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(GATILHO_LABEL).map(([v, label]) => (
              <SelectItem key={v} value={v}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="canal">Canal *</Label>
        <Select name="canal" defaultValue={campanha.canal}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="email">E-mail</SelectItem>
            <SelectItem value="push">Push</SelectItem>
            <SelectItem value="console">Console (debug)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="template_codigo">Código do template</Label>
        <Input
          id="template_codigo"
          name="template_codigo"
          placeholder="reativacao / aniversario / veiculo_pronto …"
          defaultValue={campanha.template_codigo ?? ""}
        />
        <p className="text-[11px] text-muted-foreground">
          Referencia uma linha em <code>notificacoes_templates</code>.
          Sem template, usamos o corpo padrão da função.
        </p>
      </div>

      {mostraDias ? (
        <div className="space-y-2">
          <Label htmlFor="dias">Janela (dias)</Label>
          <Input
            id="dias"
            name="dias"
            type="number"
            min={0}
            defaultValue={dias}
            placeholder={gatilho === "reativacao" ? "30" : "2"}
          />
        </div>
      ) : null}

      {mostraHoras ? (
        <div className="space-y-2">
          <Label htmlFor="horas">Janela (horas)</Label>
          <Input
            id="horas"
            name="horas"
            type="number"
            min={0}
            defaultValue={horas}
            placeholder="4"
          />
        </div>
      ) : null}

      <label className="flex items-center gap-2 md:col-span-2 text-sm">
        <input
          type="checkbox"
          name="ativo"
          defaultChecked={campanha.ativo}
          className="h-4 w-4 accent-primary"
        />
        Campanha ativa (participa das execuções automáticas)
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
          <Link href="/inteligencia">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
