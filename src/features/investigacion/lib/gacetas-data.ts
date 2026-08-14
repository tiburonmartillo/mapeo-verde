import type { SupabaseClient } from '@supabase/supabase-js'
import { getInvestigacionClient } from './supabase-data'

export interface AnalisisGaceta {
  url: string
  año: number
  paginas: number[]
  resumen: string | null
  gaceta_id: string
  secciones: string[] | null
  analisis_completo: AnalisisCompleto | null
  fecha_publicacion: string | null
  palabras_clave_encontradas: string[]
}

export interface AnalisisCompleto {
  gaceta: {
    numero: string
    fecha_publicacion: string
    anio: number
  }
  resumen: {
    total_registros: number
    hectareas_totales: number
    consultas_publicas: number
    tramites_unificados: number
    proyectos_ingresados: number
    resolutivos_emitidos: number
  }
  registros: RegistroGacetaRaw[]
}

export interface RegistroGacetaRaw {
  id: string
  id_db: number
  entidad: string
  estatus: string | null
  vigencia: {
    construccion_anios: number | null
    operacion_anios: number | null
    texto_completo: string | null
  } | null
  gaceta_id: string
  modalidad: string
  municipio: string
  promovente: string
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
  descripcion: string | null
  fecha_ingreso: string | null
  observaciones: string | null
  semarnat_data?: any | null
  tipo_proyecto: string
  tipo_registro: string
  clave_proyecto: string
  proyecto_nombre: string
  resolutivos_ids: number[]
  areas_forestales: boolean | null
  cambio_uso_suelo: boolean | null
  fecha_resolucion: string | null
  semarnat_storage?: any | null
  seccion_documento: string
  semarnat_bitacora?: any | null
  semarnat_proyecto?: any | null
  semarnat_historial?: any | null
  ubicacion_especifica: string | null
  proyecto_ingresado_id: number | null
  semarnat_proyecto_bitacora?: any | null
}

export interface GacetasMetadata {
  created: string
  last_updated: string
  total_analyzed: number
  year_range: string
}

export interface GacetasDbData {
  analyses: AnalisisGaceta[]
  metadata: GacetasMetadata
}

function mapRegistro(row: any, gacetaId: string): RegistroGacetaRaw {
  return {
    id: row.registro_id ?? String(row.id_db),
    id_db: row.id_db,
    entidad: row.entidad,
    estatus: row.estatus,
    vigencia: row.vigencia ?? null,
    gaceta_id: gacetaId,
    modalidad: row.modalidad,
    municipio: row.municipio,
    promovente: row.promovente,
    superficie: row.superficie ?? null,
    vegetacion: row.vegetacion ?? null,
    descripcion: row.descripcion,
    fecha_ingreso: row.fecha_ingreso,
    observaciones: row.observaciones,
    semarnat_data: row.semarnat_data ?? null,
    tipo_proyecto: row.tipo_proyecto,
    tipo_registro: row.tipo_registro,
    clave_proyecto: row.clave_proyecto,
    proyecto_nombre: row.proyecto_nombre,
    resolutivos_ids: row.resolutivos_ids ?? [],
    areas_forestales: row.areas_forestales,
    cambio_uso_suelo: row.cambio_uso_suelo,
    fecha_resolucion: row.fecha_resolucion,
    semarnat_storage: row.semarnat_storage ?? null,
    seccion_documento: row.seccion_documento,
    semarnat_bitacora: row.semarnat_bitacora ?? null,
    semarnat_proyecto: row.semarnat_proyecto ?? null,
    semarnat_historial: row.semarnat_historial ?? null,
    ubicacion_especifica: row.ubicacion_especifica,
    proyecto_ingresado_id: row.proyecto_ingresado_id,
    semarnat_proyecto_bitacora: row.semarnat_proyecto_bitacora ?? null,
  }
}

function mapGaceta(row: any): AnalisisGaceta {
  const registros: RegistroGacetaRaw[] = (row.gacetas_registros || []).map((r: any) =>
    mapRegistro(r, row.gaceta_id),
  )
  const totalRegistros = Number(row.total_registros ?? registros.length)

  return {
    url: row.url,
    año: row.año,
    paginas: row.paginas ?? [],
    resumen: row.resumen,
    gaceta_id: row.gaceta_id,
    secciones: row.secciones ?? null,
    fecha_publicacion: row.fecha_publicacion,
    palabras_clave_encontradas: row.palabras_clave_encontradas ?? [],
    analisis_completo:
      totalRegistros > 0
        ? {
            gaceta: {
              numero: row.gaceta_numero ?? row.gaceta_id,
              fecha_publicacion: row.gaceta_fecha_publicacion ?? row.fecha_publicacion,
              anio: row.gaceta_anio ?? row.año,
            },
            resumen: {
              total_registros: totalRegistros,
              hectareas_totales: Number(row.hectareas_totales ?? 0),
              consultas_publicas: Number(row.consultas_publicas_count ?? 0),
              tramites_unificados: Number(row.tramites_unificados_count ?? 0),
              proyectos_ingresados: Number(row.proyectos_ingresados_count ?? 0),
              resolutivos_emitidos: Number(row.resolutivos_emitidos_count ?? 0),
            },
            registros,
          }
        : null,
  }
}

const PAGE_SIZE = 1000

async function fetchGacetasRows(supabase: SupabaseClient): Promise<any[]> {
  const all: any[] = []
  let start = 0
  for (;;) {
    const { data, error } = await supabase
      .from('gacetas')
      .select('*, gacetas_registros(*)')
      .order('fecha_publicacion', { ascending: false })
      .range(start, start + PAGE_SIZE - 1)

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < PAGE_SIZE) break
    start += PAGE_SIZE
  }
  return all
}

export async function loadGacetasFromDb(): Promise<GacetasDbData> {
  const supabase = getInvestigacionClient()
  const rows = await fetchGacetasRows(supabase)

  if (!rows || rows.length === 0) {
    throw new Error('No se encontraron gacetas en la base de datos')
  }

  const analyses = rows.map(mapGaceta)

  const anios = rows
    .map((r) => Number(r.año))
    .filter((a) => Number.isFinite(a) && a > 0)
  const minAnio = anios.length > 0 ? Math.min(...anios) : new Date().getFullYear()
  const maxAnio = anios.length > 0 ? Math.max(...anios) : new Date().getFullYear()

  const timestamps = rows
    .map((r) => r.created_at ?? r.fecha_publicacion)
    .filter((t) => Boolean(t))
  const lastUpdated =
    timestamps.length > 0
      ? timestamps.reduce((a: string, b: string) => (new Date(a) > new Date(b) ? a : b))
      : new Date().toISOString()

  const metadata: GacetasMetadata = {
    created: rows.reduce((acc: string | null, r) => {
      const t = r.created_at ?? null
      if (!t) return acc
      return !acc || new Date(t) < new Date(acc) ? t : acc
    }, null) ?? lastUpdated,
    last_updated: lastUpdated,
    total_analyzed: analyses.length,
    year_range: `${minAnio}-${maxAnio}`,
  }

  return { analyses, metadata }
}