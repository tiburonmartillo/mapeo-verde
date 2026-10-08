import { describe, expect, it } from 'vitest';
import {
  claveExpediente,
  cruzaConIndice,
  indexarPorExpediente,
  mismaIdentidad,
} from '../features/investigacion/lib/data-utils';

describe('claveExpediente', () => {
  it('normaliza a una clave comparable entre boletines', () => {
    expect(claveExpediente('SSMAA-DIRA-2900-2026')).toBe('ssmaa-dira-2900-2026');
    expect(claveExpediente('  SSMAA DIRA 2900 2026  ')).toBe('ssmaa-dira-2900-2026');
    expect(claveExpediente('SSMAA/DIRA\\2900:2026')).toBe('ssmaa-dira-2900-2026');
  });

  it('devuelve cadena vacia cuando no hay expediente', () => {
    expect(claveExpediente(null)).toBe('');
    expect(claveExpediente(undefined)).toBe('');
    expect(claveExpediente('   ')).toBe('');
  });
});

describe('mismaIdentidad', () => {
  it('reconoce el mismo proyecto con diferencias menores de acentos y espacios', () => {
    expect(
      mismaIdentidad(
        { expediente: 'SSMAA-DIRA-2906-2026', nombre_proyecto: 'PLANTA MINTH CARROCERÍAS' },
        { expediente: 'ssmaa dira 2906 2026', nombre_proyecto: 'PLANTA MINTH CARROCERIAS' },
      ),
    ).toBe(true);
  });

  it('es conservador: no une nombres que solo se parecen', () => {
    // mismaIdentidad usa similitud Jaccard con umbral 0.75, asi que descarta el
    // emparejamiento. El ruido de OCR si se resuelve, pero con la clave
    // expediente + nombre normalizada de boletin-rows.ts, no aqui.
    expect(
      mismaIdentidad(
        { expediente: 'SSMAA-DIRA-2906-2026', nombre_proyecto: 'CONSTRUCCIÓN MULTIVIA' },
        { expediente: 'ssmaa dira 2906 2026', nombre_proyecto: 'CONSTRUCCIÓN MULTI VI' },
      ),
    ).toBe(false);
  });

  it('separa dos proyectos distintos que comparten expediente', () => {
    // Caso real: boletin 201747, SMAE-DIRA-1650-17.
    expect(
      mismaIdentidad(
        {
          expediente: 'SMAE-DIRA-1650-17',
          nombre_proyecto: 'AMPLIACIÓN MONTICELLO INDUSTRIAL',
          promovente: 'RESORTES MONTICELLO DE MÉXICO, S.A. DE C.V.',
        },
        {
          expediente: 'SMAE-DIRA-1650-17',
          nombre_proyecto: 'OPERACIÓN Y MANTENIMIENTO INDUSTRIAL',
          promovente: 'VITECHMEX NONWOVENS, S.A. DE C.V.',
        },
      ),
    ).toBe(false);
  });

  it('no relaciona expedientes distintos', () => {
    expect(
      mismaIdentidad(
        { expediente: 'SSMAA-DIRA-2900-2026', nombre_proyecto: 'PLANTA FOGASA' },
        { expediente: 'SSMAA-DIRA-2901-2026', nombre_proyecto: 'PLANTA FOGASA' },
      ),
    ).toBe(false);
  });
});

describe('indexarPorExpediente + cruzaConIndice', () => {
  const proyectos = [
    { expediente: 'SSMAA-DIRA-2879-2026', nombre_proyecto: 'PLANTA MINTH CARROCERÍAS' },
    { expediente: 'SSMAA-DIRA-2876-2026', nombre_proyecto: 'GRUPO CARTOMETAL' },
    { expediente: null, nombre_proyecto: 'PROYECTO SIN EXPEDIENTE' },
  ];

  it('encuentra el proyecto de ingreso de un resolutivo', () => {
    const index = indexarPorExpediente(proyectos);
    const resolutivo = { expediente: 'ssmaa dira 2879 2026', nombre_proyecto: 'PLANTA MINTH' };

    expect(cruzaConIndice(index, resolutivo)).toBe(true);
  });

  it('descarta proyectos sin expediente del indice', () => {
    const index = indexarPorExpediente(proyectos);

    expect(index.size).toBe(2);
    expect(index.has('')).toBe(false);
  });

  it('no encuentra nada cuando el expediente no existe', () => {
    const index = indexarPorExpediente(proyectos);

    expect(cruzaConIndice(index, { expediente: 'SSMAA-DIRA-9999-2026' })).toBe(false);
  });
});
