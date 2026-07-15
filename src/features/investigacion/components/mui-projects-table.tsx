
import { useState, useMemo, useEffect, useRef } from "react"
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TablePagination,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
  Popover
} from "@mui/material"
import { FilterList, Clear, ArrowUpward, ArrowDownward } from "@mui/icons-material"
import { styled } from "@mui/material"
import { MapModal } from "./map-modal"
import { BoletinModal } from "./boletin-modal"
import { useBoletinModal } from "../hooks/useBoletinModal"
import { getInvestigacionClient } from "../lib/supabase-data"
import { getCalendarParts } from "../lib/date-utils"

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '12px',
  transition: 'box-shadow 0.2s ease-in-out',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
}))

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
  const fixedRowHeight = 72
  const compactCellSx = {
    fontSize: '14px',
    py: 1,
    height: `${fixedRowHeight}px`,
    verticalAlign: 'middle',
  } as const
  const truncatedCellSx = {
    ...compactCellSx,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as const

  const localFilterButtonRef = useRef<HTMLButtonElement | null>(null)
  const [activeTab, setActiveTab] = useState<"proyectos" | "resolutivos">("proyectos")
  const [internalSearch, setInternalSearch] = useState("")
  const search = externalSearch ?? internalSearch
  const setSearch = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value)
    } else {
      setInternalSearch(value)
    }
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
  
  // Estados para paginación
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  
  // Estados para ordenamiento
  const [sortField, setSortField] = useState<string | null>("fecha_publicacion")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  
  // Estados para modal de ubicación
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [highlight, setHighlight] = useState<string | null>(null)
  
  // Hook para modal de boletín con routing
  const { isOpen: isBoletinModalOpen, selectedBoletin, openModal: openBoletinModal, closeModal: closeBoletinModal } = useBoletinModal()

  // Estado para almacenar datos de boletines
  const [boletinesData, setBoletinesData] = useState<any[]>([])
  const [boletinesLoaded, setBoletinesLoaded] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Evitar hidratación: solo renderizar contenido dependiente de datos asíncronos después de montar
  useEffect(() => {
    setMounted(true)
  }, [])

  // Cargar datos de boletines al montar el componente
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

  // Función para formatear fecha de manera consistente (sin depender de localización del servidor)
  const formatFecha = (fechaStr: string): string => {
    if (!fechaStr) return 'Sin fecha'
    
    try {
      const fecha = new Date(fechaStr)
      if (isNaN(fecha.getTime())) return 'Sin fecha'
      
      // Formatear de manera consistente sin depender de localización
      const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
      const dia = fecha.getDate()
      const mes = meses[fecha.getMonth()]
      const año = fecha.getFullYear()
      
      return `${dia} ${mes} ${año}`
    } catch {
      return 'Sin fecha'
    }
  }

  // Función para obtener el resumen del boletín
  const getBoletinResumen = (boletinId: number): string => {
    // Durante SSR o antes de que se monte el componente, devolver un placeholder consistente
    // para evitar diferencias entre servidor y cliente
    if (!mounted || !boletinesLoaded) {
      return 'Cargando...'
    }
    
    const boletin = boletinesData.find((b: any) => b.id === boletinId)
    if (!boletin) return 'Boletín no encontrado'
    
    const fecha = formatFecha(boletin.fecha_publicacion)
    const proyectos = boletin.cantidad_ingresados || 0
    const resolutivos = boletin.cantidad_resolutivos || 0
    
    return `${fecha} • ${proyectos} proyectos • ${resolutivos} resolutivos`
  }

  // Función para obtener el boletín completo
  const getBoletin = (boletinId: number) => {
    if (!mounted || !boletinesLoaded) return null
    return boletinesData.find((b: any) => b.id === boletinId)
  }

  // Aplicar filtros externos cuando cambien
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

  // Resaltar fila seleccionada (sin filtrar: se mantienen todas las filas visibles)
  useEffect(() => {
    if (!highlightExpediente || typeof highlightExpediente !== 'string') return
    setHighlight(highlightExpediente)
    // Scroll suave a la fila resaltada
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

  // Función para manejar el ordenamiento
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Si ya está ordenando por este campo, cambiar dirección
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Si es un nuevo campo, ordenar descendente por defecto
      setSortField(field)
      setSortDirection("desc")
    }
    setPage(0) // Resetear a la primera página al ordenar
  }

  // Función genérica para ordenar (tipos relajados para soportar campos dinámicos)
  const sortItems = (
    items: any[],
    field: string | null,
    direction: "asc" | "desc",
  ): any[] => {
    if (!field) {
      // Si no hay campo de ordenamiento, ordenar por fecha de ingreso descendente (comportamiento por defecto)
      return sortByDate(items)
    }

    return [...items].sort((a, b) => {
      const aValue: any = a[field]
      const bValue: any = b[field]

      // Manejar valores nulos/undefined
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1

      // Ordenamiento especial para fechas
      if (field.includes("fecha")) {
        try {
          const dateA = String(aValue).includes("/") 
            ? new Date(String(aValue).split("/").reverse().join("-"))
            : new Date(String(aValue))
          const dateB = String(bValue).includes("/")
            ? new Date(String(bValue).split("/").reverse().join("-"))
            : new Date(String(bValue))
          
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0
          const diff = dateA.getTime() - dateB.getTime()
          return direction === "asc" ? diff : -diff
        } catch {
          return 0
        }
      }

      // Ordenamiento para números
      if (typeof aValue === "number" && typeof bValue === "number") {
        const diff = aValue - bValue
        return direction === "asc" ? diff : -diff
      }

      // Ordenamiento para strings
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
      
      if (yearFilter !== "all") {
        const parts = getCalendarParts(proyecto.fecha_publicacion)
        matchesYear = parts?.year === yearFilter
      }

      if (monthFilter !== "all") {
        const parts = getCalendarParts(proyecto.fecha_publicacion)
        matchesMonth = parts?.month === monthFilter
      }

      return matchesSearch && matchesMunicipio && matchesGiro && matchesTipo && matchesYear && matchesMonth
    })
    return sortItems(
      filtered,
      sortField || "fecha_publicacion",
      sortDirection,
    ) as Proyecto[]
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
      
      if (yearFilter !== "all") {
        const parts = getCalendarParts(resolutivo.fecha_publicacion)
        matchesYear = parts?.year === yearFilter
      }

      if (monthFilter !== "all") {
        const parts = getCalendarParts(resolutivo.fecha_publicacion)
        matchesMonth = parts?.month === monthFilter
      }

      return matchesSearch && matchesMunicipio && matchesGiro && matchesTipo && matchesYear && matchesMonth
    })
    return sortItems(
      filtered,
      sortField || "fecha_resolutivo",
      sortDirection,
    ) as Resolutivo[]
  }, [resolutivos, search, municipioFilter, giroFilter, tipoFilter, yearFilter, monthFilter, sortField, sortDirection])

  const handleTabChange = (event: React.SyntheticEvent, newValue: "proyectos" | "resolutivos") => {
    setActiveTab(newValue)
    setPage(0)
    setSortField(
      newValue === "proyectos" ? "fecha_publicacion" : "fecha_resolutivo",
    )
    setSortDirection("desc")
  }
  const handleChangePage = (event: unknown, newPage: number) => setPage(newPage)
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0) }

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

  // Componente para header de columna ordenable
  const SortableHeader = ({ field, label }: { field: string; label: string }) => {
    const isActive = sortField === field
    return (
      <TableCell 
        sx={{ 
          fontWeight: 'bold', 
          fontSize: '14px',
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
        }}
        onClick={() => handleSort(field)}
        role="columnheader"
        aria-sort={isActive ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {label}
          {isActive ? (
            sortDirection === "asc" ? (
              <ArrowUpward sx={{ fontSize: 16 }} />
            ) : (
              <ArrowDownward sx={{ fontSize: 16 }} />
            )
          ) : (
            <Box sx={{ width: 16, height: 16, opacity: 0.3 }}>
              <ArrowDownward sx={{ fontSize: 16 }} />
            </Box>
          )}
        </Box>
      </TableCell>
    )
  }

  const getAvailableYears = () => {
    const allItems = activeTab === "proyectos" ? proyectos : resolutivos
    const years = new Set<string>()
    allItems.forEach((item) => {
      const parts = getCalendarParts(item.fecha_publicacion)
      if (parts?.year) years.add(parts.year)
    })
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'autorizado':
        return 'success'
      case 'en proceso':
        return 'warning'
      case 'rechazado':
        return 'error'
      default:
        return 'default'
    }
  }

  if (!proyectos || !resolutivos || !Array.isArray(proyectos) || !Array.isArray(resolutivos)) {
    return (
      <StyledCard elevation={0}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" component="h3" fontWeight="semibold" color="text.primary">
            Proyectos y Resolutivos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No hay datos disponibles para mostrar
          </Typography>
        </CardContent>
      </StyledCard>
    )
  }

  const filtersContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { md: 'center' },
        flexWrap: { md: 'wrap' },
        gap: 2,
        p: 2,
        minWidth: 320,
      }}
    >
      <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 120 } }}>
        <InputLabel>Municipio</InputLabel>
        <Select value={municipioFilter} label="Municipio" onChange={(e) => setMunicipioFilter(e.target.value)}>
          <MenuItem value="all">Todos</MenuItem>
          {municipios.map(municipio => (<MenuItem key={municipio} value={municipio}>{municipio}</MenuItem>))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 120 } }}>
        <InputLabel>Giro</InputLabel>
        <Select value={giroFilter} label="Giro" onChange={(e) => setGiroFilter(e.target.value)}>
          <MenuItem value="all">Todos</MenuItem>
          {giros.map(giro => (<MenuItem key={giro} value={giro}>{giro}</MenuItem>))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 140 } }}>
        <InputLabel>Tipo Estudio</InputLabel>
        <Select value={tipoFilter} label="Tipo" onChange={(e) => setTipoFilter(e.target.value)}>
          <MenuItem value="all">Todos</MenuItem>
          {tiposEstudio.map(tipo => (<MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 90 } }}>
        <InputLabel>Año</InputLabel>
        <Select value={yearFilter} label="Año" onChange={(e) => setYearFilter(e.target.value)}>
          <MenuItem value="all">Todos</MenuItem>
          {getAvailableYears().map(year => (<MenuItem key={year} value={year}>{year}</MenuItem>))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 90 } }}>
        <InputLabel>Mes</InputLabel>
        <Select value={monthFilter} label="Mes" onChange={(e) => setMonthFilter(e.target.value)}>
          <MenuItem value="all">Todos</MenuItem>
          {getAvailableMonths().map(month => (<MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>))}
        </Select>
      </FormControl>
      <Button variant="contained" color="error" onClick={clearFilters} size="small" sx={{ width: { xs: '100%', md: 'auto' }, minWidth: { md: 'auto' } }}>
        Limpiar filtros
      </Button>
    </Box>
  )

  return (
    <StyledCard elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 }, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 }, flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Filtros flotantes (Popover) cuando hay anchor ref */}
          <Popover
            open={showFiltersPanel}
            anchorEl={filterAnchorRef?.current ?? localFilterButtonRef.current}
            onClose={onCloseFilters ?? (() => {})}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            slotProps={{ paper: { sx: { mt: 1.5, boxShadow: 3, borderRadius: 2 } } }}
          >
            {filtersContent}
          </Popover>
          <Box sx={{ flexShrink: 0 }}>
            <Typography 
              variant="h6" 
              component="h3" 
              fontWeight="semibold" 
              color="text.primary"
              sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              Consulta boletines oficiales, proyectos ingresados y resolutivos emitidos por la Secretaría de Medio Ambiente.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              flexShrink: 0,
            }}
          >
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              placeholder="Buscar por promovente, proyecto, expediente..."
              sx={{
                flex: 1,
                minWidth: { xs: '100%', sm: 280 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: '999px',
                  backgroundColor: '#fff',
                },
              }}
            />
            <IconButton
              ref={localFilterButtonRef}
              onClick={() => {
                if (onToggleFilters) {
                  onToggleFilters()
                } else {
                  setShowMobileFilters((v) => !v)
                }
              }}
              sx={{
                border: '1px solid',
                borderColor: 'rgba(0, 0, 0, 0.16)',
                borderRadius: '999px',
                width: 40,
                height: 40,
                color: 'text.secondary',
                flexShrink: 0,
              }}
              aria-label={showFiltersPanel ? "Ocultar filtros" : "Mostrar filtros"}
              title={showFiltersPanel ? "Ocultar filtros" : "Mostrar filtros"}
            >
              <FilterList />
            </IconButton>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="proyectos y resolutivos tabs">
              <Tab label={`Proyectos (${filteredProyectos.length})`} value="proyectos" />
              <Tab label={`Resolutivos (${filteredResolutivos.length})`} value="resolutivos" />
            </Tabs>
          </Box>

          {/* Tabla: solo esta parte hace scroll vertical */}
          <TableContainer 
            component={Paper} 
            elevation={0} 
            sx={{ 
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'auto',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <Table size="small" sx={{ minWidth: { xs: 800, md: 'auto' } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(30, 58, 138, 0.05)' }}>
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
                </TableRow>
              </TableHead>
              <TableBody>
                {activeTab === "proyectos" ? (
                  paginatedProyectos.map((proyecto, index) => (
                    <TableRow
                      key={`${proyecto.expediente || 'unknown'}-${proyecto.boletin_id || 'unknown'}-${index}`}
                      id={`row-${proyecto.expediente}`}
                      hover
                      onClick={() => {
                        if (onSelectItem) {
                          onSelectItem(proyecto)
                        } else {
                          handleRowClick(proyecto)
                        }
                      }}
                      sx={{
                        height: `${fixedRowHeight}px`,
                        cursor: onSelectItem
                          ? 'pointer'
                          : proyecto.coordenadas_x && proyecto.coordenadas_y
                          ? 'pointer'
                          : 'default',
                        '&:hover': {
                          backgroundColor:
                            highlight === proyecto.expediente
                              ? 'rgba(246, 150, 80, 0.24)'
                              : 'rgba(0, 0, 0, 0.03)',
                        },
                        backgroundColor:
                          highlight === proyecto.expediente
                            ? 'rgba(246, 150, 80, 0.18)'
                            : 'inherit',
                        outline:
                          highlight === proyecto.expediente
                            ? '2px solid rgba(2, 57, 35, 0.35)'
                            : 'none',
                      }}
                    >
                      <TableCell sx={{ ...compactCellSx, whiteSpace: 'nowrap' }}>{proyecto.expediente || 'N/A'}</TableCell>
                      <TableCell sx={{ 
                        ...truncatedCellSx,
                        maxWidth: { xs: 150, sm: 260, md: 320 },
                      }}>
                        {proyecto.nombre_proyecto || 'N/A'}
                      </TableCell>
                      <TableCell sx={{ 
                        ...truncatedCellSx,
                        maxWidth: { xs: 100, sm: 150, md: 180 },
                      }}>
                        {proyecto.promovente || 'N/A'}
                      </TableCell>
                      <TableCell
                        sx={{
                          ...compactCellSx,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {proyecto.tipo_estudio ? (
                          <Chip
                            label={proyecto.tipo_estudio}
                            size="small"
                            sx={{
                              fontSize: '14px',
                              fontWeight: 600,
                              borderRadius: '999px',
                              bgcolor:
                                proyecto.tipo_estudio.toLowerCase() === 'mia'
                                  ? 'var(--color-section-accent)'
                                  : 'rgba(148, 163, 184, 0.1)',
                              color:
                                proyecto.tipo_estudio.toLowerCase() === 'mia'
                                  ? 'var(--color-section-text)'
                                  : 'rgb(30, 64, 175)',
                            }}
                          />
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell sx={{ ...compactCellSx, whiteSpace: 'nowrap' }}>{proyecto.fecha_ingreso || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  paginatedResolutivos.map((resolutivo, index) => (
                    <TableRow
                      key={`${resolutivo.no_oficio_resolutivo || 'unknown'}-${resolutivo.boletin_id || 'unknown'}-${index}`}
                      hover
                      onClick={() => {
                        if (onSelectItem) {
                          onSelectItem(resolutivo)
                        } else {
                          handleRowClick(resolutivo)
                        }
                      }}
                      sx={{
                        height: `${fixedRowHeight}px`,
                        cursor: onSelectItem
                          ? 'pointer'
                          : resolutivo.coordenadas_x && resolutivo.coordenadas_y
                          ? 'pointer'
                          : 'default',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.03)',
                        },
                      }}
                    >
                      <TableCell sx={{ ...compactCellSx, whiteSpace: 'nowrap' }}>{resolutivo.no_oficio_resolutivo || 'N/A'}</TableCell>
                      <TableCell sx={{ ...compactCellSx, whiteSpace: 'nowrap' }}>{resolutivo.expediente || 'N/A'}</TableCell>
                      <TableCell sx={{ 
                        ...truncatedCellSx,
                        maxWidth: { xs: 150, sm: 260, md: 320 },
                      }}>
                        {resolutivo.nombre_proyecto || 'N/A'}
                      </TableCell>
                      <TableCell sx={{ 
                        ...truncatedCellSx,
                        maxWidth: { xs: 100, sm: 150, md: 180 },
                      }}>
                        {resolutivo.promovente || 'N/A'}
                      </TableCell>
                      <TableCell sx={{ ...compactCellSx, whiteSpace: 'nowrap' }}>{resolutivo.fecha_ingreso || 'N/A'}</TableCell>
                      <TableCell sx={{ ...compactCellSx, whiteSpace: 'nowrap' }}>{resolutivo.fecha_resolutivo || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ flexShrink: 0 }}>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={activeTab === "proyectos" ? filteredProyectos.length : filteredResolutivos.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
            sx={{
              '& .MuiTablePagination-toolbar': {
                flexWrap: 'wrap',
                gap: { xs: 1, sm: 0 }
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '14px'
              }
            }}
          />
          </Box>
        </Box>
      </CardContent>
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
    </StyledCard>
  )
}


