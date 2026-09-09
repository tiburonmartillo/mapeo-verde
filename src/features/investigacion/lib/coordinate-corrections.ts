interface RawCoordinateCorrection {
  x: string
  y: string
}

const COORDINATE_CORRECTIONS: Record<string, RawCoordinateCorrection> = {
  'SSMAA-DIRA-2911/2026': {
    x: '102\u00b017\'01.38"O',
    y: '22\u00b001\'27.53"N',
  },
  'SSMAA-DIRA-2925-2026': {
    x: '102\u00b022\'16.11\u00b4\u00b4O',
    y: '21\u00b053\'57.26\u00b4\u00b4N',
  },
  'SSMAA-DIRA-2893-2026': {
    x: '102\u00b012\'01.9\u00b4\u00b4O',
    y: '22\u00b015\'41.2\u00b4\u00b4N',
  },
  'SSMAA-DIRA-2894-2026': {
    x: '102\u00b014\'43"O',
    y: '22\u00b010\'18"N',
  },
}

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

export function correctProjectCoordinates(
  expediente: string | null | undefined,
  x: number | null,
  y: number | null,
): { x: number | null; y: number | null } {
  if (x != null && y != null && Number.isFinite(x) && Number.isFinite(y)) {
    return { x, y }
  }

  const correction = COORDINATE_CORRECTIONS[expediente?.trim().toUpperCase() ?? '']
  if (!correction) return { x, y }

  return {
    x: dmsToDecimal(correction.x),
    y: dmsToDecimal(correction.y),
  }
}
