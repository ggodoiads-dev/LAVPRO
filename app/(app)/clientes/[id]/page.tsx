import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Car, Mail, MessageCircle, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCliente, listVeiculosDeCliente } from "@/lib/data/queries";
import { formatDate, initials } from "@/lib/utils";

interface Props {
  params: { id: string };
}

export default async function ClientePage({ params }: Props) {
  const cliente = await getCliente(params.id);
  if (!cliente) notFound();
  const veiculos = await listVeiculosDeCliente(cliente.id);

  return (
    <div>
      <PageHeader
        title={cliente.nome}
        description={`Cadastrado em ${formatDate(cliente.created_at, { dateStyle: "short" })}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/clientes">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
              {initials(cliente.nome)}
            </div>
            <div>
              <CardTitle>{cliente.nome}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {cliente.documento ?? "Sem documento informado"}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{cliente.telefone ?? "Sem telefone"}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <span>{cliente.whatsapp ?? "Sem WhatsApp"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{cliente.email ?? "Sem e-mail"}</span>
            </div>
            {cliente.consent_marketing ? (
              <Badge variant="success">Aceita receber comunicações</Badge>
            ) : (
              <Badge variant="secondary">Sem opt-in de marketing</Badge>
            )}
            {cliente.observacoes ? (
              <div className="pt-3 text-sm">
                <div className="text-xs font-medium uppercase text-muted-foreground">
                  Observações
                </div>
                <p className="mt-1 whitespace-pre-wrap text-foreground/90">
                  {cliente.observacoes}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              Veículos
            </CardTitle>
            <Button asChild variant="electric" size="sm">
              <Link href={`/veiculos/novo?cliente=${cliente.id}`}>Adicionar veículo</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {veiculos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Este cliente ainda não possui veículos cadastrados.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {veiculos.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <div className="font-mono text-sm font-semibold">
                        {v.placa}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {[v.marca, v.modelo, v.ano].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {v.categoria}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
