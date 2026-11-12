/**
 * Geração de CSV simples, pronto para `Content-Type: text/csv; charset=utf-8`.
 * - Escape de campos com vírgula/aspas/quebra de linha.
 * - BOM inicial para o Excel detectar UTF-8 automaticamente.
 */

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "﻿";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "string" ? v : JSON.stringify(v);
    if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc((r as Record<string, unknown>)[h])).join(",")),
  ];
  return "﻿" + lines.join("\n");
}
