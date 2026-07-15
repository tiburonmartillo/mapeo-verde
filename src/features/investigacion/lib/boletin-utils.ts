import { Boletin } from '../lib/types'

/**
 * Calcula la fecha límite para consulta pública
 * Fecha de publicación + 10 días hábiles (excluyendo sábados y domingos)
 */
export function calcularFechaLimiteConsulta(fechaPublicacion: string): string {
  const fecha = new Date(fechaPublicacion)
  
  // Validar que la fecha sea válida
  if (isNaN(fecha.getTime())) {
    console.warn('Fecha inválida recibida:', fechaPublicacion)
    return new Date().toISOString().split('T')[0] // Retornar fecha actual como fallback
  }
  
  let diasAgregados = 0
  let diasHabiles = 0
  
  while (diasHabiles < 10) {
    diasAgregados++
    const fechaActual = new Date(fecha)
    fechaActual.setDate(fecha.getDate() + diasAgregados)
    
    // Excluir sábados (6) y domingos (0)
    if (fechaActual.getDay() !== 0 && fechaActual.getDay() !== 6) {
      diasHabiles++
    }
  }
  
  const fechaLimite = new Date(fecha)
  fechaLimite.setDate(fecha.getDate() + diasAgregados)
  
  return fechaLimite.toISOString().split('T')[0]
}

/**
 * Formatea una fecha en español
 */
export function formatearFecha(fecha: string): string {
  const fechaObj = new Date(fecha)
  return fechaObj.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Formatea una fecha en formato corto para mostrar en el resumen
 */
export function formatearFechaCorta(fecha: string): string {
  const fechaObj = new Date(fecha)
  return fechaObj.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Determina si un boletín tiene resolutivos emitidos
 */
export function tieneResolutivos(boletin: Boletin): boolean {
  return boletin.resolutivos_emitidos && boletin.resolutivos_emitidos.length > 0
}

/**
 * Obtiene el texto para la sección de resolutivos
 */
export function getTextoResolutivos(boletin: Boletin): string {
  if (tieneResolutivos(boletin)) {
    return `Resolutivos emitidos (${boletin.resolutivos_emitidos.length})`
  }
  return 'No se emitieron resolutivos'
}

/**
 * Genera el título del boletín
 */
export function generarTituloBoletin(boletin: Boletin): string {
  return `Resumen del Boletín Ambiental de SSMAA - ${formatearFechaCorta(boletin.fecha_publicacion)}`
}

/**
 * Valida si un boletín tiene datos válidos para mostrar
 */
export function validarBoletin(boletin: Boletin): boolean {
  return !!(
    boletin &&
    boletin.id &&
    boletin.fecha_publicacion &&
    (boletin.proyectos_ingresados?.length > 0 || boletin.resolutivos_emitidos?.length > 0)
  )
}
