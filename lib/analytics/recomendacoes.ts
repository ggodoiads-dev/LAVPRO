import type {
  Cliente,
  OrdemServico,
  Produto,
  Servico,
} from "@/types/database";

export type Prioridade = "alta" | "media" | "baixa";

export interface Recomendacao {
  id: string;
  titulo: string;
  descricao: string;
  acao?: { label: string; href: string };
  prioridade: Prioridade;
  categoria: "operacao" | "comercial" | "estoque" | "financeiro";
}

/**
 * Motor de recomendações. Não usa heurísticas tiradas do ar — cada item
 * é derivado de uma pergunta concreta sobre os dados do tenant.
 */
export function recomendacoesOperacionais(input: {
  ordens: OrdemServico[];
  clientes: Cliente[];
  servicos: Servico[];
  produtos: Produto[];
}): Recomendacao[] {
  const { ordens, clientes, servicos, produtos } = input;
  const recs: Recomendacao[] = [];
  const agora = Date.now();
  const dia = 1000 * 60 * 60 * 24;

  // 1) Atraso de OS
  const atrasadas = ordens.filter(
    (o) =>
      o.prevista_em &&
      new Date(o.prevista_em).getTime() < agora &&
      !["entregue", "cancelado"].includes(o.status),
  );
  if (atrasadas.length > 0) {
    recs.push({
      id: "os-atrasadas",
      titulo: `${atrasadas.length} OS passaram do prazo previsto`,
      descricao:
        "Revise a fila do Kanban: redistribuir boxes ou acionar o operacional pode recuperar o SLA do dia.",
      acao: { label: "Ir ao Kanban", href: "/kanban" },
      prioridade: "alta",
      categoria: "operacao",
    });
  }

  // 2) Clientes inativos (sem OS há 45+ dias)
  const ultimaVisita = new Map<string, number>();
  for (const o of ordens) {
    const t = new Date(o.aberta_em).getTime();
    const cur = ultimaVisita.get(o.cliente_id) ?? 0;
    if (t > cur) ultimaVisita.set(o.cliente_id, t);
  }
  const inativos = clientes.filter((c) => {
    const t = ultimaVisita.get(c.id);
    if (!t) return false;
    return (agora - t) / dia >= 45;
  });
  if (inativos.length > 0) {
    recs.push({
      id: "clientes-inativos",
      titulo: `${inativos.length} clientes sem retornar há 45+ dias`,
      descricao:
        "Dispare a campanha de reativação para quem tem opt-in. A regra está pronta em /inteligencia.",
      acao: { label: "Ver campanhas", href: "/inteligencia" },
      prioridade: inativos.length >= 10 ? "alta" : "media",
      categoria: "comercial",
    });
  }

  // 3) Produtos abaixo do mínimo
  const baixoEstoque = produtos.filter(
    (p) => Number(p.estoque_atual) <= Number(p.estoque_minimo),
  );
  if (baixoEstoque.length > 0) {
    recs.push({
      id: "estoque-minimo",
      titulo: `${baixoEstoque.length} produtos no estoque mínimo`,
      descricao: baixoEstoque
        .slice(0, 4)
        .map((p) => p.nome)
        .join(" · "),
      acao: { label: "Abrir estoque", href: "/estoque" },
      prioridade: baixoEstoque.length >= 3 ? "alta" : "media",
      categoria: "estoque",
    });
  }

  // 4) Serviços com margem comercial alta
  const servicosComMargem = servicos
    .map((s) => ({
      ...s,
      margem:
        s.preco_base > 0
          ? ((s.preco_base - s.custo_estimado) / s.preco_base) * 100
          : 0,
    }))
    .filter((s) => s.ativo && s.margem >= 60)
    .sort((a, b) => b.margem - a.margem)
    .slice(0, 3);
  if (servicosComMargem.length > 0) {
    recs.push({
      id: "servicos-margem",
      titulo: "Oportunidade de margem acima de 60%",
      descricao:
        "Destaque " +
        servicosComMargem.map((s) => s.nome).join(", ") +
        " na recepção e nas campanhas — margem acima da média do catálogo.",
      acao: { label: "Ver catálogo", href: "/servicos" },
      prioridade: "media",
      categoria: "comercial",
    });
  }

  // 5) Faturamento semanal
  const umaSemana = agora - 7 * dia;
  const duasSemanas = agora - 14 * dia;
  const entregues = ordens.filter((o) => o.status === "entregue" && o.entregue_em);
  const faturamentoSemana = entregues
    .filter((o) => new Date(o.entregue_em!).getTime() >= umaSemana)
    .reduce((a, o) => a + Number(o.total), 0);
  const faturamentoSemanaAnterior = entregues
    .filter((o) => {
      const t = new Date(o.entregue_em!).getTime();
      return t >= duasSemanas && t < umaSemana;
    })
    .reduce((a, o) => a + Number(o.total), 0);
  if (faturamentoSemanaAnterior > 0) {
    const delta =
      ((faturamentoSemana - faturamentoSemanaAnterior) / faturamentoSemanaAnterior) * 100;
    if (delta <= -10) {
      recs.push({
        id: "queda-faturamento",
        titulo: `Faturamento caiu ${delta.toFixed(1)}% frente à semana anterior`,
        descricao:
          "Vale olhar: taxa de no-show, boxes ociosos e campanhas com fila pendente.",
        acao: { label: "Relatórios", href: "/relatorios" },
        prioridade: "alta",
        categoria: "financeiro",
      });
    } else if (delta >= 10) {
      recs.push({
        id: "alta-faturamento",
        titulo: `Faturamento subiu ${delta.toFixed(1)}% na semana`,
        descricao:
          "Boa semana. Vale reforçar a escala e já disparar lembretes para a próxima.",
        prioridade: "baixa",
        categoria: "financeiro",
      });
    }
  }

  // 6) Receita do mês projetada
  // (sinal; sem alertar como ação crítica)
  return recs;
}
