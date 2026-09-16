import type { VercelRequest, VercelResponse } from '@vercel/node'

const SEMARNAT_API_BASE = 'https://apps1.semarnat.gob.mx/ws-bitacora-tramite'

const BEARER_TOKEN =
  'Bearer eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiJzZW1hcm5hdEpXVCIsInN1YiI6IlVzdWFyaW97c2VnVXN1YXJpb3NJZDoxLHNlZ1VzdWFyaW9zTm9tYnJlVXN1YXJpbzogJ2FuYV9vbHZlcmFfc2FyZ2F6bycsc2VnVXN1YXJpb3NQYXNzd29yZDogJyQyYSQxMCRqb21vU2JCT0VycWhoWmU3cEFER2J1WjA4ZDhhUUpucEk0dkhOZU9ScVZjbFRtNWJYZUFHQyd9IiwiYXV0aG9yaXRpZXMiOlsic2FyZ2F6byJdLCJpYXQiOjE2NTk5NDEyODZ9.qd17vj3iTjaGnB8w8wq4Eb-44o_2Zcy-x1o8vF9WvRmYGYupShpLaYXK8vL7FxxXy5MDIlOIhnTCQL-rpUw_ow'

const COMMON_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.5',
  Authorization: BEARER_TOKEN,
  Origin: 'https://app.semarnat.gob.mx',
  Connection: 'keep-alive',
  Referer: 'https://app.semarnat.gob.mx/',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site',
  DNT: '1',
  'Sec-GPC': '1',
}

const PROXY_MOUNT = '/api/semarnat-proxy'

type SemarnatProxyResult =
  | { kind: 'json'; status: number; data: unknown }
  | { kind: 'pdf'; status: number; data: Buffer }

function resolveSemarnatPath(pathname: string): string {
  return pathname.replace(PROXY_MOUNT, '').replace(/\/+$/, '') || '/'
}

async function handleSemarnatProxy(path: string, body: unknown): Promise<SemarnatProxyResult> {
  if (path === '' || path === '/') {
    return { kind: 'json', status: 400, data: { error: 'Especifica /proyecto, /historial o /pdf' } }
  }

  if (path === '/proyecto') {
    const clave = (body as { clave?: string } | null)?.clave
    if (!clave) return { kind: 'json', status: 400, data: { error: 'Clave del proyecto es requerida' } }

    const apiRes = await fetch(`${SEMARNAT_API_BASE}/proyectos/search-files`, {
      method: 'POST',
      headers: { ...COMMON_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ clave }),
    })

    const data = await apiRes.json()

    // La clave NO es el número de bitácora. Resolvemos clave → numBitacora
    // igual que lo hace la propia app de SEMARNAT (consulta-tramite), para
    // que el historial se pueda consultar por clave.
    let numBitacora: string | null = null
    let tramite: unknown = null
    try {
      const proyRes = await fetch(`${SEMARNAT_API_BASE}/proyectos/search-proyecto`, {
        method: 'POST',
        headers: { ...COMMON_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave }),
      })
      if (proyRes.ok) {
        const proyData = await proyRes.json()
        if (proyData.mensaje === 'success' && proyData.tramite) {
          tramite = proyData.tramite
          numBitacora = proyData.tramite.numBitacora ?? null
        }
      }
    } catch {
      // Si falla la resolución, devolvemos solo los archivos.
    }

    return {
      kind: 'json',
      status: apiRes.ok ? 200 : apiRes.status,
      data: { ...data, _bitacora: numBitacora, _tramite: tramite },
    }
  }

  if (path === '/historial') {
    const numBitacora = (body as { numBitacora?: string } | null)?.numBitacora
    if (!numBitacora) return { kind: 'json', status: 400, data: { error: 'Número de bitácora es requerido' } }

    const apiRes = await fetch(`${SEMARNAT_API_BASE}/historial/search-historial-bitacora`, {
      method: 'POST',
      headers: { ...COMMON_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ numBitacora }),
    })

    const data = await apiRes.json()
    return { kind: 'json', status: apiRes.ok ? 200 : apiRes.status, data }
  }

  if (path === '/pdf') {
    const pdfPath = typeof body === 'string' ? body : (body as { path?: string } | null)?.path
    if (!pdfPath || !(typeof pdfPath === 'string' && pdfPath.trim())) {
      return { kind: 'json', status: 400, data: { error: 'Ruta del PDF es requerida' } }
    }

    const apiRes = await fetch(`${SEMARNAT_API_BASE}/proyectos/archivopdf`, {
      method: 'POST',
      headers: { ...COMMON_HEADERS, 'Content-Type': 'text/plain' },
      body: pdfPath.trim(),
    })

    const contentType = apiRes.headers.get('content-type')

    if (contentType?.includes('application/pdf')) {
      return { kind: 'pdf', status: 200, data: Buffer.from(await apiRes.arrayBuffer()) }
    }

    const data = contentType?.includes('application/json')
      ? await apiRes.json()
      : { respuesta: await apiRes.text(), tipo: 'texto' }
    return { kind: 'json', status: apiRes.ok ? 200 : apiRes.status, data }
  }

  return { kind: 'json', status: 404, data: { error: 'Ruta no encontrada', path } }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`)
  const path = resolveSemarnatPath(url.pathname)

  try {
    const result = await handleSemarnatProxy(path, req.body)

    if (result.kind === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'attachment; filename="documento.pdf"')
      return res.status(result.status).send(result.data)
    }

    return res.status(result.status).json(result.data)
  } catch (err) {
    return res.status(502).json({ error: err instanceof Error ? err.message : 'Error desconocido' })
  }
}