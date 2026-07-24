import { NextRequest, NextResponse } from '@vercel/edge';

// Inline to avoid importing tsx files in Edge Runtime
const projectId = 'dejczezthzpeuxfxgvpx';
const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlamN6ZXp0aHpwZXV4ZnhndnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTM2OTIsImV4cCI6MjA4MTU2OTY5Mn0.3zHzLYRWD6ETPKzgQW9-OMnHde8Y9PxEBfSz5sBu--I';

const BOT_PATTERN = /bot|crawler|spider|facebookexternalhit|facebot|twitterbot|whatsapp|telegram|slack|discord|googlebot|bingbot|yandex|duckduckbot|slurp|ia_archiver/i;

export const config = {
  matcher: ['/e/:path*'],
};

export default async function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') || '';
  if (!BOT_PATTERN.test(ua)) {
    return NextResponse.next();
  }

  const eventId = request.nextUrl.pathname.match(/^\/e\/(\d+)/)?.[1];
  if (!eventId) return NextResponse.next();

  const supabaseUrl = `https://${projectId}.supabase.co`;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/events?id=eq.${eventId}&select=title,description,image`, {
      headers: {
        apikey: publicAnonKey,
        Authorization: `Bearer ${publicAnonKey}`,
      },
    });

    const events = await res.json();
    const event = events?.[0];
    if (!event) return NextResponse.next();

    const title = event.title || 'Evento - Mapeo Verde';
    const description = event.description || 'Evento ambiental en Aguascalientes';
    const imagePath = event.image || '';
    const imageUrl = imagePath.startsWith('http')
      ? imagePath
      : `${supabaseUrl}/storage/v1/object/public/event_banners/${imagePath}`;
    const fullUrl = `${request.nextUrl.origin}/e/${eventId}`;

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

    return new NextResponse(html, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  } catch {
    return NextResponse.next();
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
