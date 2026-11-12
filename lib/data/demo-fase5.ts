import type { Campanha, CampanhaExecucao } from "@/types/database";

const T = "demo-tenant";
function iso(dayOffset: number, hour = 9) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const DEMO_CAMPANHAS: Campanha[] = [
  { id: "cm-1", tenant_id: T, codigo: "reativacao",           nome: "Reativar inativos",     descricao: "Clientes sem OS por 30 dias",       gatilho: "reativacao",           canal: "whatsapp", template_codigo: "reativacao",           parametros: { dias: 30 },  ativo: true,  ultima_execucao: iso(-3, 10), proxima_execucao: iso(4, 10),  created_at: iso(-30) },
  { id: "cm-2", tenant_id: T, codigo: "aniversario",          nome: "Aniversariantes",       descricao: "Mensagem no aniversário",            gatilho: "aniversario",          canal: "whatsapp", template_codigo: "aniversario",          parametros: {},            ativo: true,  ultima_execucao: iso(-1, 8),  proxima_execucao: iso(0, 8),   created_at: iso(-30) },
  { id: "cm-3", tenant_id: T, codigo: "pos_atendimento",      nome: "Pedir avaliação",       descricao: "2 dias após a entrega",              gatilho: "pos_atendimento",      canal: "whatsapp", template_codigo: "pos_atendimento",      parametros: { dias: 2 },   ativo: true,  ultima_execucao: iso(-1, 18), proxima_execucao: iso(0, 18),  created_at: iso(-30) },
  { id: "cm-4", tenant_id: T, codigo: "lembrete_agendamento", nome: "Lembrete",              descricao: "Até 4h antes do atendimento",        gatilho: "lembrete_agendamento", canal: "whatsapp", template_codigo: "lembrete_agendamento", parametros: { horas: 4 },  ativo: true,  ultima_execucao: iso(0, 7),   proxima_execucao: iso(0, 7),   created_at: iso(-30) },
];

export const DEMO_EXECUCOES: CampanhaExecucao[] = [
  { id: "ex-1", campanha_id: "cm-1", tenant_id: T, iniciada_em: iso(-3, 10), concluida_em: iso(-3, 10), alvos: 12, enfileiradas: 9,  erro: null },
  { id: "ex-2", campanha_id: "cm-3", tenant_id: T, iniciada_em: iso(-1, 18), concluida_em: iso(-1, 18), alvos: 4,  enfileiradas: 4,  erro: null },
  { id: "ex-3", campanha_id: "cm-4", tenant_id: T, iniciada_em: iso(0, 7),   concluida_em: iso(0, 7),   alvos: 3,  enfileiradas: 3,  erro: null },
];
