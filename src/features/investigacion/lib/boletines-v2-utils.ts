import type { Boletin, Proyecto, Resolutivo } from "./types"

/**
 * Formatea una fecha para mostrar en la interfaz
 * @param fecha - Fecha en formato string (DD/MM/YYYY, YYYY-MM-DD, o ISO)
 * @returns Fecha formateada como "DD de Mes de YYYY" (ej: "15 de enero de 2024")
 */
export function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return "Fecha no disponible"

  try {
    let date: Date | null = null

    // Si está en formato DD/MM/YYYY
    if (fecha.includes('/')) {
      const parts = fecha.split('/')
      if (parts.length === 3) {
        const day = parseInt(parts[0])
        const month = parseInt(parts[1]) - 1 // Mes es 0-indexado
        const year = parseInt(parts[2])
        date = new Date(year, month, day)
      }
    } else {
      // Si está en formato YYYY-MM-DD o ISO
      date = new Date(fecha)
    }

    if (!date || isNaN(date.getTime())) {
      return "Fecha inválida"
    }

    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ]

    const day = date.getDate()
    const month = meses[date.getMonth()]
    const year = date.getFullYear()

    return `${day} de ${month} de ${year}`
  } catch {
    return "Fecha inválida"
  }
}

/**
 * Determina si un boletín es nuevo (publicado en los últimos 10 días)
 * @param fechaPublicacion - Fecha de publicación del boletín
 * @returns true si el boletín fue publicado en los últimos 10 días
 */
export function esBoletinNuevo(fechaPublicacion: string | null | undefined): boolean {
  if (!fechaPublicacion) return false

  try {
    const fecha = new Date(fechaPublicacion)
    if (isNaN(fecha.getTime())) return false

    const ahora = new Date()
    const diferenciaDias = Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24))

    return diferenciaDias < 10 && diferenciaDias >= 0
  } catch {
    return false
  }
}

/**
 * Tipo de estado de cumplimiento
 */
export type EstadoCumplimiento = 'con_resolutivo' | 'sin_resolutivo' | 'en_proceso' | 'desconocido'

/**
 * Calcula el estado de cumplimiento de un boletín basado en sus proyectos y resolutivos
 * @param boletin - Boletín a evaluar
 * @returns Estado de cumplimiento
 */
export function calcularEstadoCumplimiento(boletin: Boletin): EstadoCumplimiento {
  const totalProyectos = boletin.cantidad_ingresados || 0
  const totalResolutivos = boletin.cantidad_resolutivos || 0

  if (totalProyectos === 0) {
    return 'desconocido'
  }

  // Si hay más resolutivos que proyectos, probablemente hay resolutivos de boletines anteriores
  if (totalResolutivos >= totalProyectos) {
    return 'con_resolutivo'
  }

  // Si hay algunos resolutivos pero no todos
  if (totalResolutivos > 0) {
    return 'en_proceso'
  }

  // Si no hay resolutivos
  return 'sin_resolutivo'
}

/**
 * Obtiene el nombre de la autoridad (secretario o director) de un boletín
 * @param boletin - Boletín del cual extraer la autoridad
 * @returns Nombre de la autoridad o "No especificada"
 */
export function obtenerAutoridad(boletin: Boletin): string {
  // Priorizar secretario, luego director
  if (boletin.secretario && boletin.secretario.trim()) {
    return boletin.secretario.trim()
  }
  if (boletin.director && boletin.director.trim()) {
    return boletin.director.trim()
  }
  return "No especificada"
}

/**
 * Formatea un contador con formato plural correcto en español
 * @param cantidad - Cantidad a formatear
 * @param singular - Palabra en singular (ej: "boletín")
 * @param plural - Palabra en plural (ej: "boletines"), opcional, se genera automáticamente si no se proporciona
 * @returns String formateado (ej: "1 boletín" o "5 boletines")
 */
export function formatearContador(
  cantidad: number,
  singular: string,
  plural?: string
): string {
  const pluralForm = plural || `${singular}es` // Por defecto agregar "es"
  
  if (cantidad === 1) {
    return `1 ${singular}`
  }
  
  return `${cantidad} ${pluralForm}`
}

/**
 * Obtiene el color asociado a un estado de cumplimiento
 * @param estado - Estado de cumplimiento
 * @returns Color en formato hex o nombre de color
 */
export function obtenerColorEstado(estado: EstadoCumplimiento): string {
  switch (estado) {
    case 'con_resolutivo':
      return '#10b981' // verde
    case 'sin_resolutivo':
      return '#ef4444' // rojo
    case 'en_proceso':
      return '#f59e0b' // amarillo/naranja
    case 'desconocido':
    default:
      return '#6b7280' // gris
  }
}

/**
 * Obtiene el texto descriptivo de un estado de cumplimiento
 * @param estado - Estado de cumplimiento
 * @returns Texto descriptivo
 */
export function obtenerTextoEstado(estado: EstadoCumplimiento): string {
  switch (estado) {
    case 'con_resolutivo':
      return 'Con resolutivo'
    case 'sin_resolutivo':
      return 'Sin resolutivo'
    case 'en_proceso':
      return 'En proceso'
    case 'desconocido':
    default:
      return 'Estado desconocido'
  }
}

/**
 * Obtiene el icono asociado a un estado de cumplimiento (nombre de icono de lucide-react)
 * @param estado - Estado de cumplimiento
 * @returns Nombre del icono
 */
export function obtenerIconoEstado(estado: EstadoCumplimiento): string {
  switch (estado) {
    case 'con_resolutivo':
      return 'CheckCircle2'
    case 'sin_resolutivo':
      return 'XCircle'
    case 'en_proceso':
      return 'Clock'
    case 'desconocido':
    default:
      return 'HelpCircle'
  }
}
