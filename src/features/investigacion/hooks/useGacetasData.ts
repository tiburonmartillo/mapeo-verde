import { useState, useEffect } from 'react'
import { getInvestigacionClient } from '../lib/supabase-data'

export interface RegistroGaceta {
  id: string
  clave_proyecto: string
  tipo_registro: string
  seccion_documento: string
  entidad: string
  municipio: string
  proyecto_nombre: string
  promovente: string
  modalidad: string
  tipo_proyecto: string
  fecha_ingreso: string | null
  fecha_resolucion: string | null
  estatus: string | null
  vigencia: {
    construccion_anios: number | null
    operacion_anios: number | null
    texto_completo: string | null
  } | null
  superficie: {
    total_m2: number | null
    total_hectareas: number | null
    cambio_uso_suelo_m2: number | null
    cambio_uso_suelo_hectareas: number | null
  } | null
  vegetacion: {
    tipo: string | null
    remocion: string | null
  } | null
  ubicacion_especifica: string | null
  descripcion: string | null
  cambio_uso_suelo: boolean | null
  areas_forestales: boolean | null
  observaciones: string | null
  id_db: number
  proyecto_ingresado_id: number | null
  resolutivos_ids: number[]
  gaceta_id: string
  semarnat_data?: any | null
  semarnat_historial?: any | null
}

export interface ProyectoIngresado {
  id_db: number
  entidad: string
  municipio: string
  clave: string
  promovente: string
  proyecto: string
  modalidad: string
  fecha_ingreso: string
  descripcion?: string
}

export interface ResolutivoEmitido {
  id_db: number
  entidad: string
  municipio: string
  clave: string
  promovente: string
  proyecto: string
  modalidad: string
  fecha_ingreso: string
  fecha_resolucion: string
  vigencia?: string
  proyecto_ingresado_id: number | null
}

export interface AnalisisCompleto {
  gaceta: {
    numero: string
    fecha_publicacion: string
    anio: number
  }
  resumen: {
    total_registros: number
    proyectos_ingresados: number
    resolutivos_emitidos: number
    tramites_unificados: number
    consultas_publicas: number
    hectareas_totales: number
  }
  registros: RegistroGaceta[]
}

export interface GacetaAnalysis {
  url: string
  año: number
  gaceta_id: string
  fecha_publicacion: string | null
  palabras_clave_encontradas: string[]
  paginas: number[]
  secciones: string[] | null
  analisis_completo: AnalisisCompleto | null
  resumen: string | null
}

interface GacetasData {
  metadata: {
    created: string
    last_updated: string
    total_analyzed: number
    year_range: string
  }
  analyses: GacetaAnalysis[]
}

export interface ProcessedGacetaAnalysis extends Omit<GacetaAnalysis, 'fecha_publicacion'> {
  fecha_publicacion: string
}

export interface ProyectoGacetaProcessed extends ProyectoIngresado {
  fecha_publicacion: string
  gaceta_url: string
  gaceta_id: string
  resolutivos_ids?: number[]
}

export interface ResolutivoGacetaProcessed extends ResolutivoEmitido {
  fecha_publicacion: string
  gaceta_url: string
  gaceta_id: string
  gaceta_ingreso_url: string | null
}

interface ProcessedGacetasData {
  stats: {
    totalGacetas: number
    totalAnalyses: number
    municipios: string[]
    giros: string[]
    tiposEstudio: string[]
    totalProyectos: number
    totalResolutivos: number
  }
  timeSeriesData: Array<{
    fecha: string
    gacetas: number
  }>
  gacetas: ProcessedGacetaAnalysis[]
  proyectos: ProyectoGacetaProcessed[]
  resolutivos: ResolutivoGacetaProcessed[]
  metadata: {
    totalGacetas: number
    lastUpdated: string
  }
}

function normalizeDate(fecha: string | null, año: number): string {
  if (fecha) return fecha
  return `${año}-01-01`
}

export function useGacetasData() {
  const [data, setData] = useState<GacetasData | null>(null)
  const [processedData, setProcessedData] = useState<ProcessedGacetasData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const supabase = getInvestigacionClient()

        const { data: gacetasRows, error: gacetasError } = await supabase
          .from('gacetas')
          .select(`
            *,
            gacetas_registros(*)
          `)
          .order('fecha_publicacion', { ascending: false, nullsLast: true })

        if (gacetasError) throw new Error(gacetasError.message)

        if (!gacetasRows || gacetasRows.length === 0) {
          throw new Error('No se encontraron gacetas en la base de datos')
        }

        if (!isMounted) return

        // Reconstruct GacetasData-like structure for backward compat
        const analyses: GacetaAnalysis[] = gacetasRows.map((g: any) => {
          const registros: RegistroGaceta[] = (g.gacetas_registros || []).map((r: any) => ({
            id: r.registro_id || '',
            clave_proyecto: r.clave_proyecto || '',
            tipo_registro: r.tipo_registro || '',
            seccion_documento: r.seccion_documento || '',
            entidad: r.entidad || '',
            municipio: r.municipio || '',
            proyecto_nombre: r.proyecto_nombre || '',
            promovente: r.promovente || '',
            modalidad: r.modalidad || '',
            tipo_proyecto: r.tipo_proyecto || '',
            fecha_ingreso: r.fecha_ingreso || null,
            fecha_resolucion: r.fecha_resolucion || null,
            estatus: r.estatus || null,
            vigencia: r.vigencia,
            superficie: r.superficie,
            vegetacion: r.vegetacion,
            ubicacion_especifica: r.ubicacion_especifica || null,
            descripcion: r.descripcion || null,
            cambio_uso_suelo: r.cambio_uso_suelo,
            areas_forestales: r.areas_forestales,
            observaciones: r.observaciones || null,
            id_db: r.id_db,
            proyecto_ingresado_id: r.proyecto_ingresado_id,
            resolutivos_ids: r.resolutivos_ids || [],
            gaceta_id: g.gaceta_id,
            semarnat_data: r.semarnat_data,
            semarnat_historial: r.semarnat_historial,
          }))

          const ac: AnalisisCompleto | null = g.total_registros > 0 ? {
            gaceta: {
              numero: g.gaceta_numero || '',
              fecha_publicacion: g.gaceta_fecha_publicacion || g.fecha_publicacion || '',
              anio: g.gaceta_anio || g.año,
            },
            resumen: {
              total_registros: g.total_registros,
              proyectos_ingresados: g.proyectos_ingresados_count,
              resolutivos_emitidos: g.resolutivos_emitidos_count,
              tramites_unificados: g.tramites_unificados_count,
              consultas_publicas: g.consultas_publicas_count,
              hectareas_totales: g.hectareas_totales,
            },
            registros,
          } : null

          return {
            url: g.url,
            año: g.año,
            gaceta_id: g.gaceta_id,
            fecha_publicacion: g.fecha_publicacion || null,
            palabras_clave_encontradas: g.palabras_clave_encontradas || [],
            paginas: g.paginas || [],
            secciones: g.secciones || null,
            analisis_completo: ac,
            resumen: g.resumen || null,
          } as GacetaAnalysis
        })

        const meta: GacetasData['metadata'] = {
          created: analyses.length ? '2025-12-05T13:26:27.924186' : '',
          last_updated: '2026-01-19T00:48:05.505240',
          total_analyzed: analyses.length,
          year_range: analyses.length > 0
            ? `${Math.min(...analyses.map(a => a.año))}-${Math.max(...analyses.map(a => a.año))}`
            : `${new Date().getFullYear()}`,
        }
        const gacetasData: GacetasData = { metadata: meta, analyses }
        setData(gacetasData)

        // --- Processing (same logic as before, operating on DB data) ---

        const gacetasNormalizadas = analyses
          .filter(a => a.resumen !== null && a.analisis_completo !== null)
          .map(gaceta => ({
            ...gaceta,
            fecha_publicacion: normalizeDate(gaceta.fecha_publicacion, gaceta.año),
          }))
          .sort((a, b) => {
            const dateA = new Date(a.fecha_publicacion).getTime()
            const dateB = new Date(b.fecha_publicacion).getTime()
            return dateB - dateA
          })

        const registrosPorId = new Map<number, { registro: RegistroGaceta; gacetaUrl: string; fechaPublicacion: string }>()
        analyses.forEach(gaceta => {
          if (gaceta.analisis_completo?.registros) {
            const fechaNormalizada = normalizeDate(gaceta.fecha_publicacion, gaceta.año)
            gaceta.analisis_completo.registros.forEach(registro => {
              registrosPorId.set(registro.id_db, {
                registro,
                gacetaUrl: gaceta.url,
                fechaPublicacion: fechaNormalizada,
              })
            })
          }
        })

        const municipiosSet = new Set<string>()
        registrosPorId.forEach(({ registro }) => {
          if (registro.municipio) municipiosSet.add(registro.municipio)
        })

        const timeSeriesMap = new Map<string, number>()
        gacetasNormalizadas.forEach(gaceta => {
          const fecha = new Date(gaceta.fecha_publicacion)
          const mesAno = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
          timeSeriesMap.set(mesAno, (timeSeriesMap.get(mesAno) || 0) + 1)
        })
        const timeSeriesData = Array.from(timeSeriesMap.entries())
          .map(([fecha, count]) => ({ fecha, gacetas: count }))
          .sort((a, b) => a.fecha.localeCompare(b.fecha))

        const proyectos: ProyectoGacetaProcessed[] = []
        analyses.forEach(gaceta => {
          if (gaceta.analisis_completo?.registros) {
            const fechaNormalizada = normalizeDate(gaceta.fecha_publicacion, gaceta.año)
            gaceta.analisis_completo.registros.forEach(registro => {
              if (registro.tipo_registro === 'proyecto_ingresado' || registro.tipo_registro === 'tramite_unificado') {
                proyectos.push({
                  id_db: registro.id_db,
                  entidad: registro.entidad,
                  municipio: registro.municipio,
                  clave: registro.clave_proyecto,
                  promovente: registro.promovente,
                  proyecto: registro.proyecto_nombre,
                  modalidad: registro.modalidad,
                  fecha_ingreso: registro.fecha_ingreso || '',
                  descripcion: registro.descripcion || undefined,
                  fecha_publicacion: fechaNormalizada,
                  gaceta_url: gaceta.url,
                  gaceta_id: gaceta.gaceta_id,
                  resolutivos_ids: registro.resolutivos_ids || [],
                })
              }
            })
          }
        })

        const resolutivos: ResolutivoGacetaProcessed[] = []
        analyses.forEach(gaceta => {
          if (gaceta.analisis_completo?.registros) {
            const fechaNormalizada = normalizeDate(gaceta.fecha_publicacion, gaceta.año)
            gaceta.analisis_completo.registros.forEach(registro => {
              if (registro.tipo_registro === 'resolutivo_emitido') {
                let proyectoRelacionado: ProyectoGacetaProcessed | null = null
                let gacetaIngresoUrl: string | null = null

                if (registro.proyecto_ingresado_id) {
                  proyectoRelacionado = proyectos.find(p => p.id_db === registro.proyecto_ingresado_id) || null
                  if (!proyectoRelacionado) {
                    const registroProyecto = registrosPorId.get(registro.proyecto_ingresado_id)
                    if (registroProyecto && registroProyecto.registro.tipo_registro === 'proyecto_ingresado') {
                      gacetaIngresoUrl = registroProyecto.gacetaUrl
                    }
                  } else {
                    gacetaIngresoUrl = proyectoRelacionado.gaceta_url
                  }
                }

                if (!proyectoRelacionado && !gacetaIngresoUrl) {
                  proyectoRelacionado = proyectos.find(p => p.clave === registro.clave_proyecto) || null
                  if (proyectoRelacionado) {
                    gacetaIngresoUrl = proyectoRelacionado.gaceta_url
                  }
                }

                resolutivos.push({
                  id_db: registro.id_db,
                  entidad: registro.entidad,
                  municipio: registro.municipio,
                  clave: registro.clave_proyecto,
                  promovente: registro.promovente,
                  proyecto: registro.proyecto_nombre,
                  modalidad: registro.modalidad,
                  fecha_ingreso: registro.fecha_ingreso || '',
                  fecha_resolucion: registro.fecha_resolucion || '',
                  vigencia: registro.vigencia?.texto_completo || undefined,
                  proyecto_ingresado_id: registro.proyecto_ingresado_id,
                  fecha_publicacion: fechaNormalizada,
                  gaceta_url: gaceta.url,
                  gaceta_id: gaceta.gaceta_id,
                  gaceta_ingreso_url: gacetaIngresoUrl,
                })
              }
            })
          }
        })

        const processed: ProcessedGacetasData = {
          stats: {
            totalGacetas: gacetasNormalizadas.length,
            totalAnalyses: analyses.length,
            municipios: Array.from(municipiosSet).sort(),
            giros: [],
            tiposEstudio: [],
            totalProyectos: proyectos.length,
            totalResolutivos: resolutivos.length,
          },
          timeSeriesData,
          gacetas: gacetasNormalizadas,
          proyectos,
          resolutivos,
          metadata: {
            totalGacetas: gacetasNormalizadas.length,
            lastUpdated: meta.last_updated,
          },
        }

        if (!isMounted) return
        setProcessedData(processed)
        setLoading(false)
      } catch (err) {
        if (!isMounted) return
        if (err instanceof Error) {
          setError(`Error al cargar los datos: ${err.message}`)
        } else {
          setError('Error desconocido al cargar los datos.')
        }
        setLoading(false)
      }
    }

    loadData()
    return () => { isMounted = false }
  }, [])

  return { data, processedData, loading, error }
}
