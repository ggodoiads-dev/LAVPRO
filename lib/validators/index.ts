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
