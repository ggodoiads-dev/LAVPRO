import type {
  Avaliacao,
  ClientePacote,
  ClientePacoteSaldo,
  Notificacao,
  PacoteItem,
  Pacote,
  PontoMovimento,
  PontosRegra,
} from "@/types/database";

const T = "demo-tenant";

function iso(dayOffset: number, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}
function dateOnly(dayOffset: number) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}

export const DEMO_PACOTES: Pacote[] = [
  { id: "pk-1", tenant_id: T, nome: "Frequente — 4 lavagens completas", descricao: "Economize 15% comprando 4 lavagens antecipadas.", preco: 220, validade_dias: 90,  ativo: true },
  { id: "pk-2", tenant_id: T, nome: "Estética Plus",                     descricao: "1 polimento + 2 higienizações internas.",          preco: 680, validade_dias: 120, ativo: true },
  { id: "pk-3", tenant_id: T, nome: "Delivery Premium",                   descricao: "3 lavagens técnicas com busca e entrega.",         preco: 420, validade_dias: 180, ativo: false },
];

export const DEMO_PACOTE_ITENS: PacoteItem[] = [
  { id: "pi-1", pacote_id: "pk-1", servico_id: "sv-2", quantidade: 4 },
  { id: "pi-2", pacote_id: "pk-2", servico_id: "sv-4", quantidade: 1 },
  { id: "pi-3", pacote_id: "pk-2", servico_id: "sv-3", quantidade: 2 },
  { id: "pi-4", pacote_id: "pk-3", servico_id: "sv-3", quantidade: 3 },
];

export const DEMO_CLIENTE_PACOTES: ClientePacote[] = [
  { id: "cpk-1", tenant_id: T, cliente_id: "cl-1", pacote_id: "pk-1", comprado_em: iso(-20), expira_em: dateOnly(70),  valor_pago: 220, ativo: true, observacoes: null },
  { id: "cpk-2", tenant_id: T, cliente_id: "cl-2", pacote_id: "pk-2", comprado_em: iso(-40), expira_em: dateOnly(80),  valor_pago: 680, ativo: true, observacoes: null },
];

export const DEMO_PACOTE_SALDOS: ClientePacoteSaldo[] = [
  { id: "ps-1", cliente_pacote_id: "cpk-1", servico_id: "sv-2", saldo: 2 },
  { id: "ps-2", cliente_pacote_id: "cpk-2", servico_id: "sv-4", saldo: 1 },
  { id: "ps-3", cliente_pacote_id: "cpk-2", servico_id: "sv-3", saldo: 1 },
];

export const DEMO_REGRA_PONTOS: PontosRegra = {
  tenant_id: T,
  pontos_por_real: 1,
  reais_por_ponto: 0.05,
  min_resgate_pontos: 200,
  ativo: true,
};

export const DEMO_PONTOS_MOVIMENTOS: PontoMovimento[] = [
  { id: "pm-1", tenant_id: T, cliente_id: "cl-1", tipo: "acumulo", pontos: 180, ordem_id: "os-5", motivo: "Acúmulo OS #1023", criado_em: iso(-1) },
  { id: "pm-2", tenant_id: T, cliente_id: "cl-2", tipo: "acumulo", pontos: 220, ordem_id: null,   motivo: "Importação histórica", criado_em: iso(-5) },
  { id: "pm-3", tenant_id: T, cliente_id: "cl-2", tipo: "resgate", pontos: -200, ordem_id: null,  motivo: "Desconto R$ 10,00",    criado_em: iso(-3) },
  { id: "pm-4", tenant_id: T, cliente_id: "cl-3", tipo: "acumulo", pontos: 85,  ordem_id: null,   motivo: "Acúmulo manual",       criado_em: iso(-10) },
];

export const DEMO_NOTIFICACOES: Notificacao[] = [
  { id: "nt-1", tenant_id: T, cliente_id: "cl-1", ordem_id: "os-5", template_codigo: "veiculo_pronto",         canal: "whatsapp", destinatario: "(11) 98888-1111", assunto: null, corpo: "Olá Ana, seu Civic está pronto para retirada.",     status: "enviada", erro: null, agendada_para: null, enviada_em: iso(-1, 11), created_at: iso(-1, 10) },
  { id: "nt-2", tenant_id: T, cliente_id: "cl-2", ordem_id: null,   template_codigo: "lembrete_agendamento",    canal: "whatsapp", destinatario: "(11) 98888-2222", assunto: null, corpo: "Bruno, confirmamos seu horário amanhã às 11h.",      status: "pendente",erro: null, agendada_para: iso(0, 9),   enviada_em: null,         created_at: iso(-1, 8)  },
  { id: "nt-3", tenant_id: T, cliente_id: "cl-3", ordem_id: null,   template_codigo: "reativacao",              canal: "email",    destinatario: "carla@ex.com",     assunto: "Sentimos sua falta", corpo: "Carla, que tal passar pela nossa unidade?",   status: "pendente",erro: null, agendada_para: null,        enviada_em: null,         created_at: iso(-2, 15) },
  { id: "nt-4", tenant_id: T, cliente_id: null,   ordem_id: null,   template_codigo: null,                      canal: "console",  destinatario: "recepcao",         assunto: "Novo agendamento online", corpo: "Diego agendou para hoje às 14:00.",      status: "enviada", erro: null, agendada_para: null, enviada_em: iso(-1, 14), created_at: iso(-1, 14) },
];

export const DEMO_AVALIACOES: Avaliacao[] = [
  { id: "av-1", tenant_id: T, ordem_id: "os-5", cliente_id: "cl-1", nota: 10, comentario: "Serviço impecável, carro brilhando.", publicada: true,  created_at: iso(-1) },
];
