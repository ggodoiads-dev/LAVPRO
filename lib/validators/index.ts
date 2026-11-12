import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .or(z.literal("").transform(() => undefined));

// -------------------- Clientes --------------------
export const clienteSchema = z.object({
  nome: z.string().min(2, "Informe o nome do cliente").max(120),
  documento: z
    .string()
    .trim()
    .max(32)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  telefone: optionalText,
  whatsapp: optionalText,
  email: z
    .string()
    .trim()
    .email("E-mail inválido")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  endereco: optionalText,
  nascimento: z
    .string()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  observacoes: optionalText,
  consent_marketing: z.boolean().default(false),
});
export type ClienteInput = z.infer<typeof clienteSchema>;

// -------------------- Veículos --------------------
export const veiculoSchema = z.object({
  cliente_id: z.string().uuid("Cliente obrigatório"),
  placa: z
    .string()
    .trim()
    .min(5, "Placa inválida")
    .max(10)
    .transform((v) => v.toUpperCase().replace(/[^A-Z0-9]/g, "")),
  marca: optionalText,
  modelo: optionalText,
  versao: optionalText,
  ano: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === "") return undefined;
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? n : undefined;
    }),
  cor: optionalText,
  categoria: z.enum([
    "moto",
    "hatch",
    "sedan",
    "suv",
    "picape",
    "caminhonete",
    "van",
    "outro",
  ]),
  quilometragem: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === "") return undefined;
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? n : undefined;
    }),
  observacoes: optionalText,
});
export type VeiculoInput = z.infer<typeof veiculoSchema>;

// -------------------- Serviços --------------------
export const servicoSchema = z.object({
  nome: z.string().min(2, "Informe o nome do serviço").max(120),
  categoria: optionalText,
  descricao: optionalText,
  preco_base: z.coerce
    .number()
    .nonnegative("Preço não pode ser negativo")
    .default(0),
  custo_estimado: z.coerce
    .number()
    .nonnegative("Custo não pode ser negativo")
    .default(0),
  duracao_min: z.coerce
    .number()
    .int()
    .positive("Duração deve ser positiva")
    .default(60),
  funcionarios_min: z.coerce.number().int().min(1).default(1),
  comissao_percentual: z.coerce.number().min(0).max(100).default(0),
  ativo: z.boolean().default(true),
});
export type ServicoInput = z.infer<typeof servicoSchema>;

// -------------------- Agendamento --------------------
export const agendamentoSchema = z.object({
  unidade_id: z.string().uuid(),
  cliente_id: z.string().uuid("Selecione o cliente"),
  veiculo_id: z.string().uuid("Selecione o veículo"),
  box_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  funcionario_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  inicio: z.string().min(10, "Informe o início"),
  duracao_min: z.coerce.number().int().positive().default(60),
  servico_ids: z.array(z.string().uuid()).min(1, "Selecione ao menos um serviço"),
  observacoes: optionalText,
});
export type AgendamentoInput = z.infer<typeof agendamentoSchema>;

// -------------------- Login / Registro --------------------
export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registroSchema = z
  .object({
    nome: z.string().min(2, "Informe seu nome"),
    empresa: z.string().min(2, "Informe o nome da empresa"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(8, "Mínimo de 8 caracteres"),
    confirm: z.string().min(8),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Senhas não conferem",
    path: ["confirm"],
  });
export type RegistroInput = z.infer<typeof registroSchema>;

// -------------------- Ordem de Serviço --------------------
export const ordemItemSchema = z.object({
  servico_id: z.string().uuid(),
  quantidade: z.coerce.number().int().positive().default(1),
  preco_unit: z.coerce.number().nonnegative(),
  comissao_percentual: z.coerce.number().min(0).max(100).default(0),
});

// -------------------- Funcionários --------------------
export const funcionarioSchema = z.object({
  nome: z.string().min(2, "Informe o nome").max(120),
  cargo: optionalText,
  vinculo: z.enum(["clt", "pj", "diarista", "terceiro", "outro"]).default("clt"),
  admissao: z
    .string()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  comissao_padrao: z.coerce.number().min(0).max(100).default(0),
  ativo: z.boolean().default(true),
  observacoes: optionalText,
});
export type FuncionarioInput = z.infer<typeof funcionarioSchema>;

// -------------------- Produtos / Estoque --------------------
export const produtoSchema = z.object({
  codigo: optionalText,
  nome: z.string().min(2, "Informe o nome do produto").max(120),
  categoria: optionalText,
  unidade: z.string().default("un"),
  fornecedor: optionalText,
  custo_medio: z.coerce.number().nonnegative().default(0),
  preco_venda: z.coerce.number().nonnegative().optional().default(0),
  estoque_atual: z.coerce.number().nonnegative().default(0),
  estoque_minimo: z.coerce.number().nonnegative().default(0),
  local: optionalText,
  ativo: z.boolean().default(true),
});
export type ProdutoInput = z.infer<typeof produtoSchema>;

export const movimentoSchema = z.object({
  produto_id: z.string().uuid(),
  tipo: z.enum(["entrada", "saida", "inventario", "perda"]),
  quantidade: z.coerce.number().positive("Quantidade deve ser positiva"),
  custo_unit: z.coerce.number().nonnegative().optional(),
  motivo: optionalText,
});
export type MovimentoInput = z.infer<typeof movimentoSchema>;

// -------------------- Financeiro --------------------
export const contaPagarSchema = z.object({
  categoria_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  descricao: z.string().min(2, "Informe a descrição").max(200),
  valor: z.coerce.number().nonnegative(),
  vencimento: z.string().min(10, "Informe a data"),
  forma_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  recorrente: z.boolean().default(false),
  pago_em: z
    .string()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  observacoes: optionalText,
});
export type ContaPagarInput = z.infer<typeof contaPagarSchema>;

export const pagamentoSchema = z.object({
  ordem_id: z.string().uuid(),
  forma_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  valor: z.coerce.number().positive("Valor deve ser positivo"),
  observacoes: optionalText,
});
export type PagamentoInput = z.infer<typeof pagamentoSchema>;

export const novaOrdemSchema = z.object({
  unidade_id: z.string().uuid(),
  cliente_id: z.string().uuid(),
  veiculo_id: z.string().uuid(),
  box_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  prevista_em: z
    .string()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  itens: z.array(ordemItemSchema).min(1, "Adicione ao menos um serviço"),
  desconto: z.coerce.number().nonnegative().default(0),
  observacoes: optionalText,
});
export type NovaOrdemInput = z.infer<typeof novaOrdemSchema>;
