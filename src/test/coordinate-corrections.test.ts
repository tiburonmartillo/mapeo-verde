import { describe, expect, it } from 'vitest'
import {
  correctProjectCoordinates,
  dmsToDecimal,
} from '../features/investigacion/lib/coordinate-corrections'
import { getAllProyectos } from '../features/investigacion/lib/data-utils'
import type { BoletinesData } from '../features/investigacion/lib/types'

describe('frontend coordinate corrections', () => {
  it('converts west and north DMS coordinates to decimal degrees', () => {
    expect(dmsToDecimal('102\u00b017\'01.38"O')).toBeCloseTo(-102.2837167, 7)
    expect(dmsToDecimal('22\u00b001\'27.53"N')).toBeCloseTo(22.0243139, 7)
    // Also handles double quotes (´´) used in some PDFs
    expect(dmsToDecimal('102\u00b022\'16.11\u00b4\u00b4O')).toBeCloseTo(-102.3711417, 7)
    expect(dmsToDecimal('21\u00b053\'57.26\u00b4\u00b4N')).toBeCloseTo(21.8992389, 7)
  })

  it('supplies the coordinates missing for SSMAA-DIRA-2911/2026', () => {
    const result = correctProjectCoordinates('SSMAA-DIRA-2911/2026', null, null)

    expect(result.x).toBeCloseTo(-102.2837167, 7)
    expect(result.y).toBeCloseTo(22.0243139, 7)
  })

  it('supplies the coordinates missing for SSMAA-DIRA-2925-2026', () => {
    const result = correctProjectCoordinates('SSMAA-DIRA-2925-2026', null, null)

    expect(result.x).toBeCloseTo(-102.3711417, 7)
    expect(result.y).toBeCloseTo(21.8992389, 7)
  })

  it('supplies the coordinates missing for SSMAA-DIRA-2893-2026 (DMS with ´´)', () => {
    const result = correctProjectCoordinates('SSMAA-DIRA-2893-2026', null, null)

    // 22°15'41.2''N, 102°12'01.9''O
    expect(result.x).toBeCloseTo(-102.2005278, 7)
    expect(result.y).toBeCloseTo(22.2614444, 7)
  })

  it('supplies the coordinates missing for SSMAA-DIRA-2894-2026 (DMS with labeled N/W)', () => {
    const result = correctProjectCoordinates('SSMAA-DIRA-2894-2026', null, null)

    // 22°10'18"N, 102°14'43"W
    expect(result.x).toBeCloseTo(-102.2452778, 7)
    expect(result.y).toBeCloseTo(22.1716667, 7)
  })

  it('deduplicates preferring entries with valid coordinates over null', () => {
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
