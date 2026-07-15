/** Extrae año y mes de fechas ISO (YYYY-MM-DD) sin depender de la zona horaria del navegador. */
export function getCalendarParts(
  dateStr: string | null | undefined,
): { year: string; month: string } | null {
  if (!dateStr) return null
  const match = String(dateStr).match(/^(\d{4})-(\d{2})/)
  if (!match) return null
  return { year: match[1], month: String(parseInt(match[2], 10)) }
}
