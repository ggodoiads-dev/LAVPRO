import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { listClientes } from "@/lib/data/queries";
import { formatDate } from "@/lib/utils";

interface Props {
  searchParams: { q?: string };
}

export const metadata = { title: "Clientes" };

export default async function ClientesPage({ searchParams }: Props) {
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const clientes = await listClientes();
  const filtrados = q
    ? clientes.filter((c) =>
        [c.nome, c.telefone, c.email, c.documento]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      )
    : clientes;

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Base única de clientes com histórico e veículos vinculados."
        actions={
          <Button asChild variant="electric">
            <Link href="/clientes/novo">
              <Plus className="h-4 w-4" /> Novo cliente
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <form className="flex items-center gap-2 border-b border-border p-4" action="/clientes">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={q}
                placeholder="Buscar por nome, telefone, e-mail ou CPF/CNPJ"
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="outline">Buscar</Button>
          </form>

          {filtrados.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="Nenhum cliente encontrado"
                description={
                  q
                    ? "Tente outros termos de busca."
                    : "Cadastre seu primeiro cliente para começar a atender."
                }
                action={{ label: "Cadastrar cliente", href: "/clientes/novo" }}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead className="text-right">Marketing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link
                        href={`/clientes/${c.id}`}
                        className="font-medium hover:text-secondary"
                      >
                        {c.nome}
                      </Link>
                      {c.observacoes ? (
                        <div className="truncate text-xs text-muted-foreground max-w-xs">
                          {c.observacoes}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{c.telefone ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.email ?? ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{c.documento ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(c.created_at, { dateStyle: "short" })}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.consent_marketing ? (
                        <Badge variant="success">Opt-in</Badge>
                      ) : (
                        <Badge variant="secondary">—</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
