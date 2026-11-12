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
import type {
  Agendamento,
  Cliente,
  OrdemServico,
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
