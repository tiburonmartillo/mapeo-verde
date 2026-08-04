/** Extrae año y mes de fechas ISO (YYYY-MM-DD) sin depender de la zona horaria del navegador. */
export function getCalendarParts(
  dateStr: string | null | undefined,
): { year: string; month: string } | null {
  if (!dateStr) return null
  const match = String(dateStr).match(/^(\d{4})-(\d{2})/)
  if (!match) return null
  return { year: match[1], month: String(parseInt(match[2], 10)) }
}

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/** Formatea un timestamp ISO a fecha en español (ej. "19 de enero de 2026"). */
export function formatFechaLarga(timestamp: string | null | undefined): string {
  if (!timestamp) return 'Fecha no disponible'
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return 'Fecha no disponible'
    return `${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`
  } catch {
    return 'Fecha no disponible'
  }
}

/** Formatea un timestamp ISO a fecha y hora en español (ej. "19 de enero de 2026, 18:15"). */
export function formatFechaHoraLarga(
  timestamp: string | null | undefined,
  fallback: string = 'Fecha no disponible',
): string {
  if (!timestamp) return fallback
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return fallback
    const horas = date.getHours()
    const minutos = date.getMinutes()
    const hora = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
    return `${formatFechaLarga(timestamp)}, ${hora} h`
  } catch {
    return fallback
  }
}
