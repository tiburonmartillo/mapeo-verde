/**
 * URL absoluta a la que Supabase redirige tras abrir el enlace del correo.
 * Debe ser la ruta donde gestionas eventos (`/admin`). Respeta `import.meta.env.BASE_URL`.
 */
export function getAuthEmailRedirectUrl(): string {
  const base = import.meta.env.BASE_URL ?? '/';
  return new URL('admin', `${window.location.origin}${base}`).href;
}
