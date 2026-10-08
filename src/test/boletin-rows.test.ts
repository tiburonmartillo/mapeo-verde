import { describe, expect, it } from 'vitest';
import {
  countDiscarded,
  isPlaceholderRow,
  PROYECTO_FIELDS,
  RESOLUTIVO_FIELDS,
  sanitizeProyectos,
  sanitizeResolutivos,
} from '../features/investigacion/lib/boletin-rows';

describe('sanitizeProyectos', () => {
  it('elimina las filas duplicadas de una reingesta', () => {
    // Caso real: boletin 202640, cada proyecto insertado dos veces (6492-6494 y 6495-6497).
    const proyecto = {
      numero: 1,
      tipo_estudio: 'MIA',
      promovente: 'BANCO DE MATERIALES LA LOMITA',
      nombre_proyecto: 'BANCO DE MATERIALES LA LOMITA',
      naturaleza_proyecto: null,
      giro: 'MATERIALES',
      municipio: 'AGUASCALIENTES',
      expediente: 'SSMAA-DIRA-2934-2026',
      fecha_ingreso: '2026-09-28',
      coordenadas_x: '2426459',
      coordenadas_y: '785292',
    };

    const limpio = sanitizeProyectos([proyecto, { ...proyecto }]);

    expect(limpio).toHaveLength(1);
    expect(limpio[0].expediente).toBe('SSMAA-DIRA-2934-2026');
  });

  it('conserva proyectos distintos que comparten expediente', () => {
    // Caso real: boletin 201747, expediente SMAE-DIRA-1650-17 para dos proyectos.
    const monticello = {
      numero: 1,
      nombre_proyecto: 'AMPLIACIÓN MONTICELLO INDUSTRIAL',
      promovente: 'RESORTES MONTICELLO DE MÉXICO, S.A. DE C.V.',
      municipio: 'SAN FRANCISCO DE LOS ROMO',
      expediente: 'SMAE-DIRA-1650-17',
      tipo_estudio: 'IP',
    };
    const vitechmex = {
      numero: 2,
      nombre_proyecto: 'OPERACIÓN Y MANTENIMIENTO INDUSTRIAL',
      promovente: 'VITECHMEX NONWOVENS, S.A. DE C.V.',
      municipio: 'JESÚS MARÍA',
      expediente: 'SMAE-DIRA-1650-17',
      tipo_estudio: 'IP',
    };

    expect(sanitizeProyectos([monticello, vitechmex])).toHaveLength(2);
  });

  it('colapsa variantes de OCR del mismo proyecto', () => {
    // Caso real: boletin 202626 numero 3, "CONSTRUCCIÓN" contra "CONSTRUCCIÓN".
    const a = {
      numero: 3,
      nombre_proyecto: 'CONSTRUCCIÓN EDIFICIO Q',
      expediente: 'SSMAA-DIRA-2906-2026',
      promovente: 'BANCO INVEX',
      municipio: 'AGUASCALIENTES',
    };
    const b = { ...a, nombre_proyecto: 'CONSTRUCCIÓN EDIFICIO Q' };

    expect(sanitizeProyectos([a, b])).toHaveLength(1);
  });

  it('conserva proyectos sin expediente, que no se pueden deduplicar', () => {
    const rows = [
      { numero: 1, nombre_proyecto: 'PROYECTO SIN EXPEDIENTE', expediente: null },
      { numero: 2, nombre_proyecto: 'PROYECTO SIN EXPEDIENTE', expediente: '' },
    ];

    expect(sanitizeProyectos(rows)).toHaveLength(2);
  });

  it('no toca filas que ya estan limpias', () => {
    const rows = [
      { numero: 1, nombre_proyecto: 'PLANTA FOGASA', expediente: 'SSMAA-DIRA-2936-2026' },
      { numero: 2, nombre_proyecto: 'PLANTA GREENFIELD', expediente: 'SSMAA-DIRA-2738-2025' },
    ];

    expect(sanitizeProyectos(rows)).toEqual(rows);
  });

  it('tolera null y undefined', () => {
    expect(sanitizeProyectos(null)).toEqual([]);
    expect(sanitizeProyectos(undefined)).toEqual([]);
    expect(sanitizeProyectos([])).toEqual([]);
  });
});

describe('sanitizeResolutivos', () => {
  it('descarta las filas de relleno con todo en NULL', () => {
    // Caso real: boletin 202640, ids 5535 y 5536.
    const rows = [
      { numero: 1, expediente: null, nombre_proyecto: null, municipio: null },
      { numero: 2, expediente: null, nombre_proyecto: null, municipio: null },
    ];

    expect(sanitizeResolutivos(rows)).toEqual([]);
  });

  it('descarta las filas de relleno con el placeholder "X"', () => {
    // Caso real: boletin 202640, id 5537.
    const row = {
      numero: 1,
      expediente: 'X',
      nombre_proyecto: 'X',
      municipio: 'X',
      giro: 'X',
      tipo_estudio: 'X',
      promovente: 'X',
    };

    expect(sanitizeResolutivos([row])).toEqual([]);
  });

  it('elimina duplicados exactos y conserva los resolutivos reales', () => {
    const real = {
      numero: 1,
      expediente: 'SSMAA-DIRA-2900-2026',
      nombre_proyecto: 'PLANTA NORTE',
      tipo_estudio: 'MIA',
      fecha_resolutivo: '2026-05-04',
      no_oficio_resolutivo: 'SMA-DOF-001',
    };

    const limpio = sanitizeResolutivos([real, { ...real }]);

    expect(limpio).toHaveLength(1);
    expect(limpio[0].no_oficio_resolutivo).toBe('SMA-DOF-001');
  });

  it('conserva un resolutivo con poco contenido pero con fecha', () => {
    const row = {
      numero: 7,
      expediente: 'SSMAA-DIRA-2907-2026',
      nombre_proyecto: 'ALSUPER TECNOLÓGICO',
      fecha_resolutivo: '2026-06-30',
    };

    expect(sanitizeResolutivos([row])).toHaveLength(1);
  });
});

describe('isPlaceholderRow', () => {
  it('trata como placeholder los valores no informativos', () => {
    expect(
      isPlaceholderRow(
        { expediente: '-', nombre_proyecto: 'N/A', municipio: null },
        PROYECTO_FIELDS,
      ),
    ).toBe(true);
    expect(
      isPlaceholderRow(
        { expediente: 'SSMAA-DIRA-1-2026', nombre_proyecto: null, municipio: null },
        RESOLUTIVO_FIELDS,
      ),
    ).toBe(false);
  });
});

describe('countDiscarded', () => {
  it('reporta cuantas filas se quitaron', () => {
    const rows = [
      { expediente: 'X', nombre_proyecto: 'X' },
      { expediente: 'X', nombre_proyecto: 'X' },
    ];
    const limpio = sanitizeResolutivos(rows);

    expect(countDiscarded(rows, limpio)).toBe(2);
    expect(countDiscarded(null, limpio)).toBe(0);
  });
});
