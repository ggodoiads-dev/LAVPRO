/**
 * Logger estruturado minimal. Em produção (Vercel/Railway), stdout é
 * coletado como JSON — o painel desses provedores destaca os campos.
 *
 * API: log.info("msg", { campo: valor }). Nunca inclua PII sem
 * consentimento explícito (e-mail, telefone, placa de cliente).
 */

type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, msg: string, fields?: Record<string, unknown>) {
  const line = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...fields,
  };
  const serialized = JSON.stringify(line);
  // eslint-disable-next-line no-console
  (level === "error" ? console.error : console.log)(serialized);
}

export const log = {
  debug: (msg: string, fields?: Record<string, unknown>) =>
    process.env.NODE_ENV !== "production" ? emit("debug", msg, fields) : void 0,
  info: (msg: string, fields?: Record<string, unknown>) => emit("info", msg, fields),
  warn: (msg: string, fields?: Record<string, unknown>) => emit("warn", msg, fields),
  error: (msg: string, fields?: Record<string, unknown>) => emit("error", msg, fields),
};
