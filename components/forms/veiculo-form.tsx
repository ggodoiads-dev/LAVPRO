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
  createVeiculo,
  type ActionState,
} from "@/app/(app)/veiculos/actions";

interface Props {
  clientes: { id: string; nome: string }[];
  defaultClienteId?: string;
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="electric" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar veículo"}
    </Button>
  );
}

export function VeiculoForm({ clientes, defaultClienteId }: Props) {
  const [state, action] = useFormState<ActionState, FormData>(createVeiculo, {});

  return (
    <form action={action} className="grid gap-5 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="cliente_id">Cliente *</Label>
        <Select name="cliente_id" defaultValue={defaultClienteId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o cliente proprietário" />
          </SelectTrigger>
          <SelectContent>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="placa">Placa *</Label>
        <Input
          id="placa"
          name="placa"
          required
          minLength={5}
          maxLength={10}
          placeholder="ABC1D23"
          className="font-mono uppercase"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="categoria">Categoria *</Label>
        <Select name="categoria" defaultValue="hatch">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
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
      <div className="space-y-2">
        <Label htmlFor="versao">Versão</Label>
        <Input id="versao" name="versao" placeholder="XEi" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ano">Ano</Label>
        <Input id="ano" name="ano" type="number" min={1950} max={2099} placeholder="2022" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cor">Cor</Label>
        <Input id="cor" name="cor" placeholder="Preto" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="quilometragem">Quilometragem</Label>
        <Input id="quilometragem" name="quilometragem" type="number" min={0} placeholder="35000" />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" name="observacoes" placeholder="Avarias conhecidas, acessórios, preferências." />
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
          <Link href="/veiculos">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
