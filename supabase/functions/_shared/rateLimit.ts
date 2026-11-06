// Shared in-memory rate limiter for Supabase Edge Functions.
// Per-isolate only; for global enforcement use an external store (Redis/Upstash).

const buckets = new Map<string, { count: number; reset: number }>();

export interface RateLimitResult {
  ok: boolean;
  retryAfter: number;
}

export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now > b.reset) {
    b = { count: 0, reset: now + windowMs };
    buckets.set(key, b);
  }
  b.count++;
  if (b.count > max) {
    return { ok: false, retryAfter: Math.ceil((b.reset - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

export function clientKey(req: Request, scope: string): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";
  return `${scope}:${ip}`;
}
