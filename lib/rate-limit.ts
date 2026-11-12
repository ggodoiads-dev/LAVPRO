/**
 * Rate-limiter em memória — token bucket por chave arbitrária.
 *
 * Suficiente para single-instance (Vercel serverless warm, Railway 1
 * replica). Para multi-instance (ex.: Railway com várias replicas, ou
 * cold+warm no serverless), trocar por Upstash Redis mantendo o mesmo
 * contrato de `check(key)`.
 */

interface Bucket {
  tokens: number;
  updatedAt: number;
}

interface Limiter {
  capacity: number;        // número máximo de tokens
  refillPerSec: number;    // tokens recompostos por segundo
  windowMs?: number;       // janela máxima para considerar "mesmo pico"
}

const BUCKETS = new Map<string, Bucket>();

function take(limit: Limiter, key: string): boolean {
  const now = Date.now();
  const bucket = BUCKETS.get(key) ?? {
    tokens: limit.capacity,
    updatedAt: now,
  };
  const elapsed = (now - bucket.updatedAt) / 1000;
  bucket.tokens = Math.min(
    limit.capacity,
    bucket.tokens + elapsed * limit.refillPerSec,
  );
  bucket.updatedAt = now;
  if (bucket.tokens < 1) {
    BUCKETS.set(key, bucket);
    return false;
  }
  bucket.tokens -= 1;
  BUCKETS.set(key, bucket);
  return true;
}

/**
 * Políticas por recurso. Cada bucket fica identificado por chave
 * composta: `${policy}:${ip}`.
 */
export const RATE_LIMITS = {
  // 10 pedidos de agendamento online por minuto por IP.
  book: { capacity: 10, refillPerSec: 10 / 60 } satisfies Limiter,
  // 30 consultas por minuto por IP no portal (busca por placa+telefone).
  portal: { capacity: 30, refillPerSec: 30 / 60 } satisfies Limiter,
};

export function rateLimit(
  policy: keyof typeof RATE_LIMITS,
  key: string,
): { ok: boolean; retryAfter?: number } {
  const limit = RATE_LIMITS[policy];
  const allowed = take(limit, `${policy}:${key}`);
  if (allowed) return { ok: true };
  // Tempo aproximado até 1 token de novo.
  const retryAfter = Math.ceil(1 / limit.refillPerSec);
  return { ok: false, retryAfter };
}

/**
 * Deduz o IP de origem respeitando `x-forwarded-for` (Vercel, Railway
 * proxy, Cloudflare). Retorna "0.0.0.0" quando nada bate.
 */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "0.0.0.0";
  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "0.0.0.0"
  );
}
