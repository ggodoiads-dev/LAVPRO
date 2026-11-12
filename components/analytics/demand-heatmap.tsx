import { cn } from "@/lib/utils";
import type { SlotDemanda } from "@/lib/analytics/forecast";

interface Props {
  slots: SlotDemanda[];
  className?: string;
}

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/**
 * Heatmap de demanda. Cada célula recebe uma intensidade (0..4) com
 * base no `share` relativo ao pico semanal.
 */
export function DemandHeatmap({ slots, className }: Props) {
  // Reduzimos para intervalos de 2h para caber confortavelmente em tela.
  const buckets = new Map<string, number>();
  for (const s of slots) {
    const hora = Math.floor(s.hora / 2) * 2;
    const key = `${s.dia}:${hora}`;
    buckets.set(key, (buckets.get(key) ?? 0) + s.qtd);
  }
  const max = Math.max(1, ...buckets.values());
  const horas: number[] = [];
  for (let h = 6; h <= 22; h += 2) horas.push(h); // 6h..22h

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="pr-2 text-left font-medium text-muted-foreground">
              Hora
            </th>
            {DIAS.map((d) => (
              <th key={d} className="px-1 font-medium text-muted-foreground">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {horas.map((h) => (
            <tr key={h}>
              <td className="pr-2 py-0.5 text-right font-mono text-[10px] text-muted-foreground">
                {h.toString().padStart(2, "0")}h
              </td>
              {DIAS.map((_, dia) => {
                const qtd = buckets.get(`${dia}:${h}`) ?? 0;
                const share = qtd / max;
                const nivel =
                  share === 0
                    ? 0
                    : share < 0.2
                      ? 1
                      : share < 0.5
                        ? 2
                        : share < 0.8
                          ? 3
                          : 4;
                const bg = [
                  "bg-muted/60",
                  "bg-secondary/20",
                  "bg-secondary/40",
                  "bg-secondary/70",
                  "bg-secondary",
                ][nivel];
                const txt = nivel >= 3 ? "text-white" : "text-foreground";
                return (
                  <td key={dia} className="p-0.5">
                    <div
                      title={`${DIAS[dia]} ${h}h · ${qtd} OS`}
                      className={cn(
                        "flex h-7 items-center justify-center rounded",
                        bg,
                        txt,
                      )}
                    >
                      <span className="text-[10px] font-semibold">
                        {qtd > 0 ? qtd : ""}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>Menos</span>
        {[0, 1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={cn(
              "h-3 w-3 rounded",
              [
                "bg-muted",
                "bg-secondary/20",
                "bg-secondary/40",
                "bg-secondary/70",
                "bg-secondary",
              ][n],
            )}
          />
        ))}
        <span>Mais</span>
      </div>
    </div>
  );
}
