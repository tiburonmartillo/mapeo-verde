export function dmsToDecimal(value: string): number | null {
  const match = value.trim().toUpperCase().match(
    /^(\d{1,3})\s*(?:\u00b0|\u00ba)\s*(\d{1,2})\s*'\s*(\d{1,2}(?:\.\d+)?)\s*(?:"|\u00b4\u00b4|'')\s*([NSEO])$/,
  )

  if (!match) return null

  const degrees = Number(match[1])
  const minutes = Number(match[2])
  const seconds = Number(match[3])
  const direction = match[4]

  if (minutes >= 60 || seconds >= 60) return null
  if ((direction === 'N' || direction === 'S') && degrees > 90) return null
  if ((direction === 'E' || direction === 'O') && degrees > 180) return null

  const decimal = degrees + minutes / 60 + seconds / 3600
  return direction === 'S' || direction === 'O' ? -decimal : decimal
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
  x: number | null,
  y: number | null,
): { x: number | null; y: number | null } {
  if (x != null && y != null && Number.isFinite(x) && Number.isFinite(y)) {
    return { x, y }
  }
  return { x, y }
}