
import { useState, useMemo, useEffect } from "react"
import { X, ExternalLink } from "lucide-react"
import type { ProyectoGacetaProcessed, ResolutivoGacetaProcessed } from "../hooks/useGacetasData"
import { useGacetaModal } from "../hooks/useGacetaModal"
import { GacetaModal } from "./gaceta-modal"

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

  const { isOpen: isGacetaModalOpen, selectedGaceta, selectedRegistro, openModal: openGacetaModal, openModalByUrl, openModalWithRegistro, closeModal: closeGacetaModal } = useGacetaModal()

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentData = activeTab === "proyectos" ? proyectos : resolutivos

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

  const filteredData = useMemo(() => {
    let result = currentData
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
      let dateA: number
      let dateB: number
      if (activeTab === "proyectos") {
        const fechaA = a.fecha_publicacion || a.fecha_ingreso || ''
        const fechaB = b.fecha_publicacion || b.fecha_ingreso || ''
        dateA = new Date(fechaA).getTime()
        dateB = new Date(fechaB).getTime()
      } else {
        const resolutivoA = a as ResolutivoGacetaProcessed
        const resolutivoB = b as ResolutivoGacetaProcessed
        const fechaA = resolutivoA.fecha_resolucion || resolutivoA.fecha_publicacion || resolutivoA.fecha_ingreso || ''
        const fechaB = resolutivoB.fecha_resolucion || resolutivoB.fecha_publicacion || resolutivoB.fecha_ingreso || ''
        dateA = new Date(fechaA).getTime()
        dateB = new Date(fechaB).getTime()
      }
      return dateB - dateA
    })
  }, [currentData, search, activeTab])

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage
    return filteredData.slice(start, start + rowsPerPage)
  }, [filteredData, page, rowsPerPage])

  const handleChangePage = (newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  return (
    <div className="rounded-xl border border-blue-900/10 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="px-4 py-4 sm:px-6 md:px-8">
        <div className="mb-4">
          <h3 className="mb-1 text-base font-semibold text-gray-900 sm:text-lg">
            Ingresados y Resolutivos
          </h3>
          <p className="text-xs text-gray-500">
            Proyectos ingresados y resolutivos emitidos en las gacetas
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-4 border-b border-gray-200">
          <div className="flex gap-0">
            <button
              onClick={() => { setActiveTab("proyectos"); setPage(0); setSearch("") }}
              className={`px-4 py-1.5 text-xs transition-colors ${
                activeTab === "proyectos"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Ingresados ({proyectos.length})
            </button>
            <button
              onClick={() => { setActiveTab("resolutivos"); setPage(0); setSearch("") }}
              className={`px-4 py-1.5 text-xs transition-colors ${
                activeTab === "resolutivos"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Resolutivos ({resolutivos.length})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-2 md:flex-row">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder="Buscar por clave, promovente, proyecto..."
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
          {search !== "" && (
            <button
              onClick={() => { setSearch(""); setPage(0) }}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              Limpiar
            </button>
          )}
        </div>

        {/* Table */}
        <div className="max-h-[600px] overflow-auto border border-gray-200" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full">
            <thead>
              <tr className="bg-blue-900/5">
                <th className="px-3 py-2 text-left text-xs font-bold sm:text-sm">Clave</th>
                <th className="px-3 py-2 text-left text-xs font-bold sm:text-sm">Promovente</th>
                <th className="min-w-[200px] px-3 py-2 text-left text-xs font-bold sm:text-sm">Proyecto</th>
                <th className="px-3 py-2 text-left text-xs font-bold sm:text-sm">Modalidad</th>
                <th className="px-3 py-2 text-left text-xs font-bold sm:text-sm">Municipio</th>
                {activeTab === "proyectos" ? (
                  <>
                    <th className="px-3 py-2 text-left text-xs font-bold sm:text-sm">Fecha Ingreso</th>
                    <th className="px-3 py-2 text-left text-xs font-bold sm:text-sm">Fecha Gaceta</th>
                    <th className="px-3 py-2 text-left text-xs font-bold sm:text-sm">Resolutivos</th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-2 text-left text-xs font-bold sm:text-sm">Fecha Ingreso</th>
                    <th className="px-3 py-2 text-left text-xs font-bold sm:text-sm">Fecha Resolución</th>
                    <th className="px-3 py-2 text-left text-xs font-bold sm:text-sm">Vínculo</th>
                  </>
                )}
                <th className="px-3 py-2 text-left text-xs font-bold sm:text-sm">Gaceta</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "proyectos" ? 8 : 7} className="px-3 py-8 text-center text-sm text-gray-500">
                    No se encontraron {activeTab === "proyectos" ? "ingresados" : "resolutivos"} que coincidan con los filtros
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr
                    key={`${item.clave}-${index}`}
                    onClick={() => {
                      if (item.id_db) {
                        openModalWithRegistro(item.gaceta_url, item.id_db)
                      }
                    }}
                    className="cursor-pointer border-b border-gray-100 text-xs transition-colors hover:bg-black/[0.04] sm:text-sm"
                  >
                    <td className="px-3 py-2">{item.clave || 'N/A'}</td>
                    <td className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap px-3 py-2" title={item.promovente || ''}>{item.promovente || 'N/A'}</td>
                    <td className="max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap px-3 py-2" title={item.proyecto || ''}>{item.proyecto || 'N/A'}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                        {item.modalidad || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-2">{item.municipio || 'N/A'}</td>
                    {activeTab === "proyectos" ? (
                      <>
                        <td className="whitespace-nowrap px-3 py-2">{item.fecha_ingreso || 'N/A'}</td>
                        <td className="whitespace-nowrap px-3 py-2">
                          {new Date(item.fecha_publicacion).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-3 py-2">
                          {(() => {
                            const proyectoItem = item as ProyectoGacetaProcessed
                            const resolutivosRelacionados = 
                              resolutivosPorProyectoId.get(proyectoItem.id_db) || 
                              resolutivosPorClave.get(proyectoItem.clave) || 
                              []
                            if (resolutivosRelacionados.length === 0) {
                              return (
                                <span className="inline-flex items-center rounded-full border border-gray-300 px-2 py-0.5 text-xs text-gray-500">
                                  Sin resolutivos
                                </span>
                              )
                            }
                            const tooltipContent = `Resolutivos relacionados (${resolutivosRelacionados.length}):\n${resolutivosRelacionados.map(r => {
                              const fecha = r.fecha_resolucion 
                                ? new Date(r.fecha_resolucion).toLocaleDateString('es-MX', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })
                                : 'N/A'
                              return `• ${fecha}`
                            }).join('\n')}`
                            return (
                              <span
                                title={tooltipContent}
                                className="inline-flex cursor-help items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800"
                              >
                                {resolutivosRelacionados.length} resolutivo{resolutivosRelacionados.length > 1 ? 's' : ''}
                              </span>
                            )
                          })()}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="whitespace-nowrap px-3 py-2">{item.fecha_ingreso || 'N/A'}</td>
                        <td className="whitespace-nowrap px-3 py-2">{(item as ResolutivoGacetaProcessed).fecha_resolucion || 'N/A'}</td>
                        <td className="px-3 py-2">
                          {(() => {
                            const resolutivoItem = item as ResolutivoGacetaProcessed
                            if (resolutivoItem.gaceta_ingreso_url) {
                              return (
                                <button
                                  title="Proyecto relacionado encontrado"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(resolutivoItem.gaceta_ingreso_url!, '_blank', 'noopener,noreferrer')
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-green-600 px-2 py-1 text-xs text-green-700 hover:bg-green-50"
                                >
                                  📄 Ingreso
                                </button>
                              )
                            } else {
                              return (
                                <span
                                  title="No se encontró el proyecto ingresado relacionado para este resolutivo"
                                  className="inline-flex items-center rounded-full border border-gray-300 px-2 py-0.5 text-xs text-gray-500"
                                >
                                  Sin vínculo
                                </span>
                              )
                            }
                          })()}
                        </td>
                      </>
                    )}
                    <td className="px-3 py-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(item.gaceta_url, '_blank', 'noopener,noreferrer')
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Consultar Gaceta
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Filas por página:</span>
            <select
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>
              {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, filteredData.length)} de {filteredData.length}
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
              disabled={(page + 1) * rowsPerPage >= filteredData.length}
              className="rounded px-2 py-1 text-sm hover:bg-gray-100 disabled:opacity-30"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {mounted && (
        <GacetaModal 
          gaceta={selectedGaceta}
          registro={selectedRegistro}
          isOpen={isGacetaModalOpen} 
          onClose={closeGacetaModal} 
        />
      )}
    </div>
  )
}
