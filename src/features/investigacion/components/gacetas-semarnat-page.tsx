import { useState, useEffect } from "react"
import { MuiGacetasStats } from "./mui-gacetas-stats"
import { MuiGacetasProjectsTable } from "./mui-gacetas-projects-table"
import { useGacetasData } from "../hooks/useGacetasData"
import { getGacetasDataUrl } from "../lib/supabase-data"

export function GacetasSEMARNATPage() {
  const [mounted, setMounted] = useState(false)
  const [subEmail, setSubEmail] = useState('')
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [subMessage, setSubMessage] = useState('')

  const { processedData, loading, error, data } = useGacetasData()

  useEffect(() => { setMounted(true) }, [])

  const stats = processedData?.stats
  const proyectos = processedData?.proyectos || []
  const resolutivos = processedData?.resolutivos || []
  const metadata = processedData?.metadata

  const yearRange = data?.metadata?.year_range || `${new Date().getFullYear()}`

  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'var(--background-default)' }}>
        <p className="font-mono text-sm text-gray-500">Cargando datos...</p>
      </div>
    )
  }

  if (error || !processedData || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center p-2" style={{ backgroundColor: 'var(--background-default)' }}>
        <div className="max-w-[600px] rounded-lg border border-red-200 bg-red-50 p-4">
          <h6 className="mb-2 text-base font-semibold text-red-800">Error al cargar los datos</h6>
          <pre className="mt-2 whitespace-pre-wrap text-sm text-red-700">{error || "No se pudieron cargar los datos de gacetas."}</pre>
          <p className="mt-2 text-sm text-red-600">
            Verifica que el JSON esté disponible en: <code className="bg-red-100 px-1">{getGacetasDataUrl()}</code>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral/30">
        <div className="w-full pb-6 md:pb-10">
          <section className="border-b border-gray-100 bg-white">
            <div className="mx-auto max-w-7xl px-6 py-8 sm:py-10">
              <span className="mb-3 inline-flex items-center rounded-full bg-[#FFC0CB] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-black">
                SEMARNAT
              </span>
              <h1 className="text-3xl font-bold leading-[1.1] tracking-tight text-black sm:text-4xl md:text-5xl">
                Gacetas Ecológicas
              </h1>
              <p className="mt-2 max-w-2xl text-base text-[var(--color-section-text)] sm:text-lg">
                Visualización interactiva de las gacetas ecológicas publicadas por la Secretaría de Medio Ambiente y Recursos Naturales.
              </p>
              <a
                href="https://www.semarnat.gob.mx/gobmx/transparencia/gaceta.html"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-blue-700 underline hover:text-blue-900"
              >
                semarnat.gob.mx/gobmx/transparencia/gaceta.html
              </a>
            </div>
          </section>

          <section className="border-b border-gray-100 bg-white">
            <div className="mx-auto max-w-7xl px-6 py-4">
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="font-display text-2xl text-[var(--color-section-accent)] sm:text-3xl">{stats.totalGacetas}</p>
                  <p className="text-xs text-[var(--color-section-text)]">Gacetas ({yearRange})</p>
                </div>
                <div>
                  <p className="font-display text-2xl text-[var(--color-section-accent)] sm:text-3xl">{stats.totalProyectos}</p>
                  <p className="text-xs text-[var(--color-section-text)]">Proyectos</p>
                </div>
                <div>
                  <p className="font-display text-2xl text-[var(--color-section-accent)] sm:text-3xl">{stats.totalResolutivos}</p>
                  <p className="text-xs text-[var(--color-section-text)]">Resolutivos</p>
                </div>
              </div>
            </div>
          </section>

          <div className="mx-auto max-w-7xl px-6 py-6 sm:py-8">
            <div className="flex flex-col gap-6 sm:gap-8">
              <div className="flex items-center justify-center rounded-xl border border-[var(--color-section-accent)]/10 bg-white px-4 py-3">
                <p className="text-center text-xs text-gray-500 sm:text-sm">
                  Última actualización: {(() => {
                    try {
                      if (!metadata?.lastUpdated) return 'Fecha no disponible'
                      const date = new Date(metadata.lastUpdated)
                      const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
                      return `${date.getDate()} de ${monthNames[date.getMonth()]} de ${date.getFullYear()}`
                    } catch { return 'Fecha no disponible' }
                  })()}
                </p>
              </div>

              <MuiGacetasStats
                totalGacetas={stats.totalGacetas}
                yearRange={yearRange}
                totalProyectos={stats.totalProyectos}
                totalResolutivos={stats.totalResolutivos}
              />

              <MuiGacetasProjectsTable
                proyectos={proyectos}
                resolutivos={resolutivos}
              />

              <div className="rounded-xl border border-[var(--color-section-accent)]/10 bg-white px-6 py-10 text-center sm:px-10 sm:py-12">
                <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--color-section-accent)]">
                  Mantente informado
                </p>
                <h2 className="mb-4 text-2xl font-bold leading-[1.1] tracking-tight text-black sm:text-3xl">
                  Suscríbete a nuestro boletín
                </h2>
                <p className="mx-auto mb-6 max-w-lg text-sm leading-relaxed text-[var(--color-section-text)] sm:text-base">
                  Recibe las últimas gacetas ecológicas de SEMARNAT directamente en tu correo.
                </p>

                {(() => {
                  const handleSubmit = async (e: React.FormEvent) => {
                    e.preventDefault()
                    setSubStatus('loading')
                    try {
                      const res = await fetch('https://jvwtihesgbzixitfwxaf.supabase.co/functions/v1/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: subEmail, fuente: 'gacetas-semarnat' }),
                      })
                      const data = await res.json()
                      if (data.success) {
                        setSubStatus('success')
                        setSubMessage('¡Gracias por suscribirte!')
                        setSubEmail('')
                      } else {
                        setSubStatus('error')
                        setSubMessage(data.message || 'Error al suscribir')
                      }
                    } catch {
                      setSubStatus('error')
                      setSubMessage('Error de conexión')
                    }
                  }

                  return subStatus === 'success' ? (
                    <p className="text-base font-semibold text-green-700">{subMessage}</p>
                  ) : (
                    <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
                      <input
                        type="email"
                        value={subEmail}
                        onChange={e => setSubEmail(e.target.value)}
                        placeholder="Tu correo electrónico"
                        className="flex-1 rounded-full border border-gray-200 px-5 py-3 text-sm transition-colors focus:border-[var(--color-section-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-section-accent)]"
                        required
                        disabled={subStatus === 'loading'}
                      />
                      <button
                        type="submit"
                        disabled={subStatus === 'loading'}
                        className="whitespace-nowrap rounded-full bg-[var(--color-section-accent)] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-section-accent-hover)] disabled:opacity-50"
                      >
                        {subStatus === 'loading' ? 'Enviando...' : 'Suscribirse'}
                      </button>
                    </form>
                  )
                })()}
                {subStatus === 'error' && <p className="mt-3 text-sm text-red-600">{subMessage}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
