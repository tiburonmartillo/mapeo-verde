
import { useState, useMemo, useEffect } from "react"
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  TextField, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TablePagination,
  Button,
  Tooltip
} from "@mui/material"
import { Clear, OpenInNew } from "@mui/icons-material"
import { styled } from "@mui/material/styles"
import type { ProyectoGacetaProcessed, ResolutivoGacetaProcessed } from "../hooks/useGacetasData"
import { useGacetaModal } from "../hooks/useGacetaModal"
import { GacetaModal } from "./gaceta-modal"

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '12px',
  border: '1px solid rgba(30, 58, 138, 0.1)',
  transition: 'box-shadow 0.2s ease-in-out',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
}))

interface MuiGacetasProjectsTableProps {
  proyectos: ProyectoGacetaProcessed[]
  resolutivos: ResolutivoGacetaProcessed[]
}

export function MuiGacetasProjectsTable({ proyectos, resolutivos }: MuiGacetasProjectsTableProps) {
  const [activeTab, setActiveTab] = useState<"proyectos" | "resolutivos">("proyectos")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [mounted, setMounted] = useState(false)

  // Hook para modal de gaceta con routing
  const { isOpen: isGacetaModalOpen, selectedGaceta, selectedRegistro, openModal: openGacetaModal, openModalByUrl, openModalWithRegistro, closeModal: closeGacetaModal } = useGacetaModal()

  // Evitar hidratación: solo renderizar contenido dependiente de datos asíncronos después de montar
  useEffect(() => {
    setMounted(true)
  }, [])


  const currentData = activeTab === "proyectos" ? proyectos : resolutivos

  // Crear mapa de resolutivos por proyecto_ingresado_id y por clave para búsqueda rápida
  const resolutivosPorProyectoId = useMemo(() => {
    const mapa = new Map<number, ResolutivoGacetaProcessed[]>()
    resolutivos.forEach(resolutivo => {
      if (resolutivo.proyecto_ingresado_id) {
        if (!mapa.has(resolutivo.proyecto_ingresado_id)) {
          mapa.set(resolutivo.proyecto_ingresado_id, [])
        }
        mapa.get(resolutivo.proyecto_ingresado_id)!.push(resolutivo)
      }
    })
    return mapa
  }, [resolutivos])

  const resolutivosPorClave = useMemo(() => {
    const mapa = new Map<string, ResolutivoGacetaProcessed[]>()
    resolutivos.forEach(resolutivo => {
      const clave = resolutivo.clave
      if (!mapa.has(clave)) {
        mapa.set(clave, [])
      }
      mapa.get(clave)!.push(resolutivo)
    })
    return mapa
  }, [resolutivos])

  // Filtrar datos
  const filteredData = useMemo(() => {
    let result = currentData

    // Filtro de búsqueda
    if (search.trim()) {
      const query = search.toLowerCase()
      result = result.filter(item => 
        item.clave?.toLowerCase().includes(query) ||
        item.promovente?.toLowerCase().includes(query) ||
        item.proyecto?.toLowerCase().includes(query) ||
        item.municipio?.toLowerCase().includes(query) ||
        item.modalidad?.toLowerCase().includes(query)
      )
    }

    return result.sort((a, b) => {
      // Para proyectos ingresados, ordenar por fecha_publicacion (gaceta) o fecha_ingreso
      // Para resolutivos, ordenar por fecha_resolucion o fecha_publicacion
      let dateA: number
      let dateB: number
      
      if (activeTab === "proyectos") {
        // Para proyectos: usar fecha_publicacion (gaceta) como principal, fecha_ingreso como fallback
        const fechaA = a.fecha_publicacion || a.fecha_ingreso || ''
        const fechaB = b.fecha_publicacion || b.fecha_ingreso || ''
        dateA = new Date(fechaA).getTime()
        dateB = new Date(fechaB).getTime()
      } else {
        // Para resolutivos: usar fecha_resolucion como principal, fecha_publicacion como fallback
        const resolutivoA = a as ResolutivoGacetaProcessed
        const resolutivoB = b as ResolutivoGacetaProcessed
        const fechaA = resolutivoA.fecha_resolucion || resolutivoA.fecha_publicacion || resolutivoA.fecha_ingreso || ''
        const fechaB = resolutivoB.fecha_resolucion || resolutivoB.fecha_publicacion || resolutivoB.fecha_ingreso || ''
        dateA = new Date(fechaA).getTime()
        dateB = new Date(fechaB).getTime()
      }
      
      // Ordenar de más reciente a más antigua (descendente)
      return dateB - dateA
    })
  }, [currentData, search, activeTab])

  // Paginación
  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage
    return filteredData.slice(start, start + rowsPerPage)
  }, [filteredData, page, rowsPerPage])

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  return (
    <StyledCard elevation={0}>
      <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="h6" 
            component="h3" 
            fontWeight="semibold" 
            color="text.primary"
            className="text-base sm:text-lg mb-1"
          >
            Ingresados y Resolutivos
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            className="text-xs"
          >
            Proyectos ingresados y resolutivos emitidos en las gacetas
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => {
              setActiveTab(newValue)
              setPage(0)
              setSearch("")
            }}
            sx={{ minHeight: 'auto' }}
          >
            <Tab 
              label={`Ingresados (${proyectos.length})`} 
              value="proyectos"
              className="text-xs"
              sx={{ minHeight: 'auto', py: 1.5 }}
            />
            <Tab 
              label={`Resolutivos (${resolutivos.length})`} 
              value="resolutivos"
              className="text-xs"
              sx={{ minHeight: 'auto', py: 1.5 }}
            />
          </Tabs>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder={`Buscar por clave, promovente, proyecto...`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            size="small"
            sx={{ flex: 1 }}
          />

          {search !== "" && (
            <Button
              startIcon={<Clear />}
              onClick={() => {
                setSearch("")
                setPage(0)
              }}
              size="small"
              variant="outlined"
            >
              Limpiar
            </Button>
          )}
        </Box>

        {/* Table */}
        <TableContainer sx={{ maxHeight: '600px', overflowX: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell className="text-xs sm:text-sm font-bold">
                  Clave
                </TableCell>
                <TableCell className="text-xs sm:text-sm font-bold">
                  Promovente
                </TableCell>
                <TableCell className="text-xs sm:text-sm font-bold" sx={{ minWidth: 200 }}>
                  Proyecto
                </TableCell>
                <TableCell className="text-xs sm:text-sm font-bold">
                  Modalidad
                </TableCell>
                <TableCell className="text-xs sm:text-sm font-bold">
                  Municipio
                </TableCell>
                {activeTab === "proyectos" ? (
                  <>
                    <TableCell className="text-xs sm:text-sm font-bold">
                      Fecha Ingreso
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm font-bold">
                      Fecha Gaceta
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm font-bold">
                      Resolutivos
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="text-xs sm:text-sm font-bold">
                      Fecha Ingreso
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm font-bold">
                      Fecha Resolución
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm font-bold">
                      Vínculo
                    </TableCell>
                  </>
                )}
                <TableCell className="text-xs sm:text-sm font-bold">
                  Gaceta
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeTab === "proyectos" ? 8 : 7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No se encontraron {activeTab === "proyectos" ? "ingresados" : "resolutivos"} que coincidan con los filtros
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item, index) => (
                  <TableRow 
                    key={`${item.clave}-${index}`} 
                    hover
                    onClick={() => {
                      if (item.id_db) {
                        openModalWithRegistro(item.gaceta_url, item.id_db)
                      }
                    }}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    <TableCell className="text-xs sm:text-sm">
                      {item.clave || 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm" sx={{ maxWidth: 150 }}>
                      <Typography
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.promovente || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm" sx={{ maxWidth: 300 }}>
                      <Typography
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.proyecto || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      <Chip label={item.modalidad || 'N/A'} size="small" />
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {item.municipio || 'N/A'}
                    </TableCell>
                    {activeTab === "proyectos" ? (
                      <>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                          {item.fecha_ingreso || 'N/A'}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                          {new Date(item.fecha_publicacion).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {(() => {
                            const proyectoItem = item as ProyectoGacetaProcessed
                            const resolutivosRelacionados = 
                              resolutivosPorProyectoId.get(proyectoItem.id_db) || 
                              resolutivosPorClave.get(proyectoItem.clave) || 
                              []
                            
                            if (resolutivosRelacionados.length === 0) {
                              return (
                                <Chip label="Sin resolutivos" size="small" variant="outlined" className="text-xs" />
                              )
                            }
                            
                            return (
                              <Tooltip 
                                title={
                                  <Box>
                                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>
                                      Resolutivos relacionados ({resolutivosRelacionados.length}):
                                    </Typography>
                                    {resolutivosRelacionados.map((res, idx) => {
                                      const fechaResolucion = res.fecha_resolucion 
                                        ? new Date(res.fecha_resolucion).toLocaleDateString('es-MX', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                          })
                                        : 'N/A'
                                      return (
                                        <Typography key={idx} variant="caption" sx={{ display: 'block' }}>
                                          • {fechaResolucion}
                                        </Typography>
                                      )
                                    })}
                                  </Box>
                                }
                              >
                                <Chip 
                                  label={`${resolutivosRelacionados.length} resolutivo${resolutivosRelacionados.length > 1 ? 's' : ''}`}
                                  size="small" 
                                  color="success"
                                  className="text-xs sm:text-sm cursor-help"
                                />
                              </Tooltip>
                            )
                          })()}
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                          {item.fecha_ingreso || 'N/A'}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                          {(item as ResolutivoGacetaProcessed).fecha_resolucion || 'N/A'}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {(() => {
                            const resolutivoItem = item as ResolutivoGacetaProcessed
                            if (resolutivoItem.gaceta_ingreso_url) {
                              return (
                                <Tooltip 
                                  title={
                                    <Box>
                                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold' }}>
                                        Proyecto relacionado encontrado
                                      </Typography>
                                      <Typography variant="caption" sx={{ display: 'block' }}>
                                        Clave: {resolutivoItem.clave}
                                      </Typography>
                                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                        Consultar gaceta de ingreso
                                      </Typography>
                                    </Box>
                                  }
                                >
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="success"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      window.open(resolutivoItem.gaceta_ingreso_url!, '_blank', 'noopener,noreferrer')
                                    }}
                                    className="text-xs"
                  sx={{ minWidth: 'auto', px: 1 }}
                                  >
                                    📄 Ingreso
                                  </Button>
                                </Tooltip>
                              )
                            } else {
                              return (
                                <Tooltip title="No se encontró el proyecto ingresado relacionado para este resolutivo">
                                  <Chip label="Sin vínculo" size="small" variant="outlined" className="text-xs" />
                                </Tooltip>
                              )
                            }
                          })()}
                        </TableCell>
                      </>
                    )}
                    <TableCell className="text-xs sm:text-sm">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<OpenInNew />}
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(item.gaceta_url, '_blank', 'noopener,noreferrer')
                        }}
                        className="text-xs"
                      >
                        Consultar Gaceta
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredData.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </CardContent>

      {/* Modal de resumen de gaceta */}
      {mounted && (
        <GacetaModal 
          gaceta={selectedGaceta}
          registro={selectedRegistro}
          isOpen={isGacetaModalOpen} 
          onClose={closeGacetaModal} 
        />
      )}
    </StyledCard>
  )
}

