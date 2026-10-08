import { describe, expect, it } from 'vitest';
import { normalizeExternalUrl } from '../features/investigacion/lib/urls';

describe('normalizeExternalUrl', () => {
  it('convierte a %20 los espacios que trae la BD', () => {
    // Caso real: boletin 202601 tal como esta guardado en boletines.filename.
    const crudo =
      'https://www.aguascalientes.gob.mx/SSMAA/BoletinesSMA/Repositorio/2026/01 Enero 2026/BOLETIN01-2026_06 DE ENERO_DEL2912_0201.pdf';

    expect(normalizeExternalUrl(crudo)).toBe(
      'https://www.aguascalientes.gob.mx/SSMAA/BoletinesSMA/Repositorio/2026/01%20Enero%202026/BOLETIN01-2026_06%20DE%20ENERO_DEL2912_0201.pdf',
    );
  });

  it('deja intacta una URL que ya viene codificada', () => {
    const encoded =
      'https://www.aguascalientes.gob.mx/SSMAA/BoletinesSMA/Repositorio/2026/01%20Enero%202026/BOLETIN01-2026_06%20DE%20ENERO_DEL2912_0201.pdf';

    expect(normalizeExternalUrl(encoded)).toBe(encoded);
  });

  it('es idempotente', () => {
    const crudo = 'https://ejemplo.org/a b/c d.pdf';
    const una = normalizeExternalUrl(crudo);

    expect(normalizeExternalUrl(una)).toBe(una);
  });

  it('no toca las URLs de Google Maps que ya son validas', () => {
    expect(normalizeExternalUrl('https://www.google.com/maps?q=21.88,-102.29')).toBe(
      'https://www.google.com/maps?q=21.88,-102.29',
    );
  });

  it('devuelve cadena vacia sin valor', () => {
    expect(normalizeExternalUrl(null)).toBe('');
    expect(normalizeExternalUrl(undefined)).toBe('');
    expect(normalizeExternalUrl('   ')).toBe('');
  });

  it('preserva los query strings con varios parametros', () => {
    // El & es separador legitimo: escaparlo a %26 romperia la URL.
    expect(normalizeExternalUrl('https://ejemplo.org/buscar?q=1&page=2')).toBe(
      'https://ejemplo.org/buscar?q=1&page=2',
    );
  });

  it('codifica espacios incluso si la URL es invalida', () => {
    expect(normalizeExternalUrl('no-es-una-url con espacios')).toBe(
      'no-es-una-url%20con%20espacios',
    );
  });
});
