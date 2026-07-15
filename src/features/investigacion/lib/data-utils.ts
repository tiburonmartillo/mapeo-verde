import type { BoletinesData, Proyecto, Resolutivo, Boletin } from "./types"
import { calcularEstadoCumplimiento, obtenerAutoridad } from "./boletines-v2-utils"
import { getCalendarParts } from "./date-utils"

export interface FilterOptions {
  search?: string
  municipioFilter?: string
  tipoFilter?: string
  yearFilter?: string
  monthFilter?: string
  activeTab?: string
}

export function getStats(data: BoletinesData) {
  const totalBoletines = data.boletines.length
  const totalProyectos = data.boletines.reduce((sum, b) => sum + b.cantidad_ingresados, 0)
  const totalResolutivos = data.boletines.reduce((sum, b) => sum + b.cantidad_resolutivos, 0)

  const municipios = new Set<string>()
  const giros = new Set<string>()
  const tiposEstudio = new Set<string>()

  data.boletines.forEach((boletin) => {
    (boletin.proyectos_ingresados || []).forEach((p) => {
      if (p.municipio) municipios.add(p.municipio)
      if (p.giro) giros.add(p.giro)
      if (p.tipo_estudio) tiposEstudio.add(p.tipo_estudio)
    })
  })

  return {
    totalBoletines,
    totalProyectos,
    totalResolutivos,
    municipios: Array.from(municipios).sort(),
    giros: Array.from(giros).sort(),
    tiposEstudio: Array.from(tiposEstudio).sort(),
  }
}

export function getTimeSeriesData(data: BoletinesData) {
  // Mapeo de números de mes a nombres en español
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const byMonth = data.boletines.reduce(
    (acc, boletin) => {
      // Extraer año y mes de fecha_publicacion
      if (!boletin.fecha_publicacion) {
        console.warn('Boletín sin fecha de publicación:', boletin)
        return acc
      }

      const fecha = new Date(boletin.fecha_publicacion)
      const año = fecha.getFullYear()
      const mes = fecha.getMonth() + 1 // getMonth() devuelve 0-11, necesitamos 1-12

      // Validar que la fecha sea válida
      if (isNaN(año) || isNaN(mes) || mes < 1 || mes > 12) {
        console.warn('Boletín con fecha inválida:', boletin.fecha_publicacion, boletin)
        return acc
      }

      const key = `${año}-${String(mes).padStart(2, "0")}`
      const fechaDisplay = `${año}-${meses[mes - 1]}`
      
      if (!acc[key]) {
        acc[key] = {
          fecha: fechaDisplay,
          proyectos: 0,
          resolutivos: 0,
        }
      }
      acc[key].proyectos += boletin.cantidad_ingresados || 0
      acc[key].resolutivos += boletin.cantidad_resolutivos || 0
      return acc
    },
    {} as Record<string, { fecha: string; proyectos: number; resolutivos: number }>,
  )

  const result = Object.values(byMonth).sort((a, b) => {
    // Extraer año y mes para ordenar correctamente
    const [añoA, mesA] = a.fecha.split('-')
    const [añoB, mesB] = b.fecha.split('-')
    const mesIndexA = meses.indexOf(mesA)
    const mesIndexB = meses.indexOf(mesB)
    
    if (añoA !== añoB) {
      return parseInt(añoA) - parseInt(añoB)
    }
    return mesIndexA - mesIndexB
  })


  return result
}

// Función para normalizar expedientes (manejar inconsistencias como "20" vs "2025")
function normalizeExpediente(expediente: string | null | undefined): string {
  const normalized = typeof expediente === 'string' ? expediente.trim() : ''

  if (!normalized) {
    return ''
  }

  // Si el expediente termina en "-20", asumir que es "-2025"
  if (normalized.endsWith('-20')) {
    return normalized.replace('-20', '-2025')
  }

  return normalized
}

export function getAllProyectos(
  data: BoletinesData,
): (Proyecto & { fecha_publicacion: string; boletin_url: string })[] {
  const proyectos = data.boletines.flatMap((boletin) =>
    (boletin.proyectos_ingresados || []).map((p) => ({
      ...p,
      expediente: normalizeExpediente(p.expediente), // Normalizar expediente
      fecha_publicacion: boletin.fecha_publicacion,
      boletin_url: boletin.url || boletin.filename,
    })),
  )
  


  return proyectos.sort((a, b) => {
    const pubDiff =
      new Date(b.fecha_publicacion).getTime() - new Date(a.fecha_publicacion).getTime()
    if (pubDiff !== 0) return pubDiff
    return new Date(b.fecha_ingreso).getTime() - new Date(a.fecha_ingreso).getTime()
  })
}

export function getAllResolutivos(
  data: BoletinesData,
): (Resolutivo & { fecha_publicacion: string; boletin_url: string; coordenadas_x: number | null; coordenadas_y: number | null; boletin_ingreso_url: string | null })[] {
  // Primero obtener todos los proyectos con sus coordenadas
  const proyectosConCoordenadas = getAllProyectos(data)
  
  const resolutivosConCoordenadas = data.boletines.flatMap((boletin) =>
    (boletin.resolutivos_emitidos || []).map((r) => {
      // Normalizar expediente
      const expedienteNormalizado = normalizeExpediente(r.expediente)
      
      // Buscar el proyecto correspondiente por expediente normalizado
      let proyectoRelacionado = proyectosConCoordenadas.find(p => p.expediente === expedienteNormalizado)
      
      // Si no se encuentra, intentar buscar con años diferentes (ej: 2024 vs 2025)
      if (!proyectoRelacionado) {
        const expedienteBase = expedienteNormalizado.replace(/-202[0-9]$/, '')
        proyectoRelacionado = proyectosConCoordenadas.find(p => {
          const pExpedienteBase = normalizeExpediente(p.expediente).replace(/-202[0-9]$/, '')
          return pExpedienteBase === expedienteBase
        })
      }
      
      const resolutivoConCoordenadas = {
        ...r,
        expediente: expedienteNormalizado, // Usar expediente normalizado
        fecha_publicacion: boletin.fecha_publicacion,
        boletin_url: boletin.url || boletin.filename,
        coordenadas_x: proyectoRelacionado?.coordenadas_x || r.coordenadas_x || null,
        coordenadas_y: proyectoRelacionado?.coordenadas_y || r.coordenadas_y || null,
        boletin_ingreso_url: proyectoRelacionado?.boletin_url || null,
      }
      
      return resolutivoConCoordenadas
    }),
  )
  

  return resolutivosConCoordenadas
}

export function getDistributionByMunicipio(data: BoletinesData) {
  const distribution: Record<string, number> = {}

  data.boletines.forEach((boletin) => {
    (boletin.proyectos_ingresados || []).forEach((p) => {
      if (p.municipio) {
        distribution[p.municipio] = (distribution[p.municipio] || 0) + 1
      }
    })
  })

  return Object.entries(distribution)
    .map(([municipio, count]) => ({ municipio, count }))
    .sort((a, b) => b.count - a.count)
}

export function getDistributionByGiro(data: BoletinesData) {
  const distribution: Record<string, number> = {}

  data.boletines.forEach((boletin) => {
    (boletin.proyectos_ingresados || []).forEach((p) => {
      if (p.giro) {
        distribution[p.giro] = (distribution[p.giro] || 0) + 1
      }
    })
  })

  return Object.entries(distribution)
    .map(([giro, count]) => ({ giro, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Filtra boletines según los criterios especificados (V2)
 * @param boletines - Array de boletines a filtrar
 * @param filters - Objeto con los filtros a aplicar
 * @returns Array de boletines filtrados
 */
export function filterBoletinesV2(
  boletines: Boletin[],
  filters: {
    search?: string
    año?: string
    tipo?: string
    autoridad?: string
    municipio?: string
    estadoCumplimiento?: string
  }
): Boletin[] {
  return boletines.filter((boletin) => {
    // Filtro de búsqueda (busca en id, fecha, secretario, director)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch =
        boletin.id.toString().includes(searchLower) ||
        boletin.fecha_publicacion?.toLowerCase().includes(searchLower) ||
        boletin.secretario?.toLowerCase().includes(searchLower) ||
        boletin.director?.toLowerCase().includes(searchLower) ||
        // Buscar en proyectos
        (boletin.proyectos_ingresados || []).some(
          (p) =>
            p.nombre_proyecto?.toLowerCase().includes(searchLower) ||
            p.expediente?.toLowerCase().includes(searchLower) ||
            p.municipio?.toLowerCase().includes(searchLower)
        ) ||
        // Buscar en resolutivos
        (boletin.resolutivos_emitidos || []).some(
          (r) =>
            r.expediente?.toLowerCase().includes(searchLower) ||
            r.municipio?.toLowerCase().includes(searchLower)
        )

      if (!matchesSearch) return false
    }

    // Filtro por año
    if (filters.año && filters.año !== "all") {
      const añoBoletin = boletin.año || new Date(boletin.fecha_publicacion).getFullYear()
      if (añoBoletin.toString() !== filters.año) return false
    }

    // Filtro por tipo (tipo de estudio)
    if (filters.tipo && filters.tipo !== "all") {
      const tieneTipo =
        (boletin.proyectos_ingresados || []).some((p) => p.tipo_estudio === filters.tipo) ||
        (boletin.resolutivos_emitidos || []).some((r) => r.tipo_estudio === filters.tipo)
      if (!tieneTipo) return false
    }

    // Filtro por autoridad
    if (filters.autoridad && filters.autoridad !== "all") {
      const autoridadBoletin = obtenerAutoridad(boletin)
      if (autoridadBoletin !== filters.autoridad) return false
    }

    // Filtro por municipio
    if (filters.municipio && filters.municipio !== "all") {
      const tieneMunicipio =
        (boletin.proyectos_ingresados || []).some((p) => p.municipio === filters.municipio) ||
        (boletin.resolutivos_emitidos || []).some((r) => r.municipio === filters.municipio)
      if (!tieneMunicipio) return false
    }

    // Filtro por estado de cumplimiento
    if (filters.estadoCumplimiento && filters.estadoCumplimiento !== "all") {
      const estado = calcularEstadoCumplimiento(boletin)
      if (estado !== filters.estadoCumplimiento) return false
    }

    return true
  })
}

/**
 * Filtra proyectos según las opciones de filtro
 */
export function filterProyectos(
  proyectos: (Proyecto & { fecha_publicacion: string; boletin_url: string })[],
  options: FilterOptions
): (Proyecto & { fecha_publicacion: string; boletin_url: string })[] {
  return proyectos.filter((proyecto) => {
    // Filtro de búsqueda
    if (options.search) {
      const searchLower = options.search.toLowerCase()
      const matchesSearch =
        proyecto.nombre_proyecto?.toLowerCase().includes(searchLower) ||
        proyecto.expediente?.toLowerCase().includes(searchLower) ||
        proyecto.promovente?.toLowerCase().includes(searchLower) ||
        proyecto.municipio?.toLowerCase().includes(searchLower) ||
        proyecto.giro?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Filtro por municipio
    if (options.municipioFilter && options.municipioFilter !== "all") {
      if (proyecto.municipio !== options.municipioFilter) return false
    }

    // Filtro por tipo de estudio
    if (options.tipoFilter && options.tipoFilter !== "all") {
      if (proyecto.tipo_estudio !== options.tipoFilter) return false
    }

    // Filtro por año (publicación del boletín)
    if (options.yearFilter && options.yearFilter !== "all") {
      const parts = getCalendarParts(proyecto.fecha_publicacion)
      if (parts?.year !== options.yearFilter) return false
    }

    return true
  })
}

/**
 * Filtra resolutivos según las opciones de filtro
 */
export function filterResolutivos(
  resolutivos: (Resolutivo & { fecha_publicacion: string; boletin_url: string; coordenadas_x: number | null; coordenadas_y: number | null; boletin_ingreso_url: string | null })[],
  options: FilterOptions
): (Resolutivo & { fecha_publicacion: string; boletin_url: string; coordenadas_x: number | null; coordenadas_y: number | null; boletin_ingreso_url: string | null })[] {
  return resolutivos.filter((resolutivo) => {
    // Filtro de búsqueda
    if (options.search) {
      const searchLower = options.search.toLowerCase()
      const matchesSearch =
        resolutivo.nombre_proyecto?.toLowerCase().includes(searchLower) ||
        resolutivo.expediente?.toLowerCase().includes(searchLower) ||
        resolutivo.promovente?.toLowerCase().includes(searchLower) ||
        resolutivo.municipio?.toLowerCase().includes(searchLower) ||
        resolutivo.giro?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Filtro por municipio
    if (options.municipioFilter && options.municipioFilter !== "all") {
      if (resolutivo.municipio !== options.municipioFilter) return false
    }

    // Filtro por tipo de estudio
    if (options.tipoFilter && options.tipoFilter !== "all") {
      if (resolutivo.tipo_estudio !== options.tipoFilter) return false
    }

    // Filtro por año (publicación del boletín)
    if (options.yearFilter && options.yearFilter !== "all") {
      const parts = getCalendarParts(resolutivo.fecha_publicacion)
      if (parts?.year !== options.yearFilter) return false
    }

    return true
  })
}

/**
 * Obtiene datos de series temporales filtrados
 */
export function getFilteredTimeSeriesData(
  proyectos: (Proyecto & { fecha_publicacion: string; boletin_url: string })[],
  resolutivos: (Resolutivo & { fecha_publicacion: string; boletin_url: string; coordenadas_x: number | null; coordenadas_y: number | null; boletin_ingreso_url: string | null })[],
  options: FilterOptions
) {
  const proyectosFiltrados = filterProyectos(proyectos, options)
  const resolutivosFiltrados = filterResolutivos(resolutivos, options)

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const byMonth: Record<string, { fecha: string; proyectos: number; resolutivos: number }> = {}

  // Procesar proyectos filtrados
  proyectosFiltrados.forEach((proyecto) => {
    if (!proyecto.fecha_publicacion) return
    
    const fecha = new Date(proyecto.fecha_publicacion)
    const año = fecha.getFullYear()
    const mes = fecha.getMonth() + 1
    
    if (isNaN(año) || isNaN(mes) || mes < 1 || mes > 12) return
    
    const key = `${año}-${String(mes).padStart(2, "0")}`
    const fechaDisplay = `${año}-${meses[mes - 1]}`
    
    if (!byMonth[key]) {
      byMonth[key] = {
        fecha: fechaDisplay,
        proyectos: 0,
        resolutivos: 0,
      }
    }
    byMonth[key].proyectos += 1
  })

  // Procesar resolutivos filtrados
  resolutivosFiltrados.forEach((resolutivo) => {
    if (!resolutivo.fecha_publicacion) return
    
    const fecha = new Date(resolutivo.fecha_publicacion)
    const año = fecha.getFullYear()
    const mes = fecha.getMonth() + 1
    
    if (isNaN(año) || isNaN(mes) || mes < 1 || mes > 12) return
    
    const key = `${año}-${String(mes).padStart(2, "0")}`
    const fechaDisplay = `${año}-${meses[mes - 1]}`
    
    if (!byMonth[key]) {
      byMonth[key] = {
        fecha: fechaDisplay,
        proyectos: 0,
        resolutivos: 0,
      }
    }
    byMonth[key].resolutivos += 1
  })

  return Object.values(byMonth).sort((a, b) => {
    const [añoA, mesA] = a.fecha.split('-')
    const [añoB, mesB] = b.fecha.split('-')
    const mesIndexA = meses.indexOf(mesA)
    const mesIndexB = meses.indexOf(mesB)
    
    if (añoA !== añoB) {
      return parseInt(añoA) - parseInt(añoB)
    }
    return mesIndexA - mesIndexB
  })
}

/**
 * Obtiene estadísticas filtradas
 */
export function getFilteredStats(
  proyectos: (Proyecto & { fecha_publicacion: string; boletin_url: string })[],
  resolutivos: (Resolutivo & { fecha_publicacion: string; boletin_url: string; coordenadas_x: number | null; coordenadas_y: number | null; boletin_ingreso_url: string | null })[],
  options: FilterOptions,
  totalBoletines: number
) {
  const proyectosFiltrados = filterProyectos(proyectos, options)
  const resolutivosFiltrados = filterResolutivos(resolutivos, options)

  const municipios = new Set<string>()
  const giros = new Set<string>()
  const tiposEstudio = new Set<string>()

  proyectosFiltrados.forEach((p) => {
    if (p.municipio) municipios.add(p.municipio)
    if (p.giro) giros.add(p.giro)
    if (p.tipo_estudio) tiposEstudio.add(p.tipo_estudio)
  })

  resolutivosFiltrados.forEach((r) => {
    if (r.municipio) municipios.add(r.municipio)
    if (r.giro) giros.add(r.giro)
    if (r.tipo_estudio) tiposEstudio.add(r.tipo_estudio)
  })

  return {
    totalBoletines,
    totalProyectos: proyectosFiltrados.length,
    totalResolutivos: resolutivosFiltrados.length,
    municipios: Array.from(municipios).sort(),
    giros: Array.from(giros).sort(),
    tiposEstudio: Array.from(tiposEstudio).sort(),
  }
}
