import { next } from '@vercel/edge';

// Inline to avoid importing tsx files in Edge Runtime
const projectId = 'dejczezthzpeuxfxgvpx';
const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlamN6ZXp0aHpwZXV4ZnhndnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTM2OTIsImV4cCI6MjA4MTU2OTY5Mn0.3zHzLYRWD6ETPKzgQW9-OMnHde8Y9PxEBfSz5sBu--I';

const BOT_PATTERN = /bot|crawler|spider|facebookexternalhit|facebot|twitterbot|whatsapp|telegram|slack|discord|googlebot|bingbot|yandex|duckduckbot|slurp|ia_archiver/i;

export const config = {
  matcher: ['/e/:path*', '/api/:path*'],
};

// In-memory rate limiter (per edge instance). Good enough as a first line of
// defense; for global enforcement use an external store (Upstash/Redis).
const RATE_LIMITS: Record<string, { windowMs: number; max: number }> = {
  '/api/': { windowMs: 60_000, max: 30 },
  default: { windowMs: 60_000, max: 120 },
};

const buckets = new Map<string, { count: number; reset: number }>();

function rateLimit(key: string, cfg: { windowMs: number; max: number }): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now > b.reset) {
    b = { count: 0, reset: now + cfg.windowMs };
    buckets.set(key, b);
  }
  b.count++;
  if (b.count > cfg.max) {
    return { ok: false, retryAfter: Math.ceil((b.reset - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  // Rate limit (429) for API and general traffic.
  const cfg = url.pathname.startsWith('/api/') ? RATE_LIMITS['/api/'] : RATE_LIMITS.default;
  const rl = rateLimit(`${ip}:${url.pathname.startsWith('/api/') ? 'api' : 'web'}`, cfg);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(rl.retryAfter),
      },
    });
  }

  const ua = request.headers.get('user-agent') || '';
  if (!BOT_PATTERN.test(ua) || !url.pathname.startsWith('/e/')) {
    // Only run OG rewriting for bot requests on /e/:id
    if (!url.pathname.startsWith('/e/')) return next();
    if (!BOT_PATTERN.test(ua)) return next();
  }

  const eventId = new URL(request.url).pathname.match(/^\/e\/(\d+)/)?.[1];
  if (!eventId) return next();

  const supabaseUrl = `https://${projectId}.supabase.co`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/events?id=eq.${eventId}&select=title,description,image`, {
      headers: {
        apikey: publicAnonKey,
        Authorization: `Bearer ${publicAnonKey}`,
      },
      signal: controller.signal,
    });
    if (!res.ok) return next();

    const events = await res.json();
    const event = events?.[0];
    if (!event) return next();

    const title = event.title || 'Evento - Mapeo Verde';
    const description = event.description || 'Evento ambiental en Aguascalientes';
    const imagePath = event.image || '';
    const imageUrl = imagePath.startsWith('http')
      ? imagePath
      : `${supabaseUrl}/storage/v1/object/public/event_banners/${imagePath}`;
    const fullUrl = `${new URL(request.url).origin}/e/${eventId}`;

    const html = `<!DOCTYPE html>
<html lang="es-MX">
<head>
  <meta charset="utf-8">
  <title>${esc(title)} | Mapeo Verde</title>
  <meta name="description" content="${esc(description)}">
  <meta property="og:title" content="${esc(title)} | Mapeo Verde">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${esc(imageUrl)}">
  <meta property="og:url" content="${esc(fullUrl)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Mapeo Verde">
  <meta property="og:locale" content="es_MX">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)} | Mapeo Verde">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(imageUrl)}">
  <link rel="canonical" href="${esc(fullUrl)}">
  <meta http-equiv="refresh" content="0;url=${esc(fullUrl)}">
  <script>location.href="${esc(fullUrl)}"</script>
</head>
<body></body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  } catch {
    clearTimeout(timeoutId);
    return next();
  } finally {
    clearTimeout(timeoutId);
  }
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
