import { createClient } from "npm:@supabase/supabase-js@2"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: CORS_HEADERS,
    })
  }

  try {
    const { email, fuente } = await req.json()
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Email inválido" }), {
        status: 400,
        headers: CORS_HEADERS,
      })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if already subscribed
    const { data: existing } = await supabase
      .from("newsletter_subscriptions")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ success: true, message: "Ya estás suscrito" }), {
        status: 200,
        headers: CORS_HEADERS,
      })
    }

    const { error: insertError } = await supabase
      .from("newsletter_subscriptions")
      .insert({
        email,
        fuente: fuente || "web",
        subscribed_at: new Date().toISOString(),
      })

    if (insertError) {
      return new Response(JSON.stringify({ error: "Error al guardar la suscripción", details: insertError.message }), {
        status: 500,
        headers: CORS_HEADERS,
      })
    }

    return new Response(JSON.stringify({ success: true, message: "¡Gracias por suscribirte!" }), {
      status: 200,
      headers: CORS_HEADERS,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Error desconocido" }), {
      status: 500,
      headers: CORS_HEADERS,
    })
  }
})
