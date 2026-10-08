/**
 * Normalizacion de URLs de boletines para usarlas como enlaces.
 *
 * Los filenames se guardan en la BD con espacios literales, tal cual vienen del
 * sitio de origen:
 *
 *   https://.../2026/01 Enero 2026/BOLETIN01-2026_06 DE ENERO_DEL2912_0201.pdf
 *
 * En el HTML del correo un href con espacios se corta en el primer espacio, asi que
 * el link queda roto en los clientes de correo que no los toleran. La fuente real
 * usa %20.
 */

/**
 * Devuelve la URL lista para un href. `new URL` convierte los espacios a %20 y es
 * idempotente, asi que una URL que ya venga codificada no se altera. Si la URL es
 * invalida se devuelve codificando solo los espacios, en vez de romper.
 */
export function normalizeExternalUrl(value: string | null | undefined): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  try {
    return new URL(raw).href;
  } catch {
    return raw.replace(/\s+/g, '%20');
  }
}
