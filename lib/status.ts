import type { StatusOS } from "@/types/database";

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "success"
  | "warning"
  | "outline";

export interface StatusMeta {
  label: string;
  badge: BadgeVariant;
  short: string;
  color: string;
  description: string;
  order: number;
}

export const statusConfig: Record<StatusOS, StatusMeta> = {
  agendado:     { label: "Agendado",     short: "Agendado",     badge: "outline",     color: "bg-muted-foreground",    order: 1, description: "Reserva confirmada, veículo ainda não chegou." },
  recebido:     { label: "Recebido",     short: "Recebido",     badge: "secondary",   color: "bg-primary/70",          order: 2, description: "Veículo registrado, aguardando triagem." },
  aguardando:   { label: "Aguardando",   short: "Aguardando",   badge: "secondary",   color: "bg-secondary/80",        order: 3, description: "Pronto para iniciar, aguarda box livre." },
  em_execucao:  { label: "Em execução",  short: "Em execução",  badge: "default",     color: "bg-secondary",           order: 4, description: "Serviço em andamento." },
  inspecao:     { label: "Inspeção",     short: "Inspeção",     badge: "warning",     color: "bg-warning",             order: 5, description: "Inspeção final de qualidade." },
  pronto:       { label: "Pronto",       short: "Pronto",       badge: "success",     color: "bg-success",             order: 6, description: "Veículo pronto, aguarda entrega." },
  entregue:     { label: "Entregue",     short: "Entregue",     badge: "outline",     color: "bg-muted-foreground/60", order: 7, description: "Entregue ao cliente." },
  cancelado:    { label: "Cancelado",    short: "Cancelado",    badge: "destructive", color: "bg-destructive",         order: 98, description: "OS cancelada." },
  suspenso:     { label: "Suspenso",     short: "Suspenso",     badge: "warning",     color: "bg-warning",             order: 99, description: "OS temporariamente suspensa." },
};

// Ordem do Kanban (exclui cancelado/suspenso que vão para filtros).
export const KANBAN_COLUMNS: StatusOS[] = [
  "recebido",
  "aguardando",
  "em_execucao",
  "inspecao",
  "pronto",
];

// Transições permitidas (motor de workflow).
export const ALLOWED_TRANSITIONS: Record<StatusOS, StatusOS[]> = {
  agendado:    ["recebido", "cancelado"],
  recebido:    ["aguardando", "em_execucao", "cancelado"],
  aguardando:  ["em_execucao", "suspenso", "cancelado"],
  em_execucao: ["inspecao", "suspenso", "cancelado"],
  inspecao:    ["pronto", "em_execucao", "cancelado"],
  pronto:      ["entregue", "em_execucao"],
  entregue:    [],
  cancelado:   [],
  suspenso:    ["aguardando", "em_execucao", "cancelado"],
};

export function canTransition(from: StatusOS, to: StatusOS) {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
