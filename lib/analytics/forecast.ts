import type { OrdemServico } from "@/types/database";

/**
 * Previsão de demanda por slot (dia da semana × hora).
 *
 * Algoritmo: histograma simples sobre a janela recente (default 90 dias).
 * Para cada slot, retornamos:
 *   - média de OS por ocorrência do slot na janela
 *   - share relativo ao pico (para desenhar um heatmap)
 *   - receita entregue acumulada
 *
 * Não extrapolamos: é uma média histórica, não uma predição ML.
 * Útil para decisões de escala e horários promocionais.
 */
export interface SlotDemanda {
  dia: number; // 0=domingo .. 6=sabado
  hora: number; // 0..23
  qtd: number;
  receita: number;
  media: number;
  share: number;
}

export function forecastDemanda(
  ordens: OrdemServico[],
  windowDays = 90,
): SlotDemanda[] {
  const agora = new Date();
  const limite = new Date(agora);
  limite.setDate(limite.getDate() - windowDays);

  const buckets = new Map<string, { qtd: number; receita: number }>();
  for (const o of ordens) {
    const aberta = new Date(o.aberta_em);
    if (aberta < limite) continue;
    if (o.status === "cancelado") continue;
    const dia = aberta.getDay();
    const hora = aberta.getHours();
    const key = `${dia}:${hora}`;
    const cur = buckets.get(key) ?? { qtd: 0, receita: 0 };
    cur.qtd += 1;
    cur.receita += o.status === "entregue" ? Number(o.total) : 0;
    buckets.set(key, cur);
  }

  // Quantas vezes cada (dia,hora) ocorreu na janela? Aproximamos por
  // (dias no período / 7) arredondado — bom o suficiente para share.
  const ocorrenciasPorSlot = Math.max(1, Math.round(windowDays / 7));

  const resultado: SlotDemanda[] = [];
  let pico = 0;
  for (let dia = 0; dia < 7; dia++) {
    for (let hora = 0; hora < 24; hora++) {
      const b = buckets.get(`${dia}:${hora}`) ?? { qtd: 0, receita: 0 };
      pico = Math.max(pico, b.qtd);
      resultado.push({
        dia,
        hora,
        qtd: b.qtd,
        receita: b.receita,
        media: b.qtd / ocorrenciasPorSlot,
        share: 0,
      });
    }
  }
  for (const s of resultado) s.share = pico === 0 ? 0 : s.qtd / pico;
  return resultado;
}

/**
 * Horas em que a demanda está acima da média da hora em qualquer dia —
 * útil para "horários mais movimentados da semana".
 */
export function picosDemanda(slots: SlotDemanda[], topN = 5): SlotDemanda[] {
  return [...slots]
    .filter((s) => s.qtd > 0)
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, topN);
}
