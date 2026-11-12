/**
 * Dados de amostra usados APENAS quando o Supabase ainda não foi
 * configurado (veja lib/supabase/env.ts). Nada aqui representa
 * informação de produção; é um fallback para que a interface seja
 * navegável durante o setup inicial.
 */

import type {
  Agendamento,
  Cliente,
  OrdemServico,
  Servico,
  Veiculo,
} from "@/types/database";

const T = "demo-tenant";
const U = "demo-unidade";
const now = new Date();

function iso(dayOffset: number, hour = 9, min = 0) {
  const d = new Date(now);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

export const DEMO_SERVICOS: Servico[] = [
  { id: "sv-1", tenant_id: T, nome: "Lavagem Simples",   categoria: "Lavagem",  descricao: "Lavagem externa", preco_base: 35,  custo_estimado: 5,  duracao_min: 30,  funcionarios_min: 1, comissao_percentual: 20, ativo: true },
  { id: "sv-2", tenant_id: T, nome: "Lavagem Completa",  categoria: "Lavagem",  descricao: "Externa + interna",preco_base: 65,  custo_estimado: 8,  duracao_min: 50,  funcionarios_min: 1, comissao_percentual: 25, ativo: true },
  { id: "sv-3", tenant_id: T, nome: "Higienização",      categoria: "Estética", descricao: "Interior",         preco_base: 220, custo_estimado: 25, duracao_min: 180, funcionarios_min: 1, comissao_percentual: 30, ativo: true },
  { id: "sv-4", tenant_id: T, nome: "Polimento",         categoria: "Estética", descricao: "Comercial",        preco_base: 350, custo_estimado: 40, duracao_min: 240, funcionarios_min: 1, comissao_percentual: 30, ativo: true },
  { id: "sv-5", tenant_id: T, nome: "Vitrificação",      categoria: "Estética", descricao: "Com coating",      preco_base: 950, custo_estimado: 90, duracao_min: 480, funcionarios_min: 1, comissao_percentual: 25, ativo: true },
];

export const DEMO_CLIENTES: Cliente[] = [
  { id: "cl-1", tenant_id: T, nome: "Ana Souza",       documento: null, telefone: "(11) 98888-1111", whatsapp: "(11) 98888-1111", email: "ana@ex.com",     endereco: null, nascimento: null, observacoes: null, preferencias: {}, consent_marketing: false, created_at: iso(-30), updated_at: iso(-30) },
  { id: "cl-2", tenant_id: T, nome: "Bruno Lima",      documento: null, telefone: "(11) 98888-2222", whatsapp: null,               email: "bruno@ex.com",   endereco: null, nascimento: null, observacoes: null, preferencias: {}, consent_marketing: true,  created_at: iso(-20), updated_at: iso(-20) },
  { id: "cl-3", tenant_id: T, nome: "Carla Mendes",    documento: null, telefone: "(11) 98888-3333", whatsapp: "(11) 98888-3333", email: null,             endereco: null, nascimento: null, observacoes: null, preferencias: {}, consent_marketing: false, created_at: iso(-10), updated_at: iso(-10) },
  { id: "cl-4", tenant_id: T, nome: "Diego Alvarenga", documento: null, telefone: "(11) 98888-4444", whatsapp: null,               email: "diego@ex.com",   endereco: null, nascimento: null, observacoes: null, preferencias: {}, consent_marketing: false, created_at: iso(-5),  updated_at: iso(-5) },
];

export const DEMO_VEICULOS: Veiculo[] = [
  { id: "vc-1", tenant_id: T, cliente_id: "cl-1", placa: "ABC1D23", marca: "Honda",     modelo: "Civic",   versao: "EXL", ano: 2022, cor: "Preto",  categoria: "sedan",  quilometragem: 24000, observacoes: null },
  { id: "vc-2", tenant_id: T, cliente_id: "cl-2", placa: "RSP7K42", marca: "Volkswagen",modelo: "T-Cross", versao: "Comf",ano: 2023, cor: "Branco", categoria: "suv",    quilometragem: 12000, observacoes: null },
  { id: "vc-3", tenant_id: T, cliente_id: "cl-3", placa: "GHI9F10", marca: "Toyota",    modelo: "Corolla", versao: "GLi", ano: 2021, cor: "Prata",  categoria: "sedan",  quilometragem: 56000, observacoes: null },
  { id: "vc-4", tenant_id: T, cliente_id: "cl-4", placa: "KLM4A77", marca: "Fiat",      modelo: "Strada",  versao: "Vol", ano: 2024, cor: "Vermelha", categoria: "picape", quilometragem: 3200,  observacoes: null },
];

export const DEMO_AGENDAMENTOS: Agendamento[] = [
  { id: "ag-1", tenant_id: T, unidade_id: U, cliente_id: "cl-1", veiculo_id: "vc-1", box_id: null, funcionario_id: null, inicio: iso(0, 9),  fim: iso(0, 10),  status: "confirmado", observacoes: null, created_at: iso(-1) },
  { id: "ag-2", tenant_id: T, unidade_id: U, cliente_id: "cl-2", veiculo_id: "vc-2", box_id: null, funcionario_id: null, inicio: iso(0, 11), fim: iso(0, 12),  status: "confirmado", observacoes: null, created_at: iso(-1) },
  { id: "ag-3", tenant_id: T, unidade_id: U, cliente_id: "cl-3", veiculo_id: "vc-3", box_id: null, funcionario_id: null, inicio: iso(1, 14), fim: iso(1, 15),  status: "pendente",   observacoes: null, created_at: iso(-1) },
];

export const DEMO_ORDENS: OrdemServico[] = [
  { id: "os-1", tenant_id: T, unidade_id: U, numero: 1024, cliente_id: "cl-1", veiculo_id: "vc-1", box_id: null, agendamento_id: null, status: "em_execucao", aberta_em: iso(0, 9),  inicio_execucao: iso(0, 9, 20),  fim_execucao: null,           prevista_em: iso(0, 10), entregue_em: null,          motivo_suspensao: null, subtotal: 65,  desconto: 0, total: 65,  checklist: {}, observacoes: null, created_at: iso(0), updated_at: iso(0) },
  { id: "os-2", tenant_id: T, unidade_id: U, numero: 1025, cliente_id: "cl-2", veiculo_id: "vc-2", box_id: null, agendamento_id: null, status: "aguardando",  aberta_em: iso(0, 9, 30), inicio_execucao: null,         fim_execucao: null,           prevista_em: iso(0, 11), entregue_em: null,          motivo_suspensao: null, subtotal: 220, desconto: 0, total: 220, checklist: {}, observacoes: null, created_at: iso(0), updated_at: iso(0) },
  { id: "os-3", tenant_id: T, unidade_id: U, numero: 1026, cliente_id: "cl-3", veiculo_id: "vc-3", box_id: null, agendamento_id: null, status: "inspecao",    aberta_em: iso(0, 8),  inicio_execucao: iso(0, 8, 15),  fim_execucao: iso(0, 11, 30), prevista_em: iso(0, 11), entregue_em: null,          motivo_suspensao: null, subtotal: 350, desconto: 0, total: 350, checklist: {}, observacoes: null, created_at: iso(0), updated_at: iso(0) },
  { id: "os-4", tenant_id: T, unidade_id: U, numero: 1027, cliente_id: "cl-4", veiculo_id: "vc-4", box_id: null, agendamento_id: null, status: "pronto",      aberta_em: iso(0, 7, 30), inicio_execucao: iso(0, 7, 45), fim_execucao: iso(0, 9, 30),  prevista_em: iso(0, 10), entregue_em: null,          motivo_suspensao: null, subtotal: 65,  desconto: 5, total: 60,  checklist: {}, observacoes: null, created_at: iso(0), updated_at: iso(0) },
  { id: "os-5", tenant_id: T, unidade_id: U, numero: 1023, cliente_id: "cl-1", veiculo_id: "vc-1", box_id: null, agendamento_id: null, status: "entregue",    aberta_em: iso(-1, 9), inicio_execucao: iso(-1, 9, 15),  fim_execucao: iso(-1, 11),   prevista_em: iso(-1, 11),entregue_em: iso(-1, 11, 20), motivo_suspensao: null, subtotal: 180, desconto: 0, total: 180, checklist: {}, observacoes: null, created_at: iso(-1), updated_at: iso(-1) },
];
