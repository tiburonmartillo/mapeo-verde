import { useState, useEffect } from "react"
import { Box, Typography, Alert } from "@mui/material"
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
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-gray-500 font-mono text-sm">Cargando datos...</p>
      </Box>
    )
  }

  if (error || !processedData || !stats) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom>
            Error al cargar los datos
          </Typography>
          <Typography variant="body2" component="pre" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
            {error || "No se pudieron cargar los datos de gacetas."}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Verifica que el JSON esté disponible en: <code>{getGacetasDataUrl()}</code>
          </Typography>
        </Alert>
      </Box>
    )
  }

  return (
    <div className="min-h-screen bg-neutral/30">
        <div className="w-full pb-6 md:pb-10">
          <section className="bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-6 py-8 sm:py-10">
              <span className="inline-flex items-center rounded-full bg-[#FFC0CB] px-3 py-1 text-xs font-semibold tracking-wide text-black uppercase mb-3">
                SEMARNAT
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl leading-[1.1] tracking-tight text-black font-bold">
                Gacetas Ecológicas
              </h1>
              <p className="mt-2 text-base sm:text-lg text-[var(--color-section-text)] max-w-2xl">
                Visualización interactiva de las gacetas ecológicas publicadas por la Secretaría de Medio Ambiente y Recursos Naturales.
              </p>
              <a
                href="https://www.semarnat.gob.mx/gobmx/transparencia/gaceta.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-sm text-blue-700 underline hover:text-blue-900"
              >
                semarnat.gob.mx/gobmx/transparencia/gaceta.html
              </a>
            </div>
          </section>

          <section className="bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-2xl sm:text-3xl font-display text-[var(--color-section-accent)]">{stats.totalGacetas}</p>
                  <p className="text-xs text-[var(--color-section-text)]">Gacetas ({yearRange})</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-display text-[var(--color-section-accent)]">{stats.totalProyectos}</p>
                  <p className="text-xs text-[var(--color-section-text)]">Proyectos</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-display text-[var(--color-section-accent)]">{stats.totalResolutivos}</p>
                  <p className="text-xs text-[var(--color-section-text)]">Resolutivos</p>
                </div>
              </div>
            </div>
          </section>

          <div className="max-w-7xl mx-auto px-6 py-6 sm:py-8">
            <div className="flex flex-col gap-6 sm:gap-8">
              <div className="flex items-center justify-center py-3 px-4 bg-white rounded-xl border border-[var(--color-section-accent)]/10">
                <Typography variant="body2" color="text.secondary" className="text-center text-xs sm:text-sm">
                  Última actualización: {(() => {
                    try {
                      if (!metadata?.lastUpdated) return 'Fecha no disponible'
                      const date = new Date(metadata.lastUpdated)
                      const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
                      return `${date.getDate()} de ${monthNames[date.getMonth()]} de ${date.getFullYear()}`
                    } catch { return 'Fecha no disponible' }
                  })()}
                </Typography>
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

              <div className="rounded-xl border border-[var(--color-section-accent)]/10 bg-white px-6 py-10 sm:px-10 sm:py-12 text-center">
                <p className="text-sm font-semibold tracking-widest uppercase text-[var(--color-section-accent)] mb-4">
                  Mantente informado
                </p>
                <h2 className="text-2xl sm:text-3xl leading-[1.1] tracking-tight text-black mb-4 font-bold">
                  Suscríbete a nuestro boletín
                </h2>
                <p className="text-sm sm:text-base text-[var(--color-section-text)] mb-6 max-w-lg mx-auto leading-relaxed">
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
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                      <input
                        type="email"
                        value={subEmail}
                        onChange={e => setSubEmail(e.target.value)}
                        placeholder="Tu correo electrónico"
                        className="flex-1 px-5 py-3 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-[var(--color-section-accent)] focus:ring-1 focus:ring-[var(--color-section-accent)] transition-colors"
                        required
                        disabled={subStatus === 'loading'}
                      />
                      <button
                        type="submit"
                        disabled={subStatus === 'loading'}
                        className="px-8 py-3 rounded-full text-sm font-semibold text-white bg-[var(--color-section-accent)] hover:bg-[var(--color-section-accent-hover)] transition-colors whitespace-nowrap disabled:opacity-50"
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
