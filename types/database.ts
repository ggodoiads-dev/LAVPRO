// Tipos espelhando o schema do Supabase (manualmente mantidos).
// Em produção, gerar via `supabase gen types typescript`.

export type Perfil =
  | "superadmin"
  | "proprietario"
  | "gerente"
  | "recepcao"
  | "operacional"
  | "financeiro";

export type Plano = "trial" | "starter" | "pro" | "enterprise";

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
  plano: Plano;
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
