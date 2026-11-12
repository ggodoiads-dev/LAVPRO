import {
  AlertTriangle,
  Brain,
  Calendar,
  Gauge,
  Lightbulb,
  Play,
  Power,
  Sparkles,
  TrendingUp,
} from "lucide-react";
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
  dreMensal,
  listCampanhaExecucoes,
  listCampanhas,
  listClientes,
  listOrdens,
  listProdutos,
  listServicos,
} from "@/lib/data/queries";
import { forecastDemanda, picosDemanda } from "@/lib/analytics/forecast";
import { recomendacoesOperacionais } from "@/lib/analytics/recomendacoes";
import { projetarDre } from "@/lib/analytics/projecao";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DemandHeatmap } from "@/components/analytics/demand-heatmap";
import { executarCampanha, toggleCampanha } from "./actions";

export const metadata = { title: "Inteligência" };

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const PRIO_META = {
  alta:  { label: "Alta",  className: "border-destructive/40 bg-destructive/10 text-destructive" },
  media: { label: "Média", className: "border-warning/40 bg-warning/10 text-warning-foreground" },
  baixa: { label: "Baixa", className: "border-border bg-muted text-muted-foreground" },
};

export default async function InteligenciaPage() {
  const [
    ordens,
    clientes,
    servicos,
    produtos,
    campanhas,
    execucoes,
    dre,
  ] = await Promise.all([
    listOrdens(),
    listClientes(),
    listServicos(),
    listProdutos(),
    listCampanhas(),
    listCampanhaExecucoes(),
    dreMensal(),
  ]);

  const slots = forecastDemanda(ordens);
  const picos = picosDemanda(slots);
  const recs = recomendacoesOperacionais({
    ordens,
    clientes,
    servicos,
    produtos,
  });
  const projecao = projetarDre(dre);

  const campanhaNome = new Map(campanhas.map((c) => [c.id, c.nome]));
  const receitaProjetada =
    projecao.linhas.find((l) => l.rotulo === "Receita líquida")?.projetado ?? 0;
  const ebitdaProjetado =
    projecao.linhas.find((l) => l.rotulo === "EBITDA gerencial")?.projetado ?? 0;

  return (
    <div>
      <PageHeader
        title="Inteligência operacional"
        description="Previsão de demanda, recomendações e automação de campanhas."
      />

      {/* Indicadores preditivos */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Receita projetada (mês)
              </span>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {formatCurrency(receitaProjetada)}
            </div>
            <div className="text-xs text-muted-foreground">
              {projecao.diasDecorridos}/{projecao.diasNoMes} dias — fator{" "}
              {projecao.fator.toFixed(2)}×
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                EBITDA projetado
              </span>
              <Gauge className="h-4 w-4 text-secondary" />
            </div>
            <div
              className={`mt-2 text-2xl font-semibold ${
                ebitdaProjetado >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {formatCurrency(ebitdaProjetado)}
            </div>
            <div className="text-xs text-muted-foreground">
              Extrapolado sobre o DRE corrente
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Recomendações ativas
              </span>
              <Lightbulb className="h-4 w-4 text-warning" />
            </div>
            <div className="mt-2 text-2xl font-semibold">{recs.length}</div>
            <div className="text-xs text-muted-foreground">
              {recs.filter((r) => r.prioridade === "alta").length} de alta prioridade
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Campanhas ativas
              </span>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {campanhas.filter((c) => c.ativo).length}
            </div>
            <div className="text-xs text-muted-foreground">
              {execucoes.reduce((a, e) => a + e.enfileiradas, 0)} mensagens já
              enfileiradas
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap + picos */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4 text-primary" />
              Previsão de demanda — últimos 90 dias
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Histograma por dia da semana × hora. Reflete o padrão real da
              operação; não é um modelo de IA.
            </p>
          </CardHeader>
          <CardContent>
            <DemandHeatmap slots={slots} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-secondary" />
              Horários mais movimentados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {picos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ainda sem histórico suficiente.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {picos.map((p) => (
                  <li
                    key={`${p.dia}:${p.hora}`}
                    className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <div>
                      <div className="font-medium">
                        {DIAS[p.dia]} ·{" "}
                        {String(p.hora).padStart(2, "0")}h
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Média {p.media.toFixed(1)} OS / ocorrência
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{p.qtd}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(p.receita)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recomendações */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-warning" />
            Recomendações operacionais
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Derivadas dos dados do próprio tenant. Nada aqui é sugestão
            genérica.
          </p>
        </CardHeader>
        <CardContent>
          {recs.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title="Operação dentro do esperado"
              description="Nenhum sinal relevante nas últimas análises."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {recs.map((r) => {
                const meta = PRIO_META[r.prioridade];
                return (
                  <div
                    key={r.id}
                    className={`rounded-xl border p-4 ${meta.className}`}
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={
                          r.prioridade === "alta"
                            ? "destructive"
                            : r.prioridade === "media"
                              ? "warning"
                              : "outline"
                        }
                      >
                        {meta.label}
                      </Badge>
                      {r.prioridade === "alta" ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : null}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-foreground">
                      {r.titulo}
                    </div>
                    <p className="mt-1 text-sm text-foreground/80">
                      {r.descricao}
                    </p>
                    {r.acao ? (
                      <a
                        href={r.acao.href}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
                      >
                        {r.acao.label} →
                      </a>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campanhas */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Campanhas automáticas
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Cada execução enfileira mensagens em{" "}
            <code>/notificacoes</code>. O envio real depende do worker de
            integração.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Gatilho</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Última execução</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campanhas.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.descricao}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <Badge variant="outline" className="capitalize">
                      {c.gatilho.replaceAll("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs capitalize">
                    {c.canal}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.ultima_execucao
                      ? formatDate(c.ultima_execucao, { dateStyle: "short" })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {c.ativo ? (
                      <Badge variant="success">Ativa</Badge>
                    ) : (
                      <Badge variant="secondary">Pausada</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <form action={executarCampanha}>
                        <input type="hidden" name="id" value={c.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent"
                          title="Executar agora"
                        >
                          <Play className="h-3 w-3" /> Executar
                        </button>
                      </form>
                      <form action={toggleCampanha}>
                        <input type="hidden" name="id" value={c.id} />
                        <input
                          type="hidden"
                          name="ativo"
                          value={c.ativo ? "true" : "false"}
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent"
                          title={c.ativo ? "Pausar" : "Ativar"}
                        >
                          <Power className="h-3 w-3" />
                          {c.ativo ? "Pausar" : "Ativar"}
                        </button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {campanhas.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-sm text-muted-foreground"
                  >
                    Nenhuma campanha cadastrada. Rode{" "}
                    <code>seed_campanhas_padrao()</code> no banco para começar.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Execuções recentes */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Execuções recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Campanha</TableHead>
                <TableHead className="text-right">Alvos</TableHead>
                <TableHead className="text-right">Enfileiradas</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {execucoes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-sm text-muted-foreground"
                  >
                    Nenhuma execução registrada.
                  </TableCell>
                </TableRow>
              ) : (
                execucoes.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(e.iniciada_em)}
                    </TableCell>
                    <TableCell>
                      {campanhaNome.get(e.campanha_id) ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">{e.alvos}</TableCell>
                    <TableCell className="text-right">
                      {e.enfileiradas}
                    </TableCell>
                    <TableCell>
                      {e.erro ? (
                        <Badge variant="destructive">Erro</Badge>
                      ) : e.concluida_em ? (
                        <Badge variant="success">Concluída</Badge>
                      ) : (
                        <Badge variant="warning">Em execução</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
