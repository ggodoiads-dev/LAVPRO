import { Bell, MessageCircle, Mail, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import {
  listAvaliacoes,
  listClientes,
  listNotificacoes,
} from "@/lib/data/queries";
import { formatDate } from "@/lib/utils";
import type { CanalNotificacao } from "@/types/database";

export const metadata = { title: "Notificações" };

const CANAL_META: Record<
  CanalNotificacao,
  { label: string; icon: typeof Bell; className: string }
> = {
  whatsapp: { label: "WhatsApp", icon: MessageCircle, className: "text-success" },
  sms:      { label: "SMS",      icon: Smartphone,   className: "text-secondary" },
  email:    { label: "E-mail",   icon: Mail,         className: "text-primary" },
  push:     { label: "Push",     icon: Bell,         className: "text-warning" },
  console:  { label: "Console",  icon: Bell,         className: "text-muted-foreground" },
};

export default async function NotificacoesPage() {
  const [notificacoes, avaliacoes, clientes] = await Promise.all([
    listNotificacoes(),
    listAvaliacoes(),
    listClientes(),
  ]);

  const nomeCliente = new Map(clientes.map((c) => [c.id, c.nome]));

  const pendentes = notificacoes.filter((n) => n.status === "pendente").length;
  const enviadas = notificacoes.filter((n) => n.status === "enviada").length;
  const comErro = notificacoes.filter((n) => n.status === "erro").length;

  const notaMedia =
    avaliacoes.length > 0
      ? avaliacoes.reduce((a, v) => a + v.nota, 0) / avaliacoes.length
      : null;

  return (
    <div>
      <PageHeader
        title="Notificações & avaliações"
        description="Fila de envios e feedback dos clientes."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Pendentes
            </div>
            <div className="mt-2 text-2xl font-semibold">{pendentes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Enviadas
            </div>
            <div className="mt-2 text-2xl font-semibold">{enviadas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Com erro
            </div>
            <div className="mt-2 text-2xl font-semibold text-destructive">
              {comErro}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              NPS médio
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {notaMedia === null ? "—" : notaMedia.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">
              {avaliacoes.length} avaliações
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6 border-warning/30 bg-warning/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
          <div className="max-w-xl">
            <b>Modo infraestrutura.</b> O LAVPRO enfileira cada mensagem e
            armazena o corpo renderizado. Nenhuma mensagem é efetivamente
            enviada até conectar WhatsApp (Meta Cloud/Z-API), SMS (Twilio) ou
            e-mail (Resend/SendGrid) em <code>lib/integrations/notifications.ts</code>.
          </div>
          <Badge variant="warning">Integrações: Fase 3+</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Fila</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {notificacoes.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Bell}
                title="Nenhuma mensagem na fila"
                description="Agendamentos e OS vão alimentar esta lista automaticamente."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Canal</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Quando</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notificacoes.map((n) => {
                  const meta = CANAL_META[n.canal];
                  const Icon = meta.icon;
                  return (
                    <TableRow key={n.id}>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 text-sm ${meta.className}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {meta.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {n.cliente_id ? nomeCliente.get(n.cliente_id) ?? n.destinatario : n.destinatario}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {n.destinatario}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md text-sm">
                        {n.assunto ? (
                          <div className="truncate font-medium">{n.assunto}</div>
                        ) : null}
                        <div className="truncate text-xs text-muted-foreground">
                          {n.corpo}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {n.enviada_em
                          ? `Enviada ${formatDate(n.enviada_em)}`
                          : n.agendada_para
                            ? `Para ${formatDate(n.agendada_para)}`
                            : `Criada ${formatDate(n.created_at)}`}
                      </TableCell>
                      <TableCell className="text-right">
                        {n.status === "enviada" ? (
                          <Badge variant="success">Enviada</Badge>
                        ) : n.status === "pendente" ? (
                          <Badge variant="warning">Pendente</Badge>
                        ) : n.status === "erro" ? (
                          <Badge variant="destructive">Erro</Badge>
                        ) : (
                          <Badge variant="secondary">Cancelada</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
