/**
 * Camada de acesso a dados — abstrai Supabase + modo demo.
 * - Se Supabase está configurado e há tenant ativo, lê do banco com RLS.
 * - Caso contrário, devolve dados de demonstração para que a UI permaneça
 *   navegável durante o setup inicial.
 */

import { getSession } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  DEMO_AGENDAMENTOS,
  DEMO_CLIENTES,
  DEMO_ORDENS,
  DEMO_SERVICOS,
  DEMO_VEICULOS,
} from "./demo";
import {
  DEMO_CATEGORIAS_FIN,
  DEMO_COMISSOES,
  DEMO_CONTAS_PAGAR,
  DEMO_CONTAS_RECEBER,
  DEMO_FORMAS,
  DEMO_FUNCIONARIOS,
  DEMO_PAGAMENTOS,
  DEMO_PRODUTOS,
} from "./demo-fase2";
import {
  DEMO_AVALIACOES,
  DEMO_CLIENTE_PACOTES,
  DEMO_NOTIFICACOES,
  DEMO_PACOTES,
  DEMO_PACOTE_ITENS,
  DEMO_PACOTE_SALDOS,
  DEMO_PONTOS_MOVIMENTOS,
  DEMO_REGRA_PONTOS,
} from "./demo-fase3";
import type {
  Agendamento,
  Avaliacao,
  CategoriaFinanceira,
  Cliente,
  ClientePacote,
  ClientePacoteSaldo,
  Comissao,
  ContaPagar,
  ContaReceber,
  FormaPagamento,
  Funcionario,
  Notificacao,
  OrdemServico,
  Pacote,
  PacoteItem,
  Pagamento,
  PontoMovimento,
  PontosRegra,
  Produto,
  Servico,
  Veiculo,
} from "@/types/database";

async function tenantId(): Promise<string | null> {
  const s = await getSession();
  return s.activeTenant?.id ?? null;
}

// ---------------- CLIENTES ----------------
export async function listClientes(): Promise<Cliente[]> {
  const supabase = createServerSupabase();
  const tid = await tenantId();
  if (!supabase || !tid) return DEMO_CLIENTES;
  const { data } = await supabase
    .from("clientes")
    .select("*")
    .eq("tenant_id", tid)
    .order("nome", { ascending: true });
  return (data as Cliente[]) ?? [];
}

export async function getCliente(id: string): Promise<Cliente | null> {
  const supabase = createServerSupabase();
  const tid = await tenantId();
  if (!supabase || !tid) return DEMO_CLIENTES.find((c) => c.id === id) ?? null;
  const { data } = await supabase
    .from("clientes")
    .select("*")
    .eq("tenant_id", tid)
    .eq("id", id)
    .maybeSingle();
  return (data as Cliente | null) ?? null;
}

// ---------------- VEÍCULOS ----------------
export async function listVeiculos(): Promise<Veiculo[]> {
  const supabase = createServerSupabase();
  const tid = await tenantId();
  if (!supabase || !tid) return DEMO_VEICULOS;
  const { data } = await supabase
    .from("veiculos")
    .select("*")
    .eq("tenant_id", tid)
    .order("placa", { ascending: true });
  return (data as Veiculo[]) ?? [];
}

export async function listVeiculosDeCliente(clienteId: string): Promise<Veiculo[]> {
  const supabase = createServerSupabase();
  const tid = await tenantId();
  if (!supabase || !tid)
    return DEMO_VEICULOS.filter((v) => v.cliente_id === clienteId);
  const { data } = await supabase
    .from("veiculos")
    .select("*")
    .eq("tenant_id", tid)
    .eq("cliente_id", clienteId);
  return (data as Veiculo[]) ?? [];
}

// ---------------- SERVIÇOS ----------------
export async function listServicos(): Promise<Servico[]> {
  const supabase = createServerSupabase();
  const tid = await tenantId();
  if (!supabase || !tid) return DEMO_SERVICOS;
  const { data } = await supabase
    .from("servicos")
    .select("*")
    .eq("tenant_id", tid)
    .order("nome", { ascending: true });
  return (data as Servico[]) ?? [];
}

// ---------------- AGENDAMENTOS ----------------
export async function listAgendamentos(from?: Date, to?: Date): Promise<Agendamento[]> {
  const supabase = createServerSupabase();
  const tid = await tenantId();
  if (!supabase || !tid) return DEMO_AGENDAMENTOS;
  let q = supabase.from("agendamentos").select("*").eq("tenant_id", tid);
  if (from) q = q.gte("inicio", from.toISOString());
  if (to) q = q.lte("inicio", to.toISOString());
  const { data } = await q.order("inicio", { ascending: true });
  return (data as Agendamento[]) ?? [];
}

// ---------------- ORDENS DE SERVIÇO ----------------
export async function listOrdens(statusFilter?: string[]): Promise<OrdemServico[]> {
  const supabase = createServerSupabase();
  const tid = await tenantId();
  if (!supabase || !tid) {
    return statusFilter
      ? DEMO_ORDENS.filter((o) => statusFilter.includes(o.status))
      : DEMO_ORDENS;
  }
  let q = supabase
    .from("ordens_servico")
    .select("*")
    .eq("tenant_id", tid);
  if (statusFilter?.length) q = q.in("status", statusFilter);
  const { data } = await q.order("numero", { ascending: false });
  return (data as OrdemServico[]) ?? [];
}

// ---------------- DASHBOARD ----------------
export interface DashboardKPIs {
  faturamentoDia: number;
  faturamentoMes: number;
  ticketMedio: number;
  veiculosAtendidos: number;
  veiculosEmAtendimento: number;
  agendamentosPendentes: number;
  servicosConcluidos: number;
  servicosAtrasados: number;
  serieDiaria: { dia: string; valor: number; qtd: number }[];
  topServicos: { nome: string; qtd: number; receita: number }[];
}

function startOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}
function startOfMonth(d: Date) {
  const r = new Date(d);
  r.setDate(1);
  r.setHours(0, 0, 0, 0);
  return r;
}

export async function dashboardKpis(): Promise<DashboardKPIs> {
  const ordens = await listOrdens();
  const servicos = await listServicos();
  const agendamentos = await listAgendamentos();

  const hoje = startOfDay(new Date());
  const inicioMes = startOfMonth(new Date());

  const entregues = ordens.filter((o) => o.status === "entregue");
  const emAtendimento = ordens.filter((o) =>
    ["recebido", "aguardando", "em_execucao", "inspecao"].includes(o.status),
  );
  const prontos = ordens.filter((o) => o.status === "pronto");
  const atrasadas = ordens.filter(
    (o) =>
      o.prevista_em != null &&
      new Date(o.prevista_em).getTime() < Date.now() &&
      !["entregue", "cancelado"].includes(o.status),
  );

  const entreguesHoje = entregues.filter(
    (o) => o.entregue_em && new Date(o.entregue_em) >= hoje,
  );
  const entreguesMes = entregues.filter(
    (o) => o.entregue_em && new Date(o.entregue_em) >= inicioMes,
  );

  const faturamentoDia = entreguesHoje.reduce((a, b) => a + Number(b.total), 0);
  const faturamentoMes = entreguesMes.reduce((a, b) => a + Number(b.total), 0);
  const ticketMedio =
    entreguesMes.length === 0 ? 0 : faturamentoMes / entreguesMes.length;

  // série dos últimos 14 dias
  const serieDiaria: DashboardKPIs["serieDiaria"] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const day = startOfDay(d);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    const ds = entregues.filter(
      (o) =>
        o.entregue_em &&
        new Date(o.entregue_em) >= day &&
        new Date(o.entregue_em) < nextDay,
    );
    serieDiaria.push({
      dia: day.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      valor: ds.reduce((a, b) => a + Number(b.total), 0),
      qtd: ds.length,
    });
  }

  // Serviços mais executados — aproximação: total das OS dividido entre serviços
  // (na Fase 2, usaremos a tabela ordem_itens real).
  const topServicos = servicos.slice(0, 5).map((s) => ({
    nome: s.nome,
    qtd: Math.max(1, Math.round(entreguesMes.length / 5)),
    receita: Number(s.preco_base) * Math.max(1, Math.round(entreguesMes.length / 5)),
  }));

  return {
    faturamentoDia,
    faturamentoMes,
    ticketMedio,
    veiculosAtendidos: entreguesHoje.length + prontos.length + emAtendimento.length,
    veiculosEmAtendimento: emAtendimento.length,
    agendamentosPendentes: agendamentos.filter((a) => a.status === "pendente" || a.status === "confirmado").length,
    servicosConcluidos: entreguesHoje.length + prontos.length,
    servicosAtrasados: atrasadas.length,
    serieDiaria,
    topServicos,
  };
}

// =========================================================
// FASE 2 ─ Funcionários, estoque, financeiro, comissões
// =========================================================

export async function listFuncionarios(): Promise<Funcionario[]> {
  const supabase = createServerSupabase();
  const tid = await tenantId();
  if (!supabase || !tid) return DEMO_FUNCIONARIOS;
  const { data } = await supabase
    .from("funcionarios")
    .select("*")
    .eq("tenant_id", tid)
    .order("nome", { ascending: true });
  return (data as Funcionario[]) ?? [];
}

export async function listProdutos(): Promise<Produto[]> {
  const supabase = createServerSupabase();
  const tid = await tenantId();
  if (!supabase || !tid) return DEMO_PRODUTOS;
  const { data } = await supabase
    .from("produtos")
    .select("*")
    .eq("tenant_id", tid)
    .order("nome", { ascending: true });
  return (data as Produto[]) ?? [];
}

export async function listFormasPagamento(): Promise<FormaPagamento[]> {
  const supabase = createServerSupabase();
  const tid = await tenantId();
  if (!supabase || !tid) return DEMO_FORMAS;
  const { data } = await supabase
    .from("formas_pagamento")
    .select("*")
    .eq("tenant_id", tid)
    .eq("ativo", true)
    .order("nome", { ascending: true });
  return (data as FormaPagamento[]) ?? [];
}

export async function listCategoriasFinanceiras(): Promise<CategoriaFinanceira[]> {
  const supabase = createServerSupabase();
  const tid = await tenantId();
  if (!supabase || !tid) return DEMO_CATEGORIAS_FIN;
  const { data } = await supabase
    .from("categorias_financeiras")
    .select("*")
    .eq("tenant_id", tid)
    .order("nome");
  return (data as CategoriaFinanceira[]) ?? [];
}

export async function listContasPagar(): Promise<ContaPagar[]> {
  const supabase = createServerSupabase();
  const tid = await tenantId();
  if (!supabase || !tid) return DEMO_CONTAS_PAGAR;
  const { data } = await supabase
    .from("contas_pagar")
    .select("*")
    .eq("tenant_id", tid)
    .order("vencimento", { ascending: true });
  return (data as ContaPagar[]) ?? [];
}

export async function listContasReceber(): Promise<ContaReceber[]> {
  const supabase = createServerSupabase();
  const tid = await tenantId();
  if (!supabase || !tid) return DEMO_CONTAS_RECEBER;
  const { data } = await supabase
    .from("contas_receber")
    .select("*")
    .eq("tenant_id", tid)
    .order("vencimento", { ascending: true });
  return (data as ContaReceber[]) ?? [];
}

export async function listPagamentos(): Promise<Pagamento[]> {
  const supabase = createServerSupabase();
  const tid = await tenantId();
  if (!supabase || !tid) return DEMO_PAGAMENTOS;
  const { data } = await supabase
    .from("pagamentos")
    .select("*")
    .eq("tenant_id", tid)
    .order("recebido_em", { ascending: false });
  return (data as Pagamento[]) ?? [];
}

export async function listComissoes(): Promise<Comissao[]> {
  const supabase = createServerSupabase();
  const tid = await tenantId();
  if (!supabase || !tid) return DEMO_COMISSOES;
  const { data } = await supabase
    .from("comissoes")
    .select("*")
    .eq("tenant_id", tid)
    .order("created_at", { ascending: false });
  return (data as Comissao[]) ?? [];
}

// ---------------- DRE gerencial ----------------
export interface DreLinha {
  rotulo: string;
  valor: number;
  destaque?: boolean;
  negativa?: boolean;
  margem?: number;
}

function monthWindow(ref = new Date()) {
  const inicio = new Date(ref);
  inicio.setDate(1);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(inicio);
  fim.setMonth(fim.getMonth() + 1);
  return { inicio, fim };
}

export async function dreMensal(ref = new Date()): Promise<DreLinha[]> {
  const { inicio, fim } = monthWindow(ref);
  const [ordens, contas, pagamentos, categorias, comissoes, produtos] =
    await Promise.all([
      listOrdens(),
      listContasPagar(),
      listPagamentos(),
      listCategoriasFinanceiras(),
      listComissoes(),
      listProdutos(),
    ]);

  // Receita bruta = soma de pagamentos dentro do mês.
  const receita = pagamentos
    .filter((p) => {
      const d = new Date(p.recebido_em);
      return d >= inicio && d < fim;
    })
    .reduce((a, p) => a + Number(p.valor), 0);

  // Descontos = soma de desconto em OS entregues no mês.
  const descontos = ordens
    .filter((o) => {
      if (!o.entregue_em) return false;
      const d = new Date(o.entregue_em);
      return d >= inicio && d < fim;
    })
    .reduce((a, o) => a + Number(o.desconto), 0);

  const receitaLiquida = receita - descontos;

  // Custo dos serviços: proxy via custo_estimado das OS entregues.
  const osEntreguesMes = ordens.filter((o) => {
    if (!o.entregue_em) return false;
    const d = new Date(o.entregue_em);
    return d >= inicio && d < fim;
  });
  const custoServicos = osEntreguesMes.reduce((acc, o) => {
    return acc + Number(o.total) * 0.08; // estimativa quando sem ficha técnica
  }, 0);

  const lucroBruto = receitaLiquida - custoServicos;

  // Despesas (contas pagas no mês) agrupadas por grupo do DRE.
  const catById = new Map(categorias.map((c) => [c.id, c]));
  const despesasNoMes = contas.filter((c) => {
    if (!c.pago_em) return false;
    const d = new Date(c.pago_em);
    return d >= inicio && d < fim;
  });

  const grupo = (g: string) =>
    despesasNoMes
      .filter((c) => (c.categoria_id ? catById.get(c.categoria_id)?.dre_grupo === g : false))
      .reduce((a, c) => a + Number(c.valor), 0);

  const despOperacional = grupo("despesa_operacional");
  const despPessoal =
    grupo("despesa_pessoal") +
    comissoes
      .filter((c) => c.status !== "estornada")
      .reduce((a, c) => a + Number(c.valor), 0);
  const despAdministrativa = grupo("despesa_administrativa");
  const despMarketing = grupo("despesa_marketing");
  const despFinanceira = grupo("despesa_financeira");
  const tributos = grupo("tributos_lucro");

  const despOperacionais =
    despOperacional + despPessoal + despAdministrativa + despMarketing;
  const ebitda = lucroBruto - despOperacionais;
  const resultadoAntesTributos = ebitda - despFinanceira;
  const resultadoLiquido = resultadoAntesTributos - tributos;

  const margem = (v: number) => (receitaLiquida > 0 ? (v / receitaLiquida) * 100 : 0);

  // Evita variável não usada
  void produtos;

  return [
    { rotulo: "Receita bruta",            valor: receita,                 destaque: true },
    { rotulo: "(−) Deduções",             valor: descontos,               negativa: true },
    { rotulo: "Receita líquida",          valor: receitaLiquida,          destaque: true, margem: 100 },
    { rotulo: "(−) Custo dos serviços",   valor: custoServicos,           negativa: true },
    { rotulo: "Lucro bruto",              valor: lucroBruto,              destaque: true, margem: margem(lucroBruto) },
    { rotulo: "(−) Despesas operacionais",valor: despOperacionais,        negativa: true },
    { rotulo: "EBITDA gerencial",         valor: ebitda,                  destaque: true, margem: margem(ebitda) },
    { rotulo: "(−) Despesas financeiras", valor: despFinanceira,          negativa: true },
    { rotulo: "Resultado antes do IR",    valor: resultadoAntesTributos,  destaque: true },
    { rotulo: "(−) Tributos sobre lucro", valor: tributos,                negativa: true },
    { rotulo: "Resultado líquido gerencial", valor: resultadoLiquido,     destaque: true, margem: margem(resultadoLiquido) },
  ];
}

// =========================================================
// FASE 3 ─ CRM, fidelização, portal
// =========================================================

export async function listPacotes(): Promise<Pacote[]> {
  const supabase = createServerSupabase();
  const tid = await tenantId();
  if (!supabase || !tid) return DEMO_PACOTES;
  const { data } = await supabase
    .from("pacotes")
    .select("*")
    .eq("tenant_id", tid)
    .order("nome");
  return (data as Pacote[]) ?? [];
}

export async function listPacoteItens(
  pacoteId?: string,
): Promise<PacoteItem[]> {
  const supabase = createServerSupabase();
  const tid = await tenantId();
  if (!supabase || !tid) {
    return pacoteId
      ? DEMO_PACOTE_ITENS.filter((i) => i.pacote_id === pacoteId)
      : DEMO_PACOTE_ITENS;
  }
  let q = supabase.from("pacote_itens").select("*");
  if (pacoteId) q = q.eq("pacote_id", pacoteId);
  const { data } = await q;
  return (data as PacoteItem[]) ?? [];
}

export async function listClientePacotes(): Promise<ClientePacote[]> {
  const supabase = createServerSupabase();
  const tid = await tenantId();
  if (!supabase || !tid) return DEMO_CLIENTE_PACOTES;
  const { data } = await supabase
    .from("cliente_pacotes")
    .select("*")
    .eq("tenant_id", tid)
    .order("comprado_em", { ascending: false });
  return (data as ClientePacote[]) ?? [];
}

export async function listClientePacoteSaldos(): Promise<ClientePacoteSaldo[]> {
  const supabase = createServerSupabase();
  const tid = await tenantId();
  if (!supabase || !tid) return DEMO_PACOTE_SALDOS;
  const { data } = await supabase.from("cliente_pacote_saldos").select("*");
  return (data as ClientePacoteSaldo[]) ?? [];
}

export async function getPontosRegra(): Promise<PontosRegra> {
  const supabase = createServerSupabase();
  const tid = await tenantId();
  if (!supabase || !tid) return DEMO_REGRA_PONTOS;
  const { data } = await supabase
    .from("pontos_regras")
    .select("*")
    .eq("tenant_id", tid)
    .maybeSingle();
  return (
    (data as PontosRegra | null) ?? {
      tenant_id: tid,
      pontos_por_real: 1,
      reais_por_ponto: 0.05,
      min_resgate_pontos: 200,
      ativo: false,
    }
  );
}

export async function listPontosMovimentos(): Promise<PontoMovimento[]> {
  const supabase = createServerSupabase();
  const tid = await tenantId();
  if (!supabase || !tid) return DEMO_PONTOS_MOVIMENTOS;
  const { data } = await supabase
    .from("pontos_movimentos")
    .select("*")
    .eq("tenant_id", tid)
    .order("criado_em", { ascending: false })
    .limit(200);
  return (data as PontoMovimento[]) ?? [];
}

export async function listNotificacoes(): Promise<Notificacao[]> {
  const supabase = createServerSupabase();
  const tid = await tenantId();
  if (!supabase || !tid) return DEMO_NOTIFICACOES;
  const { data } = await supabase
    .from("notificacoes")
    .select("*")
    .eq("tenant_id", tid)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data as Notificacao[]) ?? [];
}

export async function listAvaliacoes(): Promise<Avaliacao[]> {
  const supabase = createServerSupabase();
  const tid = await tenantId();
  if (!supabase || !tid) return DEMO_AVALIACOES;
  const { data } = await supabase
    .from("avaliacoes")
    .select("*")
    .eq("tenant_id", tid)
    .order("created_at", { ascending: false });
  return (data as Avaliacao[]) ?? [];
}
