import { describe, expect, it } from 'vitest'
import {
  dmsToDecimal,
  parseRawDecimal,
  parseUtmThousand,
  parseUtmMixed,
  correctProjectCoordinates,
} from '../features/investigacion/lib/coordinate-corrections'
import { getAllProyectos } from '../features/investigacion/lib/data-utils'
import type { BoletinesData } from '../features/investigacion/lib/types'

describe('frontend coordinate parsers', () => {
  it('converts west and north DMS coordinates to decimal degrees', () => {
    expect(dmsToDecimal('102\u00b017\'01.38"O')).toBeCloseTo(-102.2837167, 7)
    expect(dmsToDecimal('22\u00b001\'27.53"N')).toBeCloseTo(22.0243139, 7)
    expect(dmsToDecimal('102\u00b022\'16.11\u00b4\u00b4O')).toBeCloseTo(-102.3711417, 7)
    expect(dmsToDecimal('21\u00b053\'57.26\u00b4\u00b4N')).toBeCloseTo(21.8992389, 7)
  })

  it('parses raw-decimal (integer * 1M)', () => {
    expect(parseRawDecimal(102164114, 21474109)).toEqual({ x: -102.164114, y: 21.474109 })
    expect(parseRawDecimal(102172897, 21580377)).toEqual({ x: -102.172897, y: 21.580377 })
  })

  it('parses UTM with comma-thousands removed (/1000)', () => {
    expect(parseUtmThousand(784853894, 2433573220)).toEqual({ x: 784853.894, y: 2433573.22 })
    expect(parseUtmThousand(789837462, 2458616538)).toEqual({ x: 789837.462, y: 2458616.538 })
  })

  it('parses mixed UTM scaling (X/10000, Y normal)', () => {
    expect(parseUtmMixed(7811153872, 2468641.792)).toEqual({ x: 781115.3872, y: 2468641.792 })
  })

  it('returns coords as-is when already valid numbers', () => {
    expect(correctProjectCoordinates('ANY', 783213.79, 2421905.12)).toEqual({ x: 783213.79, y: 2421905.12 })
  })

  it('returns nulls when coords are null', () => {
    expect(correctProjectCoordinates('ANY', null, null)).toEqual({ x: null, y: null })
  })
})

describe('deduplication', () => {
  it('prefers entries with valid coordinates over null', () => {
    const projectWithCoords = {
      numero: 4,
      tipo_estudio: 'MIA',
      promovente: 'INMOBILIARIA ALSUPER',
      nombre_proyecto: 'ALSUPER TECNOLOGICO',
      giro: 'SERVICIO',
      municipio: 'AGUASCALIENTES',
      coordenadas_x: 783213.79,
      coordenadas_y: 2421905.12,
      expediente: 'SSMAA-DIRA-2907-2026',
      fecha_ingreso: '2026-06-23',
      boletin_id: 26,
      coord_valida: null,
      naturaleza_proyecto: '',
    }
    const projectWithoutCoords = {
      ...projectWithCoords,
      coordenadas_x: null,
      coordenadas_y: null,
    }
    const data = {
      boletines: [
        {
          fecha_publicacion: '2026-06-30',
          filename: 'boletin.pdf',
          proyectos_ingresados: [projectWithoutCoords, projectWithCoords],
        },
      ],
    } as BoletinesData

    const result = getAllProyectos(data)

    expect(result).toHaveLength(1)
    expect(result[0].coordenadas_x).toBe(783213.79)
    expect(result[0].coordenadas_y).toBe(2421905.12)
  })
})