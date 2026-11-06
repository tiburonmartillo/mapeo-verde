import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleSemarnatProxy, resolveSemarnatPath } from '../_lib/semarnat-proxy'

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
