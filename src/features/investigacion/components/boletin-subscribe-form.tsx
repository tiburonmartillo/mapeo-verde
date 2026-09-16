import { useState } from "react"

interface BoletinesSubscribeFormProps {
  fuente: string
  eyebrow?: string
  title?: string
  description?: string
}

export function BoletinesSubscribeForm({
  fuente,
  eyebrow = "Mantente informado",
  title = "Suscríbete a nuestro boletín",
  description,
}: BoletinesSubscribeFormProps) {
  const [subEmail, setSubEmail] = useState("")
  const [subStatus, setSubStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [subMessage, setSubMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubStatus("loading")
    try {
      const res = await fetch("https://jvwtihesgbzixitfwxaf.supabase.co/functions/v1/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subEmail, fuente }),
      })
      const data = await res.json()
      if (data.success) {
        setSubStatus("success")
        setSubMessage("¡Gracias por suscribirte!")
        setSubEmail("")
      } else {
        setSubStatus("error")
        setSubMessage(data.message || "Error al suscribir")
      }
    } catch {
      setSubStatus("error")
      setSubMessage("Error de conexión")
    }
  }

  return (
    <div className="rounded-xl border border-[var(--color-section-accent)]/10 bg-white px-6 py-10 text-center sm:px-10 sm:py-12">
      <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--color-section-accent)]">
        {eyebrow}
      </p>
      <h2 className="mb-4 text-2xl font-bold leading-[1.1] tracking-tight text-black sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="mx-auto mb-6 max-w-lg text-sm leading-relaxed text-[var(--color-section-text)] sm:text-base">
          {description}
        </p>
      )}
      {subStatus === "success" ? (
        <p className="text-base font-semibold text-green-700">{subMessage}</p>
      ) : (
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={subEmail}
            onChange={(e) => setSubEmail(e.target.value)}
            placeholder="Tu correo electrónico"
            className="flex-1 rounded-full border border-gray-200 px-5 py-3 text-sm transition-colors focus:border-[var(--color-section-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-section-accent)]"
            required
            disabled={subStatus === "loading"}
          />
          <button
            type="submit"
            disabled={subStatus === "loading"}
            className="whitespace-nowrap rounded-full bg-[var(--color-section-accent)] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-section-accent-hover)] disabled:opacity-50"
          >
            {subStatus === "loading" ? "Enviando..." : "Suscribirse"}
          </button>
        </form>
      )}
      {subStatus === "error" && <p className="mt-3 text-sm text-red-600">{subMessage}</p>}
    </div>
  )
}