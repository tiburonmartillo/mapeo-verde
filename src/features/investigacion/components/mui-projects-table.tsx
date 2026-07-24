
import { useState, useMemo, useEffect, useRef } from "react"
import { Filter, ArrowUp, ArrowDown } from "lucide-react"
import { MapModal } from "./map-modal"
import { BoletinModal } from "./boletin-modal"
import { useBoletinModal } from "../hooks/useBoletinModal"
import { getInvestigacionClient } from "../lib/supabase-data"
import { getCalendarParts } from "../lib/date-utils"

interface Proyecto {
  numero: number
  tipo_estudio: string
  promovente: string
  nombre_proyecto: string
  giro: string
  municipio: string
  coordenadas_x: number | null
  coordenadas_y: number | null
  expediente: string
  fecha_ingreso: string
  boletin_id: number
  coord_valida: boolean | null
  naturaleza_proyecto: string
  fecha_publicacion: string
  boletin_url: string
}

interface Resolutivo {
  numero: number
  tipo_estudio: string
  promovente: string
  nombre_proyecto: string
  giro: string
  municipio: string
  coordenadas_x: number | null
  coordenadas_y: number | null
  expediente: string
  fecha_ingreso: string
  fecha_resolutivo: string
  no_oficio_resolutivo: string
  boletin_id: number
  naturaleza_proyecto: string
  fecha_publicacion: string
  boletin_url: string
  boletin_ingreso_url: string | null
}

interface MuiProjectsTableProps {
  proyectos: Proyecto[]
  resolutivos: Resolutivo[]
  municipios: string[]
  giros: string[]
  tiposEstudio: string[]
  selectedDate?: string | null
  highlightExpediente?: string
  search?: string
  onSearchChange?: (value: string) => void
  onSelectItem?: (item: any) => void
  showFiltersPanel?: boolean
  filterAnchorRef?: React.RefObject<HTMLElement | null>
  onCloseFilters?: () => void
  onToggleFilters?: () => void
}

export function MuiProjectsTable({
  proyectos,
  resolutivos,
  municipios,
  giros,
  tiposEstudio,
  selectedDate,
  highlightExpediente,
  search: externalSearch,
  onSearchChange,
  onSelectItem,
  showFiltersPanel = true,
  filterAnchorRef,
  onCloseFilters,
  onToggleFilters,
}: MuiProjectsTableProps) {
  const localFilterButtonRef = useRef<HTMLButtonElement | null>(null)
  const [activeTab, setActiveTab] = useState<"proyectos" | "resolutivos">("proyectos")
  const [internalSearch, setInternalSearch] = useState("")
  const search = externalSearch ?? internalSearch
  const setSearch = (value: string) => {
    if (onSearchChange) onSearchChange(value)
    else setInternalSearch(value)
  }

  const [municipioFilter, setMunicipioFilter] = useState<string>("all")
  const [giroFilter, setGiroFilter] = useState<string>("all")
  const [tipoFilter, setTipoFilter] = useState<string>("all")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [monthFilter, setMonthFilter] = useState<string>("all")
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 600)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  
  const [sortField, setSortField] = useState<string | null>("fecha_publicacion")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [highlight, setHighlight] = useState<string | null>(null)
  
  const { isOpen: isBoletinModalOpen, selectedBoletin, openModal: openBoletinModal, closeModal: closeBoletinModal } = useBoletinModal()

  const [boletinesData, setBoletinesData] = useState<any[]>([])
  const [boletinesLoaded, setBoletinesLoaded] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    const loadBoletines = async () => {
      try {
        const supabase = getInvestigacionClient()
        const { data: rows, error: queryError } = await supabase
          .from('boletines')
          .select('id, url, fecha_publicacion, cantidad_ingresados, cantidad_resolutivos')
          .order('fecha_publicacion', { ascending: false })
        if (queryError) throw new Error(queryError.message)
        setBoletinesData(rows || [])
        setBoletinesLoaded(true)
      } catch (error) {
        console.error('Error cargando datos de boletines:', error)
        setBoletinesLoaded(true)
      }
    }
    loadBoletines()
  }, [mounted])

  const formatFecha = (fechaStr: string): string => {
    if (!fechaStr) return 'Sin fecha'
    try {
      const fecha = new Date(fechaStr)
      if (isNaN(fecha.getTime())) return 'Sin fecha'
      const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
      const dia = fecha.getDate()
      const mes = meses[fecha.getMonth()]
      const año = fecha.getFullYear()
      return `${dia} ${mes} ${año}`
    } catch { return 'Sin fecha' }
  }

  const getBoletinResumen = (boletinId: number): string => {
    if (!mounted || !boletinesLoaded) return 'Cargando...'
    const boletin = boletinesData.find((b: any) => b.id === boletinId)
    if (!boletin) return 'Boletín no encontrado'
    const fecha = formatFecha(boletin.fecha_publicacion)
    const proyectos = boletin.cantidad_ingresados || 0
    const resolutivos = boletin.cantidad_resolutivos || 0
    return `${fecha} • ${proyectos} proyectos • ${resolutivos} resolutivos`
  }

  const getBoletin = (boletinId: number) => {
    if (!mounted || !boletinesLoaded) return null
    return boletinesData.find((b: any) => b.id === boletinId)
  }

  useEffect(() => {
    if (selectedDate) {
      const fecha = new Date(selectedDate)
      const year = fecha.getFullYear().toString()
      const month = (fecha.getMonth() + 1).toString()
      setYearFilter(year)
      setMonthFilter(month)
      setMunicipioFilter("all")
      setGiroFilter("all")
      setTipoFilter("all")
    }
  }, [selectedDate])

  useEffect(() => {
    if (!highlightExpediente || typeof highlightExpediente !== 'string') return
    setHighlight(highlightExpediente)
    setTimeout(() => {
      const el = document.getElementById(`row-${highlightExpediente}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }, [highlightExpediente])

  const handleRowClick = (item: any) => {
    if (item.coordenadas_x && item.coordenadas_y) {
      setSelectedItem(item)
      setIsMapModalOpen(true)
    }
  }

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    else { setSortField(field); setSortDirection("desc") }
    setPage(0)
  }

  const sortItems = (items: any[], field: string | null, direction: "asc" | "desc"): any[] => {
    if (!field) return sortByDate(items)
    return [...items].sort((a, b) => {
      const aValue: any = a[field]
      const bValue: any = b[field]
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1
      if (field.includes("fecha")) {
        try {
          const dateA = String(aValue).includes("/") ? new Date(String(aValue).split("/").reverse().join("-")) : new Date(String(aValue))
          const dateB = String(bValue).includes("/") ? new Date(String(bValue).split("/").reverse().join("-")) : new Date(String(bValue))
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0
          const diff = dateA.getTime() - dateB.getTime()
          return direction === "asc" ? diff : -diff
        } catch { return 0 }
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        const diff = aValue - bValue
        return direction === "asc" ? diff : -diff
      }
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()
      if (aStr < bStr) return direction === "asc" ? -1 : 1
      if (aStr > bStr) return direction === "asc" ? 1 : -1
      return 0
    })
  }

  const sortByDate = (items: any[]): any[] => sortItems(items, "fecha_ingreso", "desc")

  const filteredProyectos = useMemo<Proyecto[]>(() => {
    if (!proyectos || !Array.isArray(proyectos)) return []
    const filtered = proyectos.filter(proyecto => {
      const nombreProyecto = proyecto.nombre_proyecto || ''
      const municipio = proyecto.municipio || ''
      const giro = proyecto.giro || ''
      const expediente = proyecto.expediente || ''
      const promovente = proyecto.promovente || ''
      const tipoEstudio = proyecto.tipo_estudio || ''
      const matchesSearch = nombreProyecto.toLowerCase().includes(search.toLowerCase()) ||
                           municipio.toLowerCase().includes(search.toLowerCase()) ||
                           giro.toLowerCase().includes(search.toLowerCase()) ||
                           expediente.toLowerCase().includes(search.toLowerCase()) ||
                           promovente.toLowerCase().includes(search.toLowerCase())
      const matchesMunicipio = municipioFilter === "all" || municipio === municipioFilter
      const matchesGiro = giroFilter === "all" || giro === giroFilter
      const matchesTipo = tipoFilter === "all" || tipoEstudio === tipoFilter
      let matchesYear = true
      let matchesMonth = true
      if (yearFilter !== "all") { const parts = getCalendarParts(proyecto.fecha_publicacion); matchesYear = parts?.year === yearFilter }
      if (monthFilter !== "all") { const parts = getCalendarParts(proyecto.fecha_publicacion); matchesMonth = parts?.month === monthFilter }
      return matchesSearch && matchesMunicipio && matchesGiro && matchesTipo && matchesYear && matchesMonth
    })
    return sortItems(filtered, sortField || "fecha_publicacion", sortDirection) as Proyecto[]
  }, [proyectos, search, municipioFilter, giroFilter, tipoFilter, yearFilter, monthFilter, sortField, sortDirection])

  const filteredResolutivos = useMemo<Resolutivo[]>(() => {
    if (!resolutivos || !Array.isArray(resolutivos)) return []
    const filtered = resolutivos.filter(resolutivo => {
      const noOficio = resolutivo.no_oficio_resolutivo || ''
      const nombreProyecto = resolutivo.nombre_proyecto || ''
      const expediente = resolutivo.expediente || ''
      const promovente = resolutivo.promovente || ''
      const municipio = resolutivo.municipio || ''
      const giro = resolutivo.giro || ''
      const tipoEstudio = resolutivo.tipo_estudio || ''
      const matchesSearch = noOficio.toLowerCase().includes(search.toLowerCase()) ||
                           nombreProyecto.toLowerCase().includes(search.toLowerCase()) ||
                           expediente.toLowerCase().includes(search.toLowerCase()) ||
                           promovente.toLowerCase().includes(search.toLowerCase())
      const matchesMunicipio = municipioFilter === "all" || municipio === municipioFilter
      const matchesGiro = giroFilter === "all" || giro === giroFilter
      const matchesTipo = tipoFilter === "all" || tipoEstudio === tipoFilter
      let matchesYear = true
      let matchesMonth = true
      if (yearFilter !== "all") { const parts = getCalendarParts(resolutivo.fecha_publicacion); matchesYear = parts?.year === yearFilter }
      if (monthFilter !== "all") { const parts = getCalendarParts(resolutivo.fecha_publicacion); matchesMonth = parts?.month === monthFilter }
      return matchesSearch && matchesMunicipio && matchesGiro && matchesTipo && matchesYear && matchesMonth
    })
    return sortItems(filtered, sortField || "fecha_resolutivo", sortDirection) as Resolutivo[]
  }, [resolutivos, search, municipioFilter, giroFilter, tipoFilter, yearFilter, monthFilter, sortField, sortDirection])

  const handleTabChange = (newValue: "proyectos" | "resolutivos") => {
    setActiveTab(newValue)
    setPage(0)
    setSortField(newValue === "proyectos" ? "fecha_publicacion" : "fecha_resolutivo")
    setSortDirection("desc")
  }

  const handleChangePage = (newPage: number) => setPage(newPage)
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLSelectElement>) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0) }

  const clearFilters = () => {
    setSearch("")
    setMunicipioFilter("all")
    setGiroFilter("all")
    setTipoFilter("all")
    setYearFilter("all")
    setMonthFilter("all")
    setPage(0)
    setShowMobileFilters(false)
    setSortField(null)
    setSortDirection("desc")
  }

  const SortableHeader = ({ field, label }: { field: string; label: string }) => {
    const isActive = sortField === field
    return (
      <th
        className="cursor-pointer select-none px-3 py-2 text-left text-sm font-bold hover:bg-black/5"
        onClick={() => handleSort(field)}
        scope="col"
        aria-sort={isActive ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {isActive ? (
            sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4 opacity-30" />
          )}
        </span>
      </th>
    )
  }

  const getAvailableYears = () => {
    const allItems = activeTab === "proyectos" ? proyectos : resolutivos
    const years = new Set<string>()
    allItems.forEach((item) => { const parts = getCalendarParts(item.fecha_publicacion); if (parts?.year) years.add(parts.year) })
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a))
  }

  const getAvailableMonths = () => ([
    { value: "1", label: "Enero" }, { value: "2", label: "Febrero" }, { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" }, { value: "5", label: "Mayo" }, { value: "6", label: "Junio" },
    { value: "7", label: "Julio" }, { value: "8", label: "Agosto" }, { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" }, { value: "11", label: "Noviembre" }, { value: "12", label: "Diciembre" }
  ])

  const paginatedProyectos = useMemo<Proyecto[]>(() => {
    const startIndex = page * rowsPerPage
    return filteredProyectos.slice(startIndex, startIndex + rowsPerPage)
  }, [filteredProyectos, page, rowsPerPage])

  const paginatedResolutivos = useMemo<Resolutivo[]>(() => {
    const startIndex = page * rowsPerPage
    return filteredResolutivos.slice(startIndex, startIndex + rowsPerPage)
  }, [filteredResolutivos, page, rowsPerPage])

  if (!proyectos || !resolutivos || !Array.isArray(proyectos) || !Array.isArray(resolutivos)) {
    return (
      <div className="rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        <h3 className="text-base font-semibold text-gray-900">Proyectos y Resolutivos</h3>
        <p className="mt-2 text-sm text-gray-500">No hay datos disponibles para mostrar</p>
      </div>
    )
  }

  const filtersContent = (
    <div className="flex min-w-[320px] flex-col gap-2 p-2 md:flex-row md:flex-wrap md:items-center">
      <select
        value={municipioFilter}
        onChange={(e) => setMunicipioFilter(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm md:w-[120px]"
      >
        <option value="all">Municipio: Todos</option>
        {municipios.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <select
        value={giroFilter}
        onChange={(e) => setGiroFilter(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm md:w-[120px]"
      >
        <option value="all">Giro: Todos</option>
        {giros.map(g => <option key={g} value={g}>{g}</option>)}
      </select>
      <select
        value={tipoFilter}
        onChange={(e) => setTipoFilter(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm md:w-[140px]"
      >
        <option value="all">Tipo: Todos</option>
        {tiposEstudio.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <select
        value={yearFilter}
        onChange={(e) => setYearFilter(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm md:w-[90px]"
      >
        <option value="all">Año: Todos</option>
        {getAvailableYears().map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <select
        value={monthFilter}
        onChange={(e) => setMonthFilter(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm md:w-[90px]"
      >
        <option value="all">Mes: Todos</option>
        {getAvailableMonths().map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
      <button
        onClick={clearFilters}
        className="w-full rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 md:w-auto"
      >
        Limpiar filtros
      </button>
    </div>
  )

  return (
    <div className="flex h-full flex-col rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 py-4 sm:px-6 md:px-8">
        {/* Filter popover */}
        {showFiltersPanel && (
          <div className="absolute left-1/2 z-50 mt-2 -translate-x-1/2 rounded-xl bg-white shadow-lg ring-1 ring-black/5">
            {filtersContent}
          </div>
        )}

        <div className="shrink-0">
          <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
            Consulta boletines oficiales, proyectos ingresados y resolutivos emitidos por la Secretaría de Medio Ambiente.
          </h3>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:flex-nowrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por promovente, proyecto, expediente..."
            className="min-w-0 flex-1 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm focus:border-gray-500 focus:outline-none"
            style={{ minWidth: '280px' }}
          />
          <button
            ref={localFilterButtonRef}
            onClick={() => { if (onToggleFilters) onToggleFilters(); else setShowMobileFilters((v) => !v) }}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100"
            aria-label={showFiltersPanel ? "Ocultar filtros" : "Mostrar filtros"}
            title={showFiltersPanel ? "Ocultar filtros" : "Mostrar filtros"}
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="shrink-0 border-b border-gray-200">
          <div className="flex gap-0">
            <button
              onClick={() => handleTabChange("proyectos")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "proyectos"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Proyectos ({filteredProyectos.length})
            </button>
            <button
              onClick={() => handleTabChange("resolutivos")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "resolutivos"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Resolutivos ({filteredResolutivos.length})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="min-h-0 flex-1 overflow-auto border border-gray-200" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full" style={{ minWidth: 800 }}>
            <thead>
              <tr className="bg-blue-900/5">
                {activeTab === "proyectos" ? (
                  <>
                    <SortableHeader field="expediente" label="Expediente" />
                    <SortableHeader field="nombre_proyecto" label="Proyecto" />
                    <SortableHeader field="promovente" label="Promovente" />
                    <SortableHeader field="tipo_estudio" label="Tipo" />
                    <SortableHeader field="fecha_ingreso" label="Ingreso" />
                  </>
                ) : (
                  <>
                    <SortableHeader field="no_oficio_resolutivo" label="No. Oficio" />
                    <SortableHeader field="expediente" label="Expediente" />
                    <SortableHeader field="nombre_proyecto" label="Proyecto" />
                    <SortableHeader field="promovente" label="Promovente" />
                    <SortableHeader field="fecha_ingreso" label="Ingreso" />
                    <SortableHeader field="fecha_resolutivo" label="Fecha Resolutivo" />
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {activeTab === "proyectos" ? (
                paginatedProyectos.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">No se encontraron proyectos</td></tr>
                ) : (
                  paginatedProyectos.map((proyecto, index) => (
                    <tr
                      key={`${proyecto.expediente || 'unknown'}-${proyecto.boletin_id || 'unknown'}-${index}`}
                      id={`row-${proyecto.expediente}`}
                      onClick={() => { if (onSelectItem) onSelectItem(proyecto); else handleRowClick(proyecto) }}
                      className={`h-[72px] cursor-pointer border-b border-gray-100 text-sm transition-colors hover:bg-black/[0.03] ${
                        highlight === proyecto.expediente ? 'bg-amber-100/50 outline outline-2 outline-emerald-900/35 hover:bg-amber-200/50' : ''
                      }`}
                    >
                      <td className="whitespace-nowrap px-3 py-2">{proyecto.expediente || 'N/A'}</td>
                      <td className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap px-3 py-2 sm:max-w-[260px] md:max-w-[320px]">{proyecto.nombre_proyecto || 'N/A'}</td>
                      <td className="max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap px-3 py-2 sm:max-w-[150px] md:max-w-[180px]">{proyecto.promovente || 'N/A'}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {proyecto.tipo_estudio ? (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold ${
                              proyecto.tipo_estudio.toLowerCase() === 'mia'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-slate-100 text-blue-800'
                            }`}
                          >
                            {proyecto.tipo_estudio}
                          </span>
                        ) : 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">{proyecto.fecha_ingreso || 'N/A'}</td>
                    </tr>
                  ))
                )
              ) : (
                paginatedResolutivos.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-500">No se encontraron resolutivos</td></tr>
                ) : (
                  paginatedResolutivos.map((resolutivo, index) => (
                    <tr
                      key={`${resolutivo.no_oficio_resolutivo || 'unknown'}-${resolutivo.boletin_id || 'unknown'}-${index}`}
                      onClick={() => { if (onSelectItem) onSelectItem(resolutivo); else handleRowClick(resolutivo) }}
                      className="h-[72px] cursor-pointer border-b border-gray-100 text-sm transition-colors hover:bg-black/[0.03]"
                    >
                      <td className="whitespace-nowrap px-3 py-2">{resolutivo.no_oficio_resolutivo || 'N/A'}</td>
                      <td className="whitespace-nowrap px-3 py-2">{resolutivo.expediente || 'N/A'}</td>
                      <td className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap px-3 py-2 sm:max-w-[260px] md:max-w-[320px]">{resolutivo.nombre_proyecto || 'N/A'}</td>
                      <td className="max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap px-3 py-2 sm:max-w-[150px] md:max-w-[180px]">{resolutivo.promovente || 'N/A'}</td>
                      <td className="whitespace-nowrap px-3 py-2">{resolutivo.fecha_ingreso || 'N/A'}</td>
                      <td className="whitespace-nowrap px-3 py-2">{resolutivo.fecha_resolutivo || 'N/A'}</td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Filas por página:</span>
            <select
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>
              {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, activeTab === "proyectos" ? filteredProyectos.length : filteredResolutivos.length)} de {activeTab === "proyectos" ? filteredProyectos.length : filteredResolutivos.length}
            </span>
            <button
              onClick={() => handleChangePage(page - 1)}
              disabled={page === 0}
              className="rounded px-2 py-1 text-sm hover:bg-gray-100 disabled:opacity-30"
            >
              Anterior
            </button>
            <button
              onClick={() => handleChangePage(page + 1)}
              disabled={(page + 1) * rowsPerPage >= (activeTab === "proyectos" ? filteredProyectos.length : filteredResolutivos.length)}
              className="rounded px-2 py-1 text-sm hover:bg-gray-100 disabled:opacity-30"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {selectedItem && (
        <MapModal
          coordenadas_x={selectedItem.coordenadas_x}
          coordenadas_y={selectedItem.coordenadas_y}
          expediente={selectedItem.expediente}
          nombre_proyecto={selectedItem.nombre_proyecto || 'Sin nombre'}
          municipio={selectedItem.municipio}
          promovente={selectedItem.promovente}
          fecha_ingreso={selectedItem.fecha_ingreso}
          naturaleza_proyecto={selectedItem.naturaleza_proyecto}
          boletin_url={selectedItem.boletin_url}
          isOpen={isMapModalOpen}
          onClose={() => setIsMapModalOpen(false)}
        />
      )}
      <BoletinModal boletin={selectedBoletin} isOpen={isBoletinModalOpen} onClose={closeBoletinModal} />
    </div>
  )
}
