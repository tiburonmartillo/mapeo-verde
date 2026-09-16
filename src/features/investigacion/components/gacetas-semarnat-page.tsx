import { useState, useEffect } from "react"
import { MuiGacetasStats } from "./mui-gacetas-stats"
import { MuiGacetasProjectsTable } from "./mui-gacetas-projects-table"
import { BoletinesSubscribeForm } from "./boletin-subscribe-form"
import { useGacetasData } from "../hooks/useGacetasData"
import { getGacetasDataUrl } from "../lib/supabase-data"
import { formatFechaHoraLarga } from "../lib/date-utils"

export function GacetasSEMARNATPage() {
  const [mounted, setMounted] = useState(false)

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

          <div className="w-full px-6 py-6 sm:py-8 lg:px-10">
            <div className="flex flex-col gap-6 sm:gap-8">
              <div className="flex items-center justify-center rounded-xl border border-[var(--color-section-accent)]/10 bg-white px-4 py-3">
                <p className="text-center text-xs text-gray-500 sm:text-sm">
                  Última revisión de la base de datos: {formatFechaHoraLarga(metadata?.lastUpdated)}
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

              <BoletinesSubscribeForm
                fuente="gacetas-semarnat"
                description="Recibe las últimas gacetas ecológicas de SEMARNAT directamente en tu correo."
              />
            </div>
          </div>
        </div>
      </div>
  )
}
