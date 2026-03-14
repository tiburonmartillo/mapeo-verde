// Supabase Edge Function: envía un correo de confirmación al usuario que envió una propuesta.
// Requiere RESEND_API_KEY en los secrets del proyecto.
// Opcional: RESEND_FROM (ej: "Mapeo Verde <participacion@tudominio.com>") o usa onboarding@resend.dev para pruebas.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM = Deno.env.get('RESEND_FROM') ?? 'Mapeo Verde <onboarding@resend.dev>';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

function getEmailContent(type: string, title?: string): { subject: string; html: string; text: string } {
  const isEvent = type === 'EVENT';
  const itemName = title && title.trim() ? title.trim() : isEvent ? 'tu evento' : 'tu área verde';

  const subject = 'Recibimos tu propuesta – Mapeo Verde';
  const text = [
    'Hola,',
    '',
    `Te confirmamos que hemos recibido correctamente tu propuesta (${itemName}).`,
    '',
    'Está en revisión por nuestro equipo. Si es aprobada, se publicará en la agenda o en el inventario de áreas verdes, según corresponda.',
    '',
    'Gracias por participar.',
    '— Equipo Mapeo Verde',
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p>Hola,</p>
  <p>Te confirmamos que hemos recibido correctamente <strong>tu propuesta</strong>${itemName ? ` (${escapeHtml(itemName)})` : ''}.</p>
  <p>Está en revisión por nuestro equipo. Si es aprobada, se publicará en la agenda o en el inventario de áreas verdes, según corresponda.</p>
  <p>Gracias por participar.</p>
  <p>— Equipo Mapeo Verde</p>
</body>
</html>`.trim();

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: CORS_HEADERS,
    });
  }

  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
      { status: 500, headers: CORS_HEADERS }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const to = typeof body.to === 'string' ? body.to.trim() : '';
    const type = typeof body.type === 'string' ? body.type.toUpperCase() : 'EVENT';
    const title = typeof body.title === 'string' ? body.title.trim() : undefined;

    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return new Response(JSON.stringify({ error: 'Valid "to" email required' }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const { subject, html, text } = getEmailContent(type, title);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return new Response(JSON.stringify({ error: data.message || data.error || 'Resend error' }), {
        status: res.status,
        headers: CORS_HEADERS,
      });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
});
