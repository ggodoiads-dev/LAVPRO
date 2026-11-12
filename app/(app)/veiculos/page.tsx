import Link from "next/link";
import { Car, Plus, Search } from "lucide-react";
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
import { listClientes, listVeiculos } from "@/lib/data/queries";

export const metadata = { title: "Veículos" };

export default async function VeiculosPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const [clientes, veiculos] = await Promise.all([listClientes(), listVeiculos()]);
  const clienteNome = new Map(clientes.map((c) => [c.id, c.nome]));

  const filtrados = q
    ? veiculos.filter((v) =>
        [v.placa, v.marca, v.modelo, clienteNome.get(v.cliente_id)]
          .filter(Boolean)
          .some((x) => String(x).toLowerCase().includes(q)),
      )
    : veiculos;

  return (
    <div>
      <PageHeader
        title="Veículos"
        description="Todos os veículos cadastrados, com histórico e vínculo com clientes."
        actions={
          <Button asChild variant="electric">
            <Link href="/veiculos/novo">
              <Plus className="h-4 w-4" /> Novo veículo
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <form className="flex items-center gap-2 border-b border-border p-4" action="/veiculos">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={q}
                placeholder="Buscar por placa, marca, modelo ou cliente"
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="outline">Buscar</Button>
          </form>

          {filtrados.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Car}
                title="Nenhum veículo encontrado"
                description={q ? "Tente outros termos." : "Cadastre o primeiro veículo."}
                action={{ label: "Cadastrar veículo", href: "/veiculos/novo" }}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Categoria</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono font-semibold">
                      {v.placa}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {[v.marca, v.modelo].filter(Boolean).join(" ") || "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {[v.versao, v.ano].filter(Boolean).join(" · ")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        className="hover:text-secondary"
                        href={`/clientes/${v.cliente_id}`}
                      >
                        {clienteNome.get(v.cliente_id) ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{v.cor ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {v.categoria}
                      </Badge>
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
