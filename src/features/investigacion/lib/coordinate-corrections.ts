export function dmsToDecimal(value: string): number | null {
  const match = value.trim().toUpperCase().match(
    /^(\d{1,3})\s*(?:\u00b0|\u00ba)\s*(\d{1,2})\s*(?:'|\u00b4|\u2032)\s*(?:(\d{1,2}(?:\.\d+)?)(?:\s*(?:"|\u00b4{1,2}|\u2033|''))?)?\s*([NSEO])?$/,
  )

  if (!match) return null

  const degrees = Number(match[1])
  const minutes = Number(match[2])
  const seconds = match[3] !== undefined ? Number(match[3]) : 0
  const direction = match[4]

  if (minutes >= 60 || seconds >= 60) return null
  if ((direction === 'N' || direction === 'S') && degrees > 90) return null
  if ((direction === 'E' || direction === 'O') && degrees > 180) return null

  const decimal = degrees + minutes / 60 + seconds / 3600

  // Si no hay letra de dirección, inferir por magnitud:
  // grados > 90 solo pueden ser longitud (oeste, negativo); el resto latitud norte.
  if (direction === 'S' || direction === 'O' || (!direction && degrees > 90)) {
    return -decimal
  }
  return decimal
}

/**
 * Normaliza un valor crudo de la BD (número, DMS "21°48´26.13´´" o UTM en
 * string "775576.9") a grados decimales / número. Devuelve null si no se puede.
 */
export function normalizeRawCoordinate(
  value: number | string | null | undefined,
): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (value == null) return null

  const str = String(value).trim()
  if (!str) return null

  // DMS: contiene símbolos de grado
  if (/[\u00b0\u00ba]/.test(str)) return dmsToDecimal(str)

  // Número puro (UTM, decimal) con posibles separadores de miles
  const cleaned = str.replace(/[\s,\u00a0]+/g, '')
  if (!cleaned) return null

  const num = Number(cleaned)
  return Number.isFinite(num) ? num : null
}

export function parseRawDecimal(x: number, y: number): { x: number; y: number } {
  return { x: -x / 1_000_000, y: y / 1_000_000 }
}

export function parseUtmThousand(x: number, y: number): { x: number; y: number } {
  return { x: x / 1000, y: y / 1000 }
}

export function parseUtmMixed(x: number, y: number): { x: number; y: number } {
  return { x: x / 10000, y: y }
}

export function correctProjectCoordinates(
  expediente: string | null | undefined,
  x: number | string | null,
  y: number | string | null,
): { x: number | null; y: number | null } {
  return {
    x: normalizeRawCoordinate(x),
    y: normalizeRawCoordinate(y),
  }
}