import type { DreLinha } from "@/lib/data/queries";

/**
 * Projeção simples de fechamento de mês. Dado o DRE corrente e a data,
 * extrapolamos cada linha pela razão (dias no mês / dias decorridos).
 * Útil como sinal, não como previsão determinística.
 */
export interface DreProjetado {
  linhas: (DreLinha & { projetado: number })[];
  diasDecorridos: number;
  diasNoMes: number;
  fator: number;
}

export function projetarDre(dre: DreLinha[], ref = new Date()): DreProjetado {
  const inicio = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const fim = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  const diasNoMes = fim.getDate();
  const diasDecorridos = Math.max(1, Math.min(diasNoMes, ref.getDate()));
  const fator = diasNoMes / diasDecorridos;
  return {
    linhas: dre.map((l) => ({ ...l, projetado: l.valor * fator })),
    diasDecorridos,
    diasNoMes,
    fator,
  };
}
