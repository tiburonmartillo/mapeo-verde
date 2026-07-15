import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"

const app = new Hono()

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE = 10 * 1024 * 1024
const MAX_WIDTH = 1920
const DEFAULT_QUALITY = 80

app.use("*", logger(console.log))
app.use("*", cors({ origin: "*", allowHeaders: ["Content-Type", "Authorization", "X-Quality"], allowMethods: ["POST", "OPTIONS"] }))

app.post("/", async (c) => {
  try {
    let file: File | null = null
    const ct = c.req.header("content-type") || ""

    if (ct.includes("multipart/form-data")) {
      const form = await c.req.parseBody()
      file = (form["image"] || form["file"]) as File
    } else if (ct.includes("application/json")) {
      const body = await c.req.json()
      if (body.url) {
        const resp = await fetch(body.url)
        if (!resp.ok) return c.json({ error: "No se pudo descargar la imagen desde la URL" }, 400)
        const blob = await resp.blob()
        file = new File([blob], "download.jpg", { type: blob.type })
      } else if (body.base64) {
        const mime = body.mime || "image/jpeg"
        const b64 = body.base64.replace(/^data:image\/\w+;base64,/, "")
        const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
        file = new File([bin], body.filename || "image.jpg", { type: mime })
      }
    }

    if (!file) return c.json({ error: "Envíe una imagen en 'image' (multipart), 'url', o 'base64'" }, 400)

    if (!ALLOWED_TYPES.includes(file.type)) {
      return c.json({ error: `Tipo no permitido: ${file.type}. Use JPEG, PNG o WebP.` }, 400)
    }

    if (file.size > MAX_SIZE) {
      return c.json({ error: `La imagen excede ${MAX_SIZE / 1024 / 1024} MB` }, 400)
    }

    const originalBuffer = new Uint8Array(await file.arrayBuffer())

    let quality = parseInt(c.req.header("X-Quality") || String(DEFAULT_QUALITY), 10)
    if (isNaN(quality) || quality < 10) quality = 10
    if (quality > 100) quality = 100

    const { default: Jimp } = await import("npm:jimp@0.22.12")
    const image = await Jimp.read(originalBuffer)

    const originalWidth = image.bitmap.width
    const originalHeight = image.bitmap.height

    if (image.bitmap.width > MAX_WIDTH) {
      image.resize(MAX_WIDTH, Jimp.AUTO)
    }

    const mime = file.type === "image/png" ? "image/png" : "image/jpeg"
    const compressedBuffer = await image.quality(quality).getBufferAsync(mime)

    const compressionRatio = originalBuffer.length > 0
      ? ((1 - compressedBuffer.length / originalBuffer.length) * 100).toFixed(1)
      : "0"

    // Return the compressed image as a downloadable blob
    return new Response(compressedBuffer, {
      headers: {
        "Content-Type": mime,
        "X-Original-Size": String(originalBuffer.length),
        "X-Compressed-Size": String(compressedBuffer.length),
        "X-Compression-Ratio": compressionRatio,
        "X-Width": String(image.bitmap.width),
        "X-Height": String(image.bitmap.height),
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("compress-image error:", err)
    return c.json({ error: err instanceof Error ? err.message : "Error desconocido" }, 500)
  }
})

Deno.serve(app.fetch)
