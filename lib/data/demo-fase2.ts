import type {
  CategoriaFinanceira,
  Comissao,
  ContaPagar,
  ContaReceber,
  FormaPagamento,
  Funcionario,
  Pagamento,
  Produto,
} from "@/types/database";

const T = "demo-tenant";

function iso(dayOffset: number) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString();
}
function dateOnly(dayOffset: number) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}

export const DEMO_FUNCIONARIOS: Funcionario[] = [
  { id: "fn-1", tenant_id: T, unidade_id: null, user_id: null, nome: "Marcelo Souza",  cargo: "Operador",   vinculo: "clt", admissao: dateOnly(-400), comissao_padrao: 20, ativo: true, observacoes: null },
  { id: "fn-2", tenant_id: T, unidade_id: null, user_id: null, nome: "Débora Lima",    cargo: "Detalhadora",vinculo: "clt", admissao: dateOnly(-220), comissao_padrao: 25, ativo: true, observacoes: null },
  { id: "fn-3", tenant_id: T, unidade_id: null, user_id: null, nome: "Felipe Ramos",   cargo: "Operador",   vinculo: "pj",  admissao: dateOnly(-120), comissao_padrao: 22, ativo: true, observacoes: null },
  { id: "fn-4", tenant_id: T, unidade_id: null, user_id: null, nome: "Juliana Prado",  cargo: "Recepção",   vinculo: "clt", admissao: dateOnly(-90),  comissao_padrao: 0,  ativo: true, observacoes: null },
];

export const DEMO_PRODUTOS: Produto[] = [
  { id: "pr-1", tenant_id: T, codigo: "SHP01", nome: "Shampoo Automotivo 5L",   categoria: "Lavagem",  unidade: "L",   fornecedor: "Vonixx",   custo_medio: 9.5,  preco_venda: null, estoque_atual: 18,  estoque_minimo: 5,  local: "Almoxarifado A", ativo: true, created_at: iso(-60), updated_at: iso(-10) },
  { id: "pr-2", tenant_id: T, codigo: "CER01", nome: "Cera Líquida 500mL",       categoria: "Estética", unidade: "un",  fornecedor: "Sonax",    custo_medio: 32.0, preco_venda: null, estoque_atual: 7,   estoque_minimo: 6,  local: "Almoxarifado A", ativo: true, created_at: iso(-60), updated_at: iso(-10) },
  { id: "pr-3", tenant_id: T, codigo: "APC01", nome: "APC Multiuso 5L",          categoria: "Higieniz.",unidade: "L",   fornecedor: "Vonixx",   custo_medio: 7.8,  preco_venda: null, estoque_atual: 2,   estoque_minimo: 4,  local: "Almoxarifado A", ativo: true, created_at: iso(-60), updated_at: iso(-10) },
  { id: "pr-4", tenant_id: T, codigo: "MFB01", nome: "Pano de Microfibra 40x60", categoria: "Acessório",unidade: "un",  fornecedor: "Flanelas", custo_medio: 6.5,  preco_venda: null, estoque_atual: 42,  estoque_minimo: 20, local: "Almoxarifado B", ativo: true, created_at: iso(-60), updated_at: iso(-10) },
  { id: "pr-5", tenant_id: T, codigo: "PRT01", nome: "Pretinho de Pneus 1L",     categoria: "Estética", unidade: "un",  fornecedor: "Sonax",    custo_medio: 18.0, preco_venda: null, estoque_atual: 11,  estoque_minimo: 5,  local: "Almoxarifado A", ativo: true, created_at: iso(-60), updated_at: iso(-10) },
];

export const DEMO_FORMAS: FormaPagamento[] = [
  { id: "fp-1", tenant_id: T, nome: "Dinheiro",       taxa_percentual: 0,   ativo: true },
  { id: "fp-2", tenant_id: T, nome: "Pix",            taxa_percentual: 0,   ativo: true },
  { id: "fp-3", tenant_id: T, nome: "Cartão Débito",  taxa_percentual: 1.8, ativo: true },
  { id: "fp-4", tenant_id: T, nome: "Cartão Crédito", taxa_percentual: 3.5, ativo: true },
];

export const DEMO_CATEGORIAS_FIN: CategoriaFinanceira[] = [
  { id: "cf-1", tenant_id: T, nome: "Receita de Serviços",  tipo: "receita", dre_grupo: "receita_bruta",          ativo: true },
  { id: "cf-2", tenant_id: T, nome: "Descontos Concedidos", tipo: "despesa", dre_grupo: "deducoes",                ativo: true },
  { id: "cf-3", tenant_id: T, nome: "Insumos / Produtos",   tipo: "despesa", dre_grupo: "custo_servicos",          ativo: true },
  { id: "cf-4", tenant_id: T, nome: "Salários",             tipo: "despesa", dre_grupo: "despesa_pessoal",         ativo: true },
  { id: "cf-5", tenant_id: T, nome: "Comissões",            tipo: "despesa", dre_grupo: "despesa_pessoal",         ativo: true },
  { id: "cf-6", tenant_id: T, nome: "Aluguel",              tipo: "despesa", dre_grupo: "despesa_operacional",     ativo: true },
  { id: "cf-7", tenant_id: T, nome: "Energia",              tipo: "despesa", dre_grupo: "despesa_operacional",     ativo: true },
  { id: "cf-8", tenant_id: T, nome: "Marketing",            tipo: "despesa", dre_grupo: "despesa_marketing",       ativo: true },
  { id: "cf-9", tenant_id: T, nome: "Taxas de cartão",      tipo: "despesa", dre_grupo: "despesa_financeira",      ativo: true },
];

export const DEMO_CONTAS_PAGAR: ContaPagar[] = [
  { id: "cp-1", tenant_id: T, categoria_id: "cf-6", descricao: "Aluguel do galpão",       valor: 4800, vencimento: dateOnly(2),  pago_em: null,           forma_id: null, recorrente: true,  observacoes: null, created_at: iso(-30) },
  { id: "cp-2", tenant_id: T, categoria_id: "cf-7", descricao: "Energia elétrica (nov.)", valor: 1230, vencimento: dateOnly(5),  pago_em: null,           forma_id: null, recorrente: true,  observacoes: null, created_at: iso(-10) },
  { id: "cp-3", tenant_id: T, categoria_id: "cf-3", descricao: "Compra Vonixx",           valor: 820,  vencimento: dateOnly(-2), pago_em: dateOnly(-1),   forma_id: "fp-2", recorrente: false, observacoes: null, created_at: iso(-10) },
  { id: "cp-4", tenant_id: T, categoria_id: "cf-4", descricao: "Salários nov.",           valor: 9200, vencimento: dateOnly(7),  pago_em: null,           forma_id: null, recorrente: true,  observacoes: null, created_at: iso(-5) },
  { id: "cp-5", tenant_id: T, categoria_id: "cf-8", descricao: "Anúncios Instagram",      valor: 350,  vencimento: dateOnly(-4), pago_em: null,           forma_id: null, recorrente: false, observacoes: null, created_at: iso(-10) },
];

export const DEMO_CONTAS_RECEBER: ContaReceber[] = [
  { id: "cr-1", tenant_id: T, ordem_id: "os-5", cliente_id: "cl-1", descricao: "OS #1023", valor: 180, vencimento: dateOnly(-1), recebido_em: dateOnly(-1), forma_id: "fp-2", observacoes: null },
];

export const DEMO_PAGAMENTOS: Pagamento[] = [
  { id: "pg-1", tenant_id: T, ordem_id: "os-5", forma_id: "fp-2", valor: 180, recebido_em: iso(-1), observacoes: null },
];

export const DEMO_COMISSOES: Comissao[] = [
  { id: "cm-1", tenant_id: T, ordem_id: "os-5", item_id: null, funcionario_id: "fn-1", base: 180, percentual: 20, valor: 36,  status: "aberta", pago_em: null, created_at: iso(-1) },
  { id: "cm-2", tenant_id: T, ordem_id: "os-5", item_id: null, funcionario_id: "fn-2", base: 180, percentual: 25, valor: 45,  status: "aberta", pago_em: null, created_at: iso(-1) },
  { id: "cm-3", tenant_id: T, ordem_id: "os-1", item_id: null, funcionario_id: "fn-3", base: 65,  percentual: 22, valor: 14.3,status: "aberta", pago_em: null, created_at: iso(-1) },
];
