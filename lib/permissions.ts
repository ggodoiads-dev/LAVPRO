import type { Perfil } from "@/types/database";

// Permissões por recurso (apenas Fase 1). Expandir à medida que novos
// módulos forem adicionados — a verificação definitiva acontece no banco
// via RLS; esta tabela controla a navegação e os botões na interface.
export const PERMISSIONS: Record<string, Perfil[]> = {
  "dashboard:view":   ["superadmin", "proprietario", "gerente", "recepcao", "operacional", "financeiro"],
  "clientes:view":    ["superadmin", "proprietario", "gerente", "recepcao", "financeiro"],
  "clientes:write":   ["superadmin", "proprietario", "gerente", "recepcao"],
  "veiculos:view":    ["superadmin", "proprietario", "gerente", "recepcao", "operacional"],
  "veiculos:write":   ["superadmin", "proprietario", "gerente", "recepcao"],
  "servicos:view":    ["superadmin", "proprietario", "gerente", "recepcao", "operacional", "financeiro"],
  "servicos:write":   ["superadmin", "proprietario", "gerente"],
  "agenda:view":      ["superadmin", "proprietario", "gerente", "recepcao", "operacional"],
  "agenda:write":     ["superadmin", "proprietario", "gerente", "recepcao"],
  "ordens:view":      ["superadmin", "proprietario", "gerente", "recepcao", "operacional", "financeiro"],
  "ordens:write":     ["superadmin", "proprietario", "gerente", "recepcao"],
  "ordens:execute":   ["superadmin", "proprietario", "gerente", "operacional"],
  "kanban:view":      ["superadmin", "proprietario", "gerente", "recepcao", "operacional"],
  "financeiro:view":  ["superadmin", "proprietario", "gerente", "financeiro"],
  "config:view":      ["superadmin", "proprietario", "gerente"],
};

export function can(perfil: Perfil | null, action: keyof typeof PERMISSIONS) {
  if (!perfil) return false;
  const roles = PERMISSIONS[action];
  return Boolean(roles?.includes(perfil));
}
