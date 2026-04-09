/**
 * URL absoluta a la que Supabase redirige tras abrir el enlace del correo (magic link).
 *
 * - En producción el build debe definir `VITE_SITE_URL` (p. ej. https://www.mapeoverde.org)
 *   para que el enlace del correo apunte al dominio público aunque la Site URL del
 *   proyecto en Supabase siga teniendo localhost para desarrollo.
 * - En Supabase: Authentication → URL Configuration → añade la misma URL (y `/**`) en
 *   "Redirect URLs", y pon "Site URL" al dominio de producción si quieres que sea el
 *   predeterminado.
 *
 * Respeta `import.meta.env.BASE_URL` (GitHub Pages en subruta vs raíz con dominio propio).
 */
export function getAuthEmailRedirectUrl(): string {
  const rawBase = import.meta.env.BASE_URL ?? '/';
  const baseSegment =
    rawBase === '/' ? '' : String(rawBase).replace(/\/+$/, '');
  const adminPath = baseSegment ? `${baseSegment}/admin` : '/admin';

  const fromEnv = import.meta.env.VITE_SITE_URL?.trim().replace(/\/+$/, '');
  const origin =
    fromEnv ||
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : '');

  if (!origin) {
    return adminPath.startsWith('http') ? adminPath : `http://localhost:3000${adminPath}`;
  }

  return `${origin}${adminPath}`;
}
