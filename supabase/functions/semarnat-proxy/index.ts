import { Hono } from "jsr:@hono/hono@^4.0.0"
import { cors } from "jsr:@hono/hono@^4.0.0/cors"
import { logger } from "jsr:@hono/hono@^4.0.0/logger"

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

const app = new Hono()

app.use("*", logger(console.log))
app.use("*", cors({ origin: "*", allowHeaders: ["Content-Type", "Authorization"], allowMethods: ["POST", "OPTIONS"] }))

app.post("/proyecto", async (c) => {
  try {
    const { clave } = await c.req.json()
    if (!clave) return c.json({ error: "Clave del proyecto es requerida" }, 400)

    const res = await fetch(`${SEMARNAT_API_BASE}/proyectos/search-files`, {
      method: "POST",
      headers: { ...COMMON_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ clave }),
    })

    if (!res.ok) {
      const text = await res.text()
      return c.json({ error: "Error al consultar la API de SEMARNAT", details: text }, res.status)
    }

    const data = await res.json()
    return c.json(data)
  } catch (err) {
    console.error("Error en semarnat-proxy/proyecto:", err)
    return c.json({ error: err instanceof Error ? err.message : "Error desconocido" }, 500)
  }
})

app.post("/historial", async (c) => {
  try {
    const { numBitacora } = await c.req.json()
    if (!numBitacora) return c.json({ error: "Número de bitácora es requerido" }, 400)

    const res = await fetch(`${SEMARNAT_API_BASE}/historial/search-historial-bitacora`, {
      method: "POST",
      headers: { ...COMMON_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ numBitacora }),
    })

    if (!res.ok) {
      const text = await res.text()
      return c.json({ error: "Error al consultar el historial de SEMARNAT", details: text }, res.status)
    }

    const data = await res.json()
    return c.json(data)
  } catch (err) {
    console.error("Error en semarnat-proxy/historial:", err)
    return c.json({ error: err instanceof Error ? err.message : "Error desconocido" }, 500)
  }
})

app.post("/pdf", async (c) => {
  try {
    const pdfPath = await c.req.text()
    if (!pdfPath || !pdfPath.trim()) {
      return c.json({ error: "Ruta del PDF es requerida" }, 400)
    }

    const res = await fetch(`${SEMARNAT_API_BASE}/proyectos/archivopdf`, {
      method: "POST",
      headers: { ...COMMON_HEADERS, "Content-Type": "text/plain" },
      body: pdfPath.trim(),
    })

    if (!res.ok) {
      const text = await res.text()
      return c.json({ error: "Error al obtener el PDF de SEMARNAT", details: text }, res.status)
    }

    const contentType = res.headers.get("content-type")

    if (contentType?.includes("application/pdf")) {
      const blob = await res.blob()
      return new Response(blob, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="documento.pdf"',
        },
      })
    } else if (contentType?.includes("application/json")) {
      const data = await res.json()
      return c.json(data)
    } else {
      const text = await res.text()
      return c.json({ respuesta: text, tipo: "texto" })
    }
  } catch (err) {
    console.error("Error en semarnat-proxy/pdf:", err)
    return c.json({ error: err instanceof Error ? err.message : "Error desconocido" }, 500)
  }
})

Deno.serve(app.fetch)
