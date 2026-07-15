import {
  getSupabaseClient,
  getSupabaseAuthClient,
} from '../lib/supabase/client'

// Edge Function deployed on the datos-abiertos project (stateless compression only)
const COMPRESS_FUNCTION_URL = 'https://jvwtihesgbzixitfwxaf.supabase.co/functions/v1/compress-image'

interface CompressResult {
  compressedBlob: Blob
  compressedMime: string
  originalSize: number
  compressedSize: number
  compressionRatio: string
  width: number
  height: number
}

async function compressImage(
  file: File,
  quality = 80,
  signal?: AbortSignal,
): Promise<CompressResult> {
  const formData = new FormData()
  formData.append('image', file)

  const res = await fetch(COMPRESS_FUNCTION_URL, {
    method: 'POST',
    headers: { 'X-Quality': String(quality) },
    body: formData,
    signal,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Error desconocido al comprimir imagen' }))
    throw new Error(body.error || `Error del servidor (${res.status})`)
  }

  const compressedBlob = await res.blob()
  return {
    compressedBlob,
    compressedMime: compressedBlob.type,
    originalSize: parseInt(res.headers.get('X-Original-Size') || '0', 10),
    compressedSize: parseInt(res.headers.get('X-Compressed-Size') || '0', 10),
    compressionRatio: res.headers.get('X-Compression-Ratio') || '0%',
    width: parseInt(res.headers.get('X-Width') || '0', 10),
    height: parseInt(res.headers.get('X-Height') || '0', 10),
  }
}

export async function uploadAndCompressImage(
  file: File,
  quality = 80,
  options?: { bucket?: string; signal?: AbortSignal },
): Promise<string> {
  const bucket = options?.bucket || 'event_banners'

  // 1. Compress via edge function
  const { compressedBlob, compressedMime } = await compressImage(file, quality, options?.signal)

  // 2. Upload compressed blob directly to Supabase Storage
  const isAuthenticated = !!options?.bucket // only org_logos require auth
  const client = isAuthenticated ? getSupabaseAuthClient() : getSupabaseClient()
  if (!client) throw new Error('No se pudo conectar con Supabase')

  const ext = compressedMime === 'image/png' ? 'png' : compressedMime === 'image/webp' ? 'webp' : 'jpg'
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  const path = `${bucket}/compressed/${timestamp}-${random}.${ext}`

  const { data, error } = await client.storage
    .from(bucket)
    .upload(path, compressedBlob, {
      contentType: compressedMime,
      cacheControl: '31536000',
      upsert: false,
    })

  if (error) throw new Error(`Error al subir la imagen: ${error.message}`)

  const { data: publicUrlData } = client.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return publicUrlData.publicUrl
}

export { compressImage }
