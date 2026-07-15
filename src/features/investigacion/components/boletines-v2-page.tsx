import { useState, useMemo, useRef, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { MapPin, X, Search } from "lucide-react"
import { Drawer, IconButton, useMediaQuery } from "@mui/material"
import { MuiProjectsTable } from "./mui-projects-table"
import { ClientOnly } from "./client-only"
import { useDashboardData } from "../hooks/useDashboardData"
import {
  filterProyectos,
  filterResolutivos,
  getFilteredStats,
  type FilterOptions,
} from "../lib/data-utils"
import { ProjectsMap, convertToLatLong } from "./projects-map"

/** Panel de detalle del proyecto/resolutivo (info + mapa + acciones). Reutilizado en desktop (columna) y móvil (sheet). En desktop el mapa general siempre se muestra. */
function DetailPanelContent({
  selectedItem,
  filteredProyectos,
  filteredResolutivos,
  onSelectItem,
  onClose,
  showCloseButton = false,
}: {
  selectedItem: any
  filteredProyectos: any[]
  filteredResolutivos: any[]
  onSelectItem: (item: any) => void
  onClose?: () => void
  showCloseButton?: boolean
}) {
  const coords = selectedItem?.coordenadas_x != null && selectedItem?.coordenadas_y != null
    ? convertToLatLong(selectedItem.coordenadas_x, selectedItem.coordenadas_y)
    : null
  const mapsUrl = coords ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}` : null

  return (
    <div className="flex flex-col h-full overflow-auto bg-neutral/30">
      {showCloseButton && onClose && (
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Detalle</span>
          <IconButton onClick={onClose} aria-label="Cerrar" size="small" sx={{ color: "#6B7280" }}>
            <X className="h-5 w-5" />
          </IconButton>
        </div>
      )}
      {selectedItem && (
      <div className="flex shrink-0 flex-col gap-5 bg-white p-4 lg:p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-black bg-[var(--color-boletin-yellow)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-black">
            {selectedItem.fecha_resolutivo ? "Resolutivo" : "Ingresado"}
          </span>
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-bold uppercase leading-tight tracking-wide text-gray-900 lg:text-xl" title={selectedItem.nombre_proyecto}>
            {selectedItem.nombre_proyecto}
          </h2>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Promovente</p>
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2.5">
              <div className="h-8 w-1 shrink-0 rounded-full bg-[var(--color-boletin-red)]" aria-hidden />
              <p className="text-sm font-bold uppercase tracking-wide text-black">
                {selectedItem.promovente}
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            { label: "Tipo", value: selectedItem.tipo_estudio },
            { label: "Giro", value: selectedItem.giro },
            { label: "Expediente", value: selectedItem.expediente },
            { label: "Fecha", value: selectedItem.fecha_resolutivo || selectedItem.fecha_ingreso },
            { label: "Municipio", value: selectedItem.municipio },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-gray-200 bg-white px-2.5 py-2">
              <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
              <p className="text-xs font-medium text-black truncate">{value || "—"}</p>
            </div>
          ))}
        </div>
        {selectedItem.naturaleza_proyecto && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Naturaleza del proyecto</p>
            <div className="rounded-lg border border-gray-200 bg-gray-50/70 px-3.5 py-2.5 text-sm leading-relaxed text-gray-800 text-justify">
              {selectedItem.naturaleza_proyecto}
            </div>
          </div>
        )}
      </div>
      )}
      <div className="flex min-h-[240px] flex-1 min-w-0 flex-col overflow-hidden lg:min-h-0">
        <ClientOnly fallback={<div className="flex-1 min-h-[200px] flex items-center justify-center text-gray-400">Cargando mapa...</div>}>
          <ProjectsMap
            proyectos={filteredProyectos}
            onSelectExpediente={(exp) => {
              const found =
                filteredProyectos.find((p) => p.expediente === exp) ??
                filteredResolutivos.find((r) => r.expediente === exp)
              if (found) onSelectItem(found)
            }}
            compact={!!selectedItem}
            focusExpediente={selectedItem?.expediente ?? null}
          />
        </ClientOnly>
      </div>
      {selectedItem && (mapsUrl || selectedItem.boletin_url) && (
        <div className="flex shrink-0 flex-col gap-2 border-t border-gray-200 bg-white p-3 sm:flex-row sm:items-center sm:gap-2 sm:p-4">
          {selectedItem.boletin_url && (
          <a
            href={selectedItem.boletin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full flex-1 items-center justify-center gap-2 rounded-full border border-black bg-[var(--color-boletin-yellow)] px-4 py-2.5 text-sm font-semibold text-black shadow-sm hover:bg-[var(--color-boletin-yellow-hover)] transition-colors sm:min-w-0"
          >
            Consultar boletín
          </a>
          )}
          <div className="flex w-full gap-2 sm:contents">
            {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors sm:min-w-0"
            >
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              Ver en maps
            </a>
            )}
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams()
                if (selectedItem.boletin_id != null) params.set("boletin", String(selectedItem.boletin_id))
                if (selectedItem.expediente) params.set("expediente", String(selectedItem.expediente).trim())
                const url = `${typeof window !== "undefined" ? window.location.origin : ""}/boletines-ssmaa${params.toString() ? `?${params.toString()}` : ""}`
                const text = `Consulta este proyecto en Boletines Ambientales SSMAA: ${url}`
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer")
              }}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-transparent bg-[var(--color-whatsapp)] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[var(--color-whatsapp-hover)] transition-colors sm:min-w-0"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <span className="sm:hidden">Enviar por WhatsApp</span>
              <span className="hidden sm:inline">Compartir</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const isMobileBreakpoint = "(max-width: 1023px)"

export function BoletinesV2Page() {
  const [searchParams] = useSearchParams()
  const { data, processedData, loading, error } = useDashboardData()
  const isMobile = useMediaQuery(isMobileBreakpoint)
  const [search, setSearch] = useState("")
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const appliedBoletinParamRef = useRef(false)

  const filterOptions: FilterOptions = useMemo(
    () => ({ search }),
    [search]
  )

  const filteredProyectos = useMemo(() => {
    if (!processedData?.proyectos) return []
    return filterProyectos(processedData.proyectos, filterOptions)
  }, [processedData?.proyectos, filterOptions])

  const filteredResolutivos = useMemo(() => {
    if (!processedData?.resolutivos) return []
    return filterResolutivos(processedData.resolutivos, filterOptions)
  }, [processedData?.resolutivos, filterOptions])

  const filteredStats = useMemo(() => {
    if (!processedData?.proyectos || !processedData?.resolutivos || !data?.boletines)
      return { totalBoletines: 0, totalProyectos: 0, totalResolutivos: 0 }
    return getFilteredStats(
      processedData.proyectos,
      processedData.resolutivos,
      filterOptions,
      data.boletines.length
    )
  }, [data?.boletines, processedData?.proyectos, processedData?.resolutivos, filterOptions])

  // Al cargar con ?boletin=ID y opcionalmente ?expediente=XXX, seleccionar ese proyecto/resolutivo exacto para mostrar el panel
  useEffect(() => {
    if (loading || !processedData || appliedBoletinParamRef.current) return
    const boletinIdParam = searchParams.get("boletin")
    const expedienteParam = searchParams.get("expediente")
    if (!boletinIdParam || isNaN(Number(boletinIdParam))) return
    const boletinId = Number(boletinIdParam)
    let found: any = null
    if (expedienteParam && expedienteParam.trim()) {
      // Buscar el proyecto/resolutivo exacto por expediente (y mismo boletín)
      const exp = expedienteParam.trim()
      found =
        filteredProyectos.find((p: any) => p.boletin_id === boletinId && (p.expediente || "").toString().trim() === exp) ??
        filteredResolutivos.find((r: any) => r.boletin_id === boletinId && (r.expediente || "").toString().trim() === exp) ??
        null
    }
    if (!found) {
      // Sin expediente o no encontrado: fallback al primero de ese boletín
      found =
        filteredProyectos.find((p: any) => p.boletin_id === boletinId) ??
        filteredResolutivos.find((r: any) => r.boletin_id === boletinId) ??
        null
    }
    if (found) {
      setSelectedItem(found)
      appliedBoletinParamRef.current = true
    }
  }, [loading, processedData, filteredProyectos, filteredResolutivos, searchParams])

  const highlightExpediente = selectedItem?.expediente ?? undefined

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-500 font-mono text-sm">Cargando datos...</p>
      </div>
    )
  }

  if (error || !processedData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error al cargar los datos</h2>
          <p className="text-gray-600">{error || "No se pudieron cargar los boletines."}</p>
        </div>
      </div>
    )
  }

  const { stats } = processedData
  const municipios = stats?.municipios ?? []
  const giros = stats?.giros ?? []
  const tiposEstudio = stats?.tiposEstudio ?? []

  return (
    <div className="min-h-screen bg-neutral/30">
      <div className="w-full pb-6 md:pb-10">
        {/* Section Header */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 py-8 sm:py-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center rounded-full bg-[var(--color-boletin-yellow-light)] px-3 py-1 text-xs font-semibold tracking-wide text-black uppercase">
                SSMAA
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl leading-[1.1] tracking-tight text-black font-bold">
              Boletines Ambientales
            </h1>
            <p className="mt-2 text-base sm:text-lg text-[var(--color-section-text)] max-w-2xl">
              Plataforma de consulta y análisis de los boletines ambientales oficiales. Datos abiertos para la vigilancia ciudadana.
            </p>
          </div>
        </section>

          {/* Stats bar */}
          <section className="bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-2xl sm:text-3xl font-display text-[var(--color-section-accent)]">{filteredStats.totalBoletines}</p>
                  <p className="text-xs text-[var(--color-section-text)]">Boletines</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-display text-[var(--color-section-accent)]">{filteredStats.totalProyectos}</p>
                  <p className="text-xs text-[var(--color-section-text)]">Proyectos</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-display text-[var(--color-section-accent)]">{filteredStats.totalResolutivos}</p>
                  <p className="text-xs text-[var(--color-section-text)]">Resolutivos</p>
                </div>
              </div>
            </div>
          </section>

          {/* Mobile: header bar with badge + search trigger */}
          <section className="bg-white lg:hidden">
            <div className="max-w-7xl mx-auto px-6 py-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFiltersPanel(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[var(--color-section-text)] border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <Search className="h-3.5 w-3.5" />
                  Buscar
                </button>
                <span className="inline-flex items-center rounded-full bg-[var(--color-boletin-yellow-light)] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-black uppercase">
                  {filteredStats.totalProyectos + filteredStats.totalResolutivos} registros
                </span>
              </div>
            </div>
          </section>

            <div className="flex flex-col lg:grid lg:grid-cols-2 lg:grid-rows-1 gap-0 w-full lg:h-[100vh] lg:min-h-0 lg:overflow-hidden">
              {/* Móvil: columna, tamaño completo sin scroll interno. Desktop: columna izquierda */}
              <div className="flex flex-col min-w-0 lg:min-h-0 lg:overflow-hidden">
                <ClientOnly fallback={<div className="p-6 text-gray-500">Cargando tabla...</div>}>
                  <MuiProjectsTable
                    proyectos={filteredProyectos}
                    resolutivos={filteredResolutivos}
                    municipios={municipios}
                    giros={giros}
                    tiposEstudio={tiposEstudio}
                    search={search}
                    onSearchChange={setSearch}
                    onSelectItem={setSelectedItem}
                    highlightExpediente={highlightExpediente}
                    showFiltersPanel={showFiltersPanel}
                    onToggleFilters={() => setShowFiltersPanel((v) => !v)}
                    onCloseFilters={() => setShowFiltersPanel(false)}
                  />
                </ClientOnly>
              </div>
              {/* Desktop (lg+): columna derecha con detalle + mapa. Móvil: oculto; se usa el Drawer (side sheet). */}
              <div className="hidden lg:flex flex-col bg-gray-50/50 min-w-0 lg:min-h-0 lg:overflow-hidden">
                <DetailPanelContent
                  selectedItem={selectedItem}
                  filteredProyectos={filteredProyectos}
                  filteredResolutivos={filteredResolutivos}
                  onSelectItem={setSelectedItem}
                />
              </div>
            </div>

            {/* Móvil: side sheet con detalle + mapa al seleccionar una fila */}
            <Drawer
              anchor="right"
              open={isMobile && !!selectedItem}
              onClose={() => setSelectedItem(null)}
              slotProps={{ backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.4)" } } }}
              PaperProps={{
                sx: { width: "100%", maxWidth: 420, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
              }}
            >
              <DetailPanelContent
                selectedItem={selectedItem}
                filteredProyectos={filteredProyectos}
                filteredResolutivos={filteredResolutivos}
                onSelectItem={setSelectedItem}
                onClose={() => setSelectedItem(null)}
                showCloseButton
              />
            </Drawer>
        </div>
      </div>
  )
}
