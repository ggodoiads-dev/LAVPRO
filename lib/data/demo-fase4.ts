import type {
  Assinatura,
  AssinaturaEvento,
  Invoice,
  Plano,
  PlanoLimite,
  SaasMetricas,
  Tenant,
} from "@/types/database";

function iso(dayOffset: number) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString();
}
function date(dayOffset: number) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}

export const DEMO_PLANOS: Plano[] = [
  { id: "pl-trial",      codigo: "trial",      nome: "Trial",      preco_mensal: 0,   trial_dias: 14, descricao: "Teste gratuito",                   ativo: true, ordem: 0 },
  { id: "pl-starter",    codigo: "starter",    nome: "Starter",    preco_mensal: 149, trial_dias: 14, descricao: "Lava-rápidos independentes",       ativo: true, ordem: 1 },
  { id: "pl-pro",        codigo: "pro",        nome: "Pro",        preco_mensal: 349, trial_dias: 14, descricao: "Operações com equipe fixa",        ativo: true, ordem: 2 },
  { id: "pl-enterprise", codigo: "enterprise", nome: "Enterprise", preco_mensal: 0,   trial_dias: 14, descricao: "Multi-unidade com customizações", ativo: true, ordem: 3 },
];

export const DEMO_LIMITES: PlanoLimite[] = [
  { plano_id: "pl-trial",      max_unidades: 1,   max_usuarios: 3,   max_veiculos_mes: 100, funcionalidades: { kanban: true,  estoque: false, financeiro: false, pacotes: false, portal_publico: false, comissoes: false, bi: false, sso: false } },
  { plano_id: "pl-starter",    max_unidades: 1,   max_usuarios: 3,   max_veiculos_mes: 500, funcionalidades: { kanban: true,  estoque: true,  financeiro: false, pacotes: false, portal_publico: false, comissoes: true,  bi: false, sso: false } },
  { plano_id: "pl-pro",        max_unidades: 2,   max_usuarios: 999, max_veiculos_mes: 3000,funcionalidades: { kanban: true,  estoque: true,  financeiro: true,  pacotes: true,  portal_publico: true,  comissoes: true,  bi: false, sso: false } },
  { plano_id: "pl-enterprise", max_unidades: 999, max_usuarios: 999, max_veiculos_mes: 0,   funcionalidades: { kanban: true,  estoque: true,  financeiro: true,  pacotes: true,  portal_publico: true,  comissoes: true,  bi: true,  sso: true  } },
];

export const DEMO_TENANTS_ADMIN: Tenant[] = [
  { id: "t-1", nome: "Lava-Jato Premium",    slug: "lava-premium",   documento: null, telefone: "(11) 3456-0001", email: "ana@lavapremium.com",    plano: "pro",        status: "ativo",   logo_url: null, trial_termina_em: null,       created_at: iso(-120), updated_at: iso(-1) },
  { id: "t-2", nome: "AutoBrilho Detalhes",  slug: "autobrilho",     documento: null, telefone: "(11) 3456-0002", email: "contato@autobrilho.com", plano: "starter",    status: "ativo",   logo_url: null, trial_termina_em: null,       created_at: iso(-80),  updated_at: iso(-1) },
  { id: "t-3", nome: "Studio Car",           slug: "studiocar",      documento: null, telefone: "(11) 3456-0003", email: "oi@studiocar.com",       plano: "enterprise", status: "ativo",   logo_url: null, trial_termina_em: null,       created_at: iso(-400), updated_at: iso(-1) },
  { id: "t-4", nome: "WashPoint",            slug: "washpoint",      documento: null, telefone: "(11) 3456-0004", email: "equipe@washpoint.com",   plano: "trial",      status: "ativo",   logo_url: null, trial_termina_em: iso(7),      created_at: iso(-7),   updated_at: iso(-1) },
  { id: "t-5", nome: "AquaCar",              slug: "aquacar",        documento: null, telefone: "(11) 3456-0005", email: "admin@aquacar.com",      plano: "pro",        status: "ativo",   logo_url: null, trial_termina_em: null,       created_at: iso(-200), updated_at: iso(-1) },
  { id: "t-6", nome: "EcoLav Rápido",        slug: "ecolav",         documento: null, telefone: "(11) 3456-0006", email: "financeiro@ecolav.com",  plano: "starter",    status: "ativo",   logo_url: null, trial_termina_em: null,       created_at: iso(-60),  updated_at: iso(-1) },
  { id: "t-7", nome: "Detail Masters",       slug: "detailmasters",  documento: null, telefone: "(11) 3456-0007", email: "dm@detailmasters.com",   plano: "pro",        status: "suspenso",logo_url: null, trial_termina_em: null,       created_at: iso(-300), updated_at: iso(-20) },
];

export const DEMO_ASSINATURAS: Assinatura[] = [
  { id: "a-1", tenant_id: "t-1", plano_id: "pl-pro",        status: "ativa",       trial_expira_em: null,    periodo_inicio: date(-20), periodo_fim: date(10),  proxima_cobranca: date(10),  cancelada_em: null,    motivo_cancelamento: null, gateway: "stripe",  gateway_subscription_id: "sub_lavapremium",  created_at: iso(-120), updated_at: iso(-20) },
  { id: "a-2", tenant_id: "t-2", plano_id: "pl-starter",    status: "ativa",       trial_expira_em: null,    periodo_inicio: date(-10), periodo_fim: date(20),  proxima_cobranca: date(20),  cancelada_em: null,    motivo_cancelamento: null, gateway: "stripe",  gateway_subscription_id: "sub_autobrilho",   created_at: iso(-80),  updated_at: iso(-10) },
  { id: "a-3", tenant_id: "t-3", plano_id: "pl-enterprise", status: "ativa",       trial_expira_em: null,    periodo_inicio: date(-25), periodo_fim: date(5),   proxima_cobranca: date(5),   cancelada_em: null,    motivo_cancelamento: null, gateway: "stripe",  gateway_subscription_id: "sub_studiocar",    created_at: iso(-400), updated_at: iso(-25) },
  { id: "a-4", tenant_id: "t-4", plano_id: "pl-trial",      status: "trial",       trial_expira_em: date(7), periodo_inicio: date(-7),  periodo_fim: date(7),   proxima_cobranca: null,      cancelada_em: null,    motivo_cancelamento: null, gateway: null,      gateway_subscription_id: null,               created_at: iso(-7),   updated_at: iso(-7)  },
  { id: "a-5", tenant_id: "t-5", plano_id: "pl-pro",        status: "ativa",       trial_expira_em: null,    periodo_inicio: date(-5),  periodo_fim: date(25),  proxima_cobranca: date(25),  cancelada_em: null,    motivo_cancelamento: null, gateway: "stripe",  gateway_subscription_id: "sub_aquacar",      created_at: iso(-200), updated_at: iso(-5)  },
  { id: "a-6", tenant_id: "t-6", plano_id: "pl-starter",    status: "inadimplente",trial_expira_em: null,    periodo_inicio: date(-45), periodo_fim: date(-15), proxima_cobranca: date(-15), cancelada_em: null,    motivo_cancelamento: null, gateway: "stripe",  gateway_subscription_id: "sub_ecolav",       created_at: iso(-60),  updated_at: iso(-10) },
  { id: "a-7", tenant_id: "t-7", plano_id: "pl-pro",        status: "pausada",     trial_expira_em: null,    periodo_inicio: date(-50), periodo_fim: date(-20), proxima_cobranca: null,      cancelada_em: null,    motivo_cancelamento: null, gateway: "stripe",  gateway_subscription_id: "sub_detailmasters",created_at: iso(-300), updated_at: iso(-20) },
];

export const DEMO_EVENTOS: AssinaturaEvento[] = [
  { id: "e-1", assinatura_id: "a-1", tenant_id: "t-1", tipo: "ativada",            de_plano_id: null, para_plano_id: "pl-pro",        detalhes: { gateway: "stripe" }, created_at: iso(-120) },
  { id: "e-2", assinatura_id: "a-1", tenant_id: "t-1", tipo: "renovada",           de_plano_id: null, para_plano_id: "pl-pro",        detalhes: {},                      created_at: iso(-20)  },
  { id: "e-3", assinatura_id: "a-6", tenant_id: "t-6", tipo: "pagamento_falhou",   de_plano_id: null, para_plano_id: null,            detalhes: { motivo: "cartão expirado" }, created_at: iso(-12) },
  { id: "e-4", assinatura_id: "a-6", tenant_id: "t-6", tipo: "inadimplente",       de_plano_id: null, para_plano_id: null,            detalhes: {},                      created_at: iso(-10)  },
  { id: "e-5", assinatura_id: "a-4", tenant_id: "t-4", tipo: "iniciou_trial",      de_plano_id: null, para_plano_id: "pl-trial",      detalhes: {},                      created_at: iso(-7)   },
  { id: "e-6", assinatura_id: "a-7", tenant_id: "t-7", tipo: "pausada",            de_plano_id: null, para_plano_id: null,            detalhes: { solicitado_por: "cliente" }, created_at: iso(-20) },
];

export const DEMO_INVOICES: Invoice[] = [
  { id: "i-1", tenant_id: "t-1", assinatura_id: "a-1", numero: "INV-00042", competencia: date(-45), vencimento: date(-20), valor: 349, status: "paga",     pago_em: iso(-20), gateway: "stripe", gateway_invoice_id: "in_42", gateway_fatura_url: null, created_at: iso(-45) },
  { id: "i-2", tenant_id: "t-2", assinatura_id: "a-2", numero: "INV-00043", competencia: date(-35), vencimento: date(-10), valor: 149, status: "paga",     pago_em: iso(-10), gateway: "stripe", gateway_invoice_id: "in_43", gateway_fatura_url: null, created_at: iso(-35) },
  { id: "i-3", tenant_id: "t-3", assinatura_id: "a-3", numero: "INV-00044", competencia: date(-55), vencimento: date(-25), valor: 1990,status: "paga",     pago_em: iso(-25), gateway: "stripe", gateway_invoice_id: "in_44", gateway_fatura_url: null, created_at: iso(-55) },
  { id: "i-4", tenant_id: "t-6", assinatura_id: "a-6", numero: "INV-00045", competencia: date(-45), vencimento: date(-15), valor: 149, status: "atrasada", pago_em: null,      gateway: "stripe", gateway_invoice_id: "in_45", gateway_fatura_url: null, created_at: iso(-45) },
  { id: "i-5", tenant_id: "t-1", assinatura_id: "a-1", numero: "INV-00046", competencia: date(-15), vencimento: date(10),  valor: 349, status: "aberta",   pago_em: null,      gateway: "stripe", gateway_invoice_id: "in_46", gateway_fatura_url: null, created_at: iso(-15) },
];

export const DEMO_METRICAS: SaasMetricas = {
  empresas_ativas: 6,
  em_trial: 1,
  assinantes_ativos: 4,
  inadimplentes: 1,
  cancelamentos: 0,
  mrr: 349 + 149 + 0 + 349, // pro + starter + enterprise(tabelado) + pro
  arr: (349 + 149 + 0 + 349) * 12,
};
