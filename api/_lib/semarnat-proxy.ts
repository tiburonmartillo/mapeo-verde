export const SEMARNAT_API_BASE = 'https://apps1.semarnat.gob.mx/ws-bitacora-tramite'

const FETCH_TIMEOUT_MS = 8_000;

function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const signal = init.signal ? combineSignals(init.signal, controller.signal) : controller.signal;
  return fetch(url, { ...init, signal }).finally(() => clearTimeout(id));
}

function combineSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (a.aborted || b.aborted) {
    controller.abort();
    return controller.signal;
  }
  a.addEventListener('abort', abort, { once: true });
  b.addEventListener('abort', abort, { once: true });
  return controller.signal;
}

export function getBearerToken(): string {
  const token = process.env.SEMARNAT_BEARER_TOKEN;
  if (!token) throw new Error('SEMARNAT_BEARER_TOKEN not configured');
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
}

export function commonHeaders(): Record<string, string> {
  return {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0',
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.5',
    Authorization: getBearerToken(),
    Origin: 'https://app.semarnat.gob.mx',
    Connection: 'keep-alive',
    Referer: 'https://app.semarnat.gob.mx/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    DNT: '1',
    'Sec-GPC': '1',
  };
}

// Backwards-compatible alias (deprecated: use commonHeaders()).
export const COMMON_HEADERS = new Proxy({} as Record<string, string>, {
  get(_target, prop: string) {
    return commonHeaders()[prop];
  },
  ownKeys() {
    return Object.keys(commonHeaders());
  },
  getOwnPropertyDescriptor(_target, prop: string) {
    return { value: commonHeaders()[prop], writable: true, enumerable: true, configurable: true };
  },
})

export const PROXY_MOUNT = '/api/semarnat-proxy'

export type SemarnatProxyResult =
  | { kind: 'json'; status: number; data: unknown }
  | { kind: 'pdf'; status: number; data: Buffer }

export function resolveSemarnatPath(pathname: string): string {
  return pathname.replace(PROXY_MOUNT, '').replace(/\/+$/, '') || '/'
}

export async function handleSemarnatProxy(path: string, body: unknown): Promise<SemarnatProxyResult> {
  if (path === '' || path === '/') {
    return { kind: 'json', status: 400, data: { error: 'Especifica /proyecto, /historial o /pdf' } }
  }

  if (path === '/proyecto') {
    const clave = (body as { clave?: string } | null)?.clave
    if (!clave) return { kind: 'json', status: 400, data: { error: 'Clave del proyecto es requerida' } }

    const apiRes = await fetchWithTimeout(`${SEMARNAT_API_BASE}/proyectos/search-files`, {
      method: 'POST',
      headers: { ...commonHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ clave }),
    })

    if (apiRes.status === 401 || apiRes.status === 403) {
      return { kind: 'json', status: 502, data: { error: 'Token SEMARNAT inválido o expirado' } }
    }

    const data = await apiRes.json()

    // La clave NO es el número de bitácora. Resolvemos clave → numBitacora
    // igual que lo hace la propia app de SEMARNAT (consulta-tramite), para
    // que el historial se pueda consultar por clave.
    let numBitacora: string | null = null
    let tramite: unknown = null
    try {
      const proyRes = await fetchWithTimeout(`${SEMARNAT_API_BASE}/proyectos/search-proyecto`, {
        method: 'POST',
        headers: { ...commonHeaders(), 'Content-Type': 'application/json' },
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

    const apiRes = await fetchWithTimeout(`${SEMARNAT_API_BASE}/historial/search-historial-bitacora`, {
      method: 'POST',
      headers: { ...commonHeaders(), 'Content-Type': 'application/json' },
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

    const apiRes = await fetchWithTimeout(`${SEMARNAT_API_BASE}/proyectos/archivopdf`, {
      method: 'POST',
      headers: { ...commonHeaders(), 'Content-Type': 'text/plain' },
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
