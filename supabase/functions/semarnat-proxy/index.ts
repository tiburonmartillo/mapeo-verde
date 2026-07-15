const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
}

const SEMARNAT_API_BASE = "https://apps1.semarnat.gob.mx/ws-bitacora-tramite"

const BEARER_TOKEN =
  "Bearer eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiJzZW1hcm5hdEpXVCIsInN1YiI6IlVzdWFyaW97c2VnVXN1YXJpb3NJZDoxLHNlZ1VzdWFyaW9zTm9tYnJlVXN1YXJpbzogJ2FuYV9vbHZlcmFfc2FyZ2F6bycsc2VnVXN1YXJpb3NQYXNzd29yZDogJyQyYSQxMCRqb21vU2JCT0VycWhoWmU3cEFER2J1WjA4ZDhhUUpucEk0dkhOZU9ScVZjbFRtNWJYZUFHQyd9IiwiYXV0aG9yaXRpZXMiOlsic2FyZ2F6byJdLCJpYXQiOjE2NTk5NDEyODZ9.qd17vj3iTjaGnB8w8wq4Eb-44o_2Zcy-x1o8vF9WvRmYGYupShpLaYXK8vL7FxxXy5MDIlOIhnTCQL-rpUw_ow"

const COMMON_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.5",
  Authorization: BEARER_TOKEN,
  Origin: "https://app.semarnat.gob.mx",
  Connection: "keep-alive",
  Referer: "https://app.semarnat.gob.mx/",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-site",
  DNT: "1",
  "Sec-GPC": "1",
}

const FETCH_TIMEOUT_MS = 8_000

async function fetchWithTimeout(url: string, init: RequestInit, ms = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ms)
  const existingSignal = init.signal
  const combinedSignal = existingSignal
    ? combineSignals(existingSignal, controller.signal)
    : controller.signal
  try {
    return await fetch(url, { ...init, signal: combinedSignal })
  } finally {
    clearTimeout(timeoutId)
  }
}

function combineSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController()
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason)
      return controller.signal
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true })
  }
  return controller.signal
}

async function fetchSemarnat(url: string, init: RequestInit): Promise<Record<string, unknown>> {
  try {
    const res = await fetchWithTimeout(url, init)
    const body = await res.json()
    body.status = res.ok ? 200 : res.status
    return body as Record<string, unknown>
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const isTlsError = msg.toLowerCase().includes("handshake") || msg.toLowerCase().includes("tls") || msg.toLowerCase().includes("certificate")
    const log = { error: msg, try_raw_tls: isTlsError }
    console.error("fetchSemarnat failed:", JSON.stringify(log))

    if (isTlsError) {
      try {
        const raw = await fetchSemarnatRawTls(url, init)
        if (raw) return raw
      } catch (rawErr) {
        console.error("fetchSemarnatRawTls also failed:", rawErr instanceof Error ? rawErr.message : String(rawErr))
      }
    }
    return { error: msg, status: 502 }
  }
}

async function fetchSemarnatRawTls(urlStr: string, init: RequestInit): Promise<Record<string, unknown> | null> {
  try {
    const parsedUrl = new URL(urlStr)
    const conn = await Deno.connect({ hostname: parsedUrl.hostname, port: 443 })
    const tlsConn = await Deno.startTls(conn, { hostname: parsedUrl.hostname })

    const bodyStr = init.body ? (init.body instanceof ReadableStream ? "" : String(init.body)) : ""
    const path = parsedUrl.pathname + parsedUrl.search
    const headers = (init.headers as Record<string, string>) || {}
    const headerLines = Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join("\r\n")
    const httpReq = `${init.method || "POST"} ${path} HTTP/1.1\r\nHost: ${parsedUrl.hostname}\r\n${headerLines}\r\nContent-Length: ${bodyStr.length}\r\n\r\n${bodyStr}`

    const encoder = new TextEncoder()
    await tlsConn.write(encoder.encode(httpReq))

    const buf = new Uint8Array(65536)
    const n = await tlsConn.read(buf)
    tlsConn.close()
    conn.close()

    if (n === null) return null

    const response = new TextDecoder().decode(buf.subarray(0, n))
    const bodyMatch = response.match(/\r\n\r\n(.*)/s)
    if (!bodyMatch) return { error: "respuesta_sin_cuerpo", status: 502 }

    try {
      return { ...JSON.parse(bodyMatch[1]), status: response.includes("200 OK") ? 200 : 502 }
    } catch {
      return { respuesta: bodyMatch[1], tipo: "texto", status: 200 }
    }
  } catch (e) {
    console.error("fetchSemarnatRawTls exception:", e instanceof Error ? e.message : String(e))
    return null
  }
}

async function fetchSemarnatPdf(pdfPath: string): Promise<Response | Record<string, unknown>> {
  try {
    const res = await fetchWithTimeout(`${SEMARNAT_API_BASE}/proyectos/archivopdf`, {
      method: "POST",
      headers: { ...COMMON_HEADERS, "Content-Type": "text/plain" },
      body: pdfPath,
    })

    const contentType = res.headers.get("content-type")

    if (contentType?.includes("application/pdf")) {
      return res
    }

    const body = contentType?.includes("application/json") ? await res.json() : { respuesta: await res.text(), tipo: "texto" }
    return { ...body, status: res.ok ? 200 : res.status }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("fetchSemarnatPdf failed:", msg)
    return { error: msg, status: 502 }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  const url = new URL(req.url)
  const path = url.pathname.replace(/^\/functions\/v1\/semarnat-proxy/, "").replace(/^\/semarnat-proxy/, "")

  if (path === "/health" || path === "/health/") {
    return new Response(JSON.stringify({ status: "ok", env: { DENO_TLS_CA_STORE: Deno.env.get("DENO_TLS_CA_STORE") || "not_set" } }), { headers: CORS_HEADERS })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: CORS_HEADERS,
    })
  }

  try {
    if (path === "/proyecto" || path === "/proyecto/") {
      const { clave } = await req.json()
      if (!clave) return new Response(JSON.stringify({ error: "Clave del proyecto es requerida" }), { status: 400, headers: CORS_HEADERS })

      const data = await fetchSemarnat(`${SEMARNAT_API_BASE}/proyectos/search-files`, {
        method: "POST",
        headers: { ...COMMON_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ clave }),
      })

      return new Response(JSON.stringify(data), { status: data.status || 200, headers: CORS_HEADERS })
    }

    if (path === "/historial" || path === "/historial/") {
      const { numBitacora } = await req.json()
      if (!numBitacora) return new Response(JSON.stringify({ error: "Número de bitácora es requerido" }), { status: 400, headers: CORS_HEADERS })

      const data = await fetchSemarnat(`${SEMARNAT_API_BASE}/historial/search-historial-bitacora`, {
        method: "POST",
        headers: { ...COMMON_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ numBitacora }),
      })

      return new Response(JSON.stringify(data), { status: data.status || 200, headers: CORS_HEADERS })
    }

    if (path === "/pdf" || path === "/pdf/") {
      const pdfPath = await req.text()
      if (!pdfPath || !pdfPath.trim()) {
        return new Response(JSON.stringify({ error: "Ruta del PDF es requerida" }), { status: 400, headers: CORS_HEADERS })
      }

      const result = await fetchSemarnatPdf(pdfPath.trim())

      if (result instanceof Response) {
        const blob = await result.blob()
        return new Response(blob, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": 'attachment; filename="documento.pdf"',
            "Access-Control-Allow-Origin": "*",
          },
        })
      }

      return new Response(JSON.stringify(result), { status: result.status || 200, headers: CORS_HEADERS })
    }

    return new Response(JSON.stringify({ error: "Ruta no encontrada", path }), {
      status: 404,
      headers: CORS_HEADERS,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Error desconocido" }), {
      status: 500,
      headers: CORS_HEADERS,
    })
  }
})
