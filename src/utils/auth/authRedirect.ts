/**
 * URL absoluta a la que Supabase redirige tras validar el magic link (`emailRedirectTo`).
 * No sustituye `{{ .ConfirmationURL }}` en la plantilla del correo: ese enlace sigue siendo el de Supabase.
 *
 * Prioridad:
 * 1. `VITE_AUTH_EMAIL_REDIRECT_URL` — URL completa (p. ej. https://mapeoverde.org/admin).
 * 2. `VITE_SITE_URL` + `/admin` (respeta `BASE_URL` si el sitio vive en subruta).
 * 3. `window.location.origin` + `/admin` (desarrollo o mismo dominio desde el que piden el enlace).
 * 4. Producción sin origen conocido: https://mapeoverde.org/admin
 * 5. Desarrollo sin origen: http://localhost:3000/admin
 *
 * En Supabase: Authentication → URL Configuration → "Redirect URLs" debe incluir al menos:
 * - la misma URL que uses aquí (p. ej. https://mapeoverde.org/admin), y
 * - la raíz del sitio (https://mapeoverde.org/) por si el proyecto redirige al "Site URL";
 *   la app ahora lee el token en la primera carga desde cualquier ruta.
 */
const CANONICAL_PROD_ADMIN = 'https://mapeoverde.org/admin';

export function getAuthEmailRedirectUrl(): string {
  const explicit = import.meta.env.VITE_AUTH_EMAIL_REDIRECT_URL?.trim();
  if (explicit) return explicit;

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
    if (import.meta.env.PROD) {
      return CANONICAL_PROD_ADMIN;
    }
    return adminPath.startsWith('http') ? adminPath : `http://localhost:3000${adminPath}`;
  }

  return `${origin}${adminPath}`;
}
