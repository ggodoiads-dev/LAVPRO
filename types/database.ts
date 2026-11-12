// Tipos espelhando o schema do Supabase (manualmente mantidos).
// Em produção, gerar via `supabase gen types typescript`.

export type Perfil =
  | "superadmin"
  | "proprietario"
  | "gerente"
  | "recepcao"
  | "operacional"
  | "financeiro";

export type PlanoCodigo = "trial" | "starter" | "pro" | "enterprise";

export type StatusTenant = "ativo" | "suspenso" | "cancelado";

export type CategoriaVeiculo =
  | "moto"
  | "hatch"
  | "sedan"
  | "suv"
  | "picape"
  | "caminhonete"
  | "van"
  | "outro";

export type StatusAgendamento =
  | "pendente"
  | "confirmado"
  | "cancelado"
  | "faltou"
  | "concluido";

export type StatusOS =
  | "agendado"
  | "recebido"
  | "aguardando"
  | "em_execucao"
  | "inspecao"
  | "pronto"
  | "entregue"
  | "cancelado"
  | "suspenso";

export interface Tenant {
  id: string;
  nome: string;
  slug: string;
  documento: string | null;
  telefone: string | null;
  email: string | null;
  plano: PlanoCodigo;
  status: StatusTenant;
  logo_url: string | null;
  trial_termina_em: string | null;
  created_at: string;
  updated_at: string;
}

export interface Unidade {
  id: string;
  tenant_id: string;
  nome: string;
  endereco: string | null;
  telefone: string | null;
  horario_abertura: string | null;
  horario_fechamento: string | null;
  dias_funcionamento: number[] | null;
  ativo: boolean;
}

export interface Membership {
  id: string;
  tenant_id: string;
  user_id: string;
  perfil: Perfil;
  unidade_id: string | null;
  ativo: boolean;
}

export interface Profile {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  avatar_url: string | null;
}

export interface Cliente {
  id: string;
  tenant_id: string;
  nome: string;
  documento: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  endereco: string | null;
  nascimento: string | null;
  observacoes: string | null;
  preferencias: Record<string, unknown>;
  consent_marketing: boolean;
  created_at: string;
  updated_at: string;
}

export interface Veiculo {
  id: string;
  tenant_id: string;
  cliente_id: string;
  placa: string;
  marca: string | null;
  modelo: string | null;
  versao: string | null;
  ano: number | null;
  cor: string | null;
  categoria: CategoriaVeiculo;
  quilometragem: number | null;
  observacoes: string | null;
}

export interface Servico {
  id: string;
  tenant_id: string;
  nome: string;
  categoria: string | null;
  descricao: string | null;
  preco_base: number;
  custo_estimado: number;
  duracao_min: number;
  funcionarios_min: number;
  comissao_percentual: number;
  ativo: boolean;
}

export interface Funcionario {
  id: string;
  tenant_id: string;
  unidade_id: string | null;
  user_id: string | null;
  nome: string;
  cargo: string | null;
  vinculo: "clt" | "pj" | "diarista" | "terceiro" | "outro" | null;
  admissao: string | null;
  comissao_padrao: number;
  ativo: boolean;
  observacoes: string | null;
}

export interface Box {
  id: string;
  tenant_id: string;
  unidade_id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

export interface Agendamento {
  id: string;
  tenant_id: string;
  unidade_id: string;
  cliente_id: string;
  veiculo_id: string;
  box_id: string | null;
  funcionario_id: string | null;
  inicio: string;
  fim: string;
  status: StatusAgendamento;
  observacoes: string | null;
  created_at: string;
}

export interface OrdemServico {
  id: string;
  tenant_id: string;
  unidade_id: string;
  numero: number;
  cliente_id: string;
  veiculo_id: string;
  box_id: string | null;
  agendamento_id: string | null;
  status: StatusOS;
  aberta_em: string;
  inicio_execucao: string | null;
  fim_execucao: string | null;
  prevista_em: string | null;
  entregue_em: string | null;
  motivo_suspensao: string | null;
  subtotal: number;
  desconto: number;
  total: number;
  checklist: Record<string, unknown>;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrdemItem {
  id: string;
  ordem_id: string;
  servico_id: string;
  descricao: string | null;
  quantidade: number;
  preco_unit: number;
  comissao_percentual: number;
  total: number;
}

// -------------------- Fase 2 --------------------

export interface Produto {
  id: string;
  tenant_id: string;
  codigo: string | null;
  nome: string;
  categoria: string | null;
  unidade: string;
  fornecedor: string | null;
  custo_medio: number;
  preco_venda: number | null;
  estoque_atual: number;
  estoque_minimo: number;
  local: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export type TipoMovimento =
  | "entrada"
  | "saida"
  | "inventario"
  | "perda"
  | "transferencia";

export interface MovimentoEstoque {
  id: string;
  tenant_id: string;
  produto_id: string;
  tipo: TipoMovimento;
  motivo: string | null;
  quantidade: number;
  custo_unit: number | null;
  ordem_id: string | null;
  por_user_id: string | null;
  created_at: string;
}

export type DreGrupo =
  | "receita_bruta"
  | "deducoes"
  | "custo_servicos"
  | "despesa_operacional"
  | "despesa_pessoal"
  | "despesa_administrativa"
  | "despesa_marketing"
  | "despesa_financeira"
  | "tributos_lucro"
  | "outras";

export interface CategoriaFinanceira {
  id: string;
  tenant_id: string;
  nome: string;
  tipo: "receita" | "despesa";
  dre_grupo: DreGrupo;
  ativo: boolean;
}

export interface FormaPagamento {
  id: string;
  tenant_id: string;
  nome: string;
  taxa_percentual: number;
  ativo: boolean;
}

export interface ContaPagar {
  id: string;
  tenant_id: string;
  categoria_id: string | null;
  descricao: string;
  valor: number;
  vencimento: string;
  pago_em: string | null;
  forma_id: string | null;
  recorrente: boolean;
  observacoes: string | null;
  created_at: string;
}

export interface ContaReceber {
  id: string;
  tenant_id: string;
  ordem_id: string | null;
  cliente_id: string | null;
  descricao: string;
  valor: number;
  vencimento: string;
  recebido_em: string | null;
  forma_id: string | null;
  observacoes: string | null;
}

export interface Pagamento {
  id: string;
  tenant_id: string;
  ordem_id: string;
  forma_id: string | null;
  valor: number;
  recebido_em: string;
  observacoes: string | null;
}

export interface Comissao {
  id: string;
  tenant_id: string;
  ordem_id: string;
  item_id: string | null;
  funcionario_id: string;
  base: number;
  percentual: number;
  valor: number;
  status: "aberta" | "paga" | "estornada";
  pago_em: string | null;
  created_at: string;
}

// -------------------- Fase 3 --------------------

export interface Pacote {
  id: string;
  tenant_id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  validade_dias: number;
  ativo: boolean;
}

export interface PacoteItem {
  id: string;
  pacote_id: string;
  servico_id: string;
  quantidade: number;
}

export interface ClientePacote {
  id: string;
  tenant_id: string;
  cliente_id: string;
  pacote_id: string;
  comprado_em: string;
  expira_em: string | null;
  valor_pago: number;
  ativo: boolean;
  observacoes: string | null;
}

export interface ClientePacoteSaldo {
  id: string;
  cliente_pacote_id: string;
  servico_id: string;
  saldo: number;
}

export interface PontosRegra {
  tenant_id: string;
  pontos_por_real: number;
  reais_por_ponto: number;
  min_resgate_pontos: number;
  ativo: boolean;
}

export interface PontoMovimento {
  id: string;
  tenant_id: string;
  cliente_id: string;
  tipo: "acumulo" | "resgate" | "ajuste" | "expiracao";
  pontos: number;
  ordem_id: string | null;
  motivo: string | null;
  criado_em: string;
}

export type CanalNotificacao = "whatsapp" | "sms" | "email" | "push" | "console";

export interface Notificacao {
  id: string;
  tenant_id: string;
  cliente_id: string | null;
  ordem_id: string | null;
  template_codigo: string | null;
  canal: CanalNotificacao;
  destinatario: string;
  assunto: string | null;
  corpo: string;
  status: "pendente" | "enviada" | "erro" | "cancelada";
  erro: string | null;
  agendada_para: string | null;
  enviada_em: string | null;
  created_at: string;
}

export interface Avaliacao {
  id: string;
  tenant_id: string;
  ordem_id: string;
  cliente_id: string | null;
  nota: number;
  comentario: string | null;
  publicada: boolean;
  created_at: string;
}

// -------------------- Fase 4 --------------------

export interface Plano {
  id: string;
  codigo: string;
  nome: string;
  preco_mensal: number;
  trial_dias: number;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
}

export interface PlanoLimite {
  plano_id: string;
  max_unidades: number;
  max_usuarios: number;
  max_veiculos_mes: number;
  funcionalidades: Record<string, boolean>;
}

export type StatusAssinatura =
  | "trial"
  | "ativa"
  | "inadimplente"
  | "pausada"
  | "cancelada"
  | "expirada";

export interface Assinatura {
  id: string;
  tenant_id: string;
  plano_id: string;
  status: StatusAssinatura;
  trial_expira_em: string | null;
  periodo_inicio: string;
  periodo_fim: string;
  proxima_cobranca: string | null;
  cancelada_em: string | null;
  motivo_cancelamento: string | null;
  gateway: string | null;
  gateway_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssinaturaEvento {
  id: string;
  assinatura_id: string;
  tenant_id: string;
  tipo:
    | "criada"
    | "iniciou_trial"
    | "trial_expirou"
    | "ativada"
    | "renovada"
    | "pagamento_falhou"
    | "inadimplente"
    | "pausada"
    | "cancelada"
    | "plano_alterado";
  de_plano_id: string | null;
  para_plano_id: string | null;
  detalhes: Record<string, unknown>;
  created_at: string;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  assinatura_id: string;
  numero: string;
  competencia: string;
  vencimento: string;
  valor: number;
  status: "aberta" | "paga" | "atrasada" | "cancelada" | "estornada";
  pago_em: string | null;
  gateway: string | null;
  gateway_invoice_id: string | null;
  gateway_fatura_url: string | null;
  created_at: string;
}

export interface SaasMetricas {
  empresas_ativas: number;
  em_trial: number;
  assinantes_ativos: number;
  inadimplentes: number;
  cancelamentos: number;
  mrr: number;
  arr: number;
}
