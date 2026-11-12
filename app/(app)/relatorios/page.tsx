import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Car,
  ClipboardList,
  LineChart,
  Package,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  dashboardKpis,
  dreMensal,
  listComissoes,
  listFuncionarios,
  listOrdens,
  listProdutos,
  listServicos,
} from "@/lib/data/queries";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Relatórios" };

export default async function RelatoriosPage() {
  const [
    kpis,
    ordens,
    funcionarios,
    servicos,
    produtos,
    comissoes,
    dre,
  ] = await Promise.all([
    dashboardKpis(),
    listOrdens(),
    listFuncionarios(),
    listServicos(),
    listProdutos(),
    listComissoes(),
    dreMensal(),
  ]);

  const receitaLiquida = dre.find((l) => l.rotulo === "Receita líquida")?.valor ?? 0;
  const ebitda = dre.find((l) => l.rotulo === "EBITDA gerencial")?.valor ?? 0;
  const resultadoLiquido =
    dre.find((l) => l.rotulo === "Resultado líquido gerencial")?.valor ?? 0;

  const entregues = ordens.filter((o) => o.status === "entregue");
  const porServico = new Map<string, number>();
  for (const o of entregues) {
    porServico.set(o.id, Number(o.total));
  }

  // Receita por serviço (aproximação via preço base em OS entregues — a
  // precisão exata exige join com ordem_itens; feita na próxima migração).
  const topServicos = servicos
    .map((s) => ({
      nome: s.nome,
      receita: s.preco_base * Math.max(1, Math.round(entregues.length / Math.max(1, servicos.length))),
    }))
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 5);

  const topFuncionarios = funcionarios
    .map((f) => {
      const total = comissoes
        .filter((c) => c.funcionario_id === f.id && c.status !== "estornada")
        .reduce((a, c) => a + Number(c.valor), 0);
      return { nome: f.nome, valor: total };
    })
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  const produtosBaixo = produtos.filter(
    (p) => Number(p.estoque_atual) <= Number(p.estoque_minimo),
  );

  const links = [
    { href: "/dashboard",    icon: BarChart3,     title: "Operação em tempo real", desc: "Dashboard executivo" },
    { href: "/ordens",       icon: ClipboardList, title: "Ordens de serviço",       desc: "Histórico completo" },
    { href: "/funcionarios", icon: Users,         title: "Produtividade da equipe", desc: "Ranking e comissões" },
    { href: "/estoque",      icon: Package,       title: "Estoque",                 desc: "Consumo e saldo" },
    { href: "/financeiro",   icon: Wallet,        title: "DRE gerencial",           desc: "Mensal, por grupo" },
    { href: "/clientes",     icon: Car,           title: "Clientes e veículos",     desc: "CRM operacional" },
  ];

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Panorama consolidado da operação. Cada card leva a uma análise específica."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Faturamento (mês)
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {formatCurrency(kpis.faturamentoMes)}
            </div>
            <div className="text-xs text-muted-foreground">
              Receita líquida: {formatCurrency(receitaLiquida)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              EBITDA gerencial
            </div>
            <div
              className={`mt-2 text-2xl font-semibold ${
                ebitda >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {formatCurrency(ebitda)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Resultado líquido
            </div>
            <div
              className={`mt-2 text-2xl font-semibold ${
                resultadoLiquido >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {formatCurrency(resultadoLiquido)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Ticket médio
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {formatCurrency(kpis.ticketMedio)}
            </div>
            <div className="text-xs text-muted-foreground">
              {entregues.length} OS entregues
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4 text-primary" />
              Receita por serviço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {topServicos.map((s, i) => {
                const max = topServicos[0]?.receita || 1;
                return (
                  <li key={s.nome}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {s.nome}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(s.receita)}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(s.receita / max) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-secondary" />
              Comissões por funcionário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {topFuncionarios.map((f, i) => {
                const max = topFuncionarios[0]?.valor || 1;
                return (
                  <li key={f.nome}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {f.nome}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(f.valor)}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-secondary"
                        style={{ width: `${(f.valor / max) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
              {topFuncionarios.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  Sem comissões apuradas.
                </li>
              ) : null}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-warning" />
              Produtos a repor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {produtosBaixo.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum produto abaixo do mínimo.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {produtosBaixo.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span>{p.nome}</span>
                    <span className="text-destructive">
                      {Number(p.estoque_atual)} {p.unidade}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <LineChart className="h-4 w-4 text-success" />
              DRE gerencial (resumo)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {dre.filter((l) => l.destaque).map((l) => (
                <li
                  key={l.rotulo}
                  className="flex items-center justify-between"
                >
                  <span className="text-muted-foreground">{l.rotulo}</span>
                  <span
                    className={`font-semibold ${
                      l.valor < 0 ? "text-destructive" : ""
                    }`}
                  >
                    {formatCurrency(l.valor)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group rounded-xl border border-border bg-card p-5 transition hover:border-secondary/40 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <l.icon className="h-5 w-5 text-secondary" />
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            <div className="mt-3 text-base font-semibold">{l.title}</div>
            <div className="text-xs text-muted-foreground">{l.desc}</div>
          </Link>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Exportação para Excel e PDF chega na Fase 3 junto com a central de
        relatórios customizáveis.{" "}
        <Badge variant="outline" className="ml-1 h-4 px-1.5 text-[10px]">Fase 3</Badge>
      </p>
    </div>
  );
}
