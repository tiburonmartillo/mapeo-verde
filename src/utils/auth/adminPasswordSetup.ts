import type { Session } from '@supabase/supabase-js';

/** user_metadata: el usuario ya definió contraseña desde el modal de admin (o entró con contraseña). */
export const META_ADMIN_PASSWORD_DONE = 'mv_admin_password_done';
/** user_metadata: el usuario eligió no configurar contraseña por ahora. */
export const META_SKIP_ADMIN_PASSWORD = 'mv_skip_admin_password';

const PASSWORD_AMR_METHODS = new Set(['password', 'pwd']);

/**
 * Indica si esta sesión se obtuvo autenticando con contraseña (claim `amr` del access token).
 * Así no pedimos contraseña a quien acaba de entrar con correo y contraseña.
 */
export function sessionUsedPasswordThisSession(session: Session): boolean {
  try {
    const parts = session.access_token.split('.');
    if (parts.length < 2) return false;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded)) as { amr?: unknown };
    const amr = payload.amr;
    if (!Array.isArray(amr)) return false;
    for (const entry of amr) {
      const method =
        typeof entry === 'string'
          ? entry
          : entry && typeof entry === 'object' && 'method' in entry
            ? String((entry as { method?: string }).method)
            : '';
      if (method && PASSWORD_AMR_METHODS.has(method.toLowerCase())) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

export function shouldPromptAdminPasswordSetup(session: Session | null): boolean {
  if (!session?.user) return false;
  const m = session.user.user_metadata ?? {};
  if (m[META_ADMIN_PASSWORD_DONE] === true || m[META_SKIP_ADMIN_PASSWORD] === true) {
    return false;
  }
  if (sessionUsedPasswordThisSession(session)) {
    return false;
  }
  return true;
}
