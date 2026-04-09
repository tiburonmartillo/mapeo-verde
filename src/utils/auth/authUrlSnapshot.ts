/**
 * Captura si la URL inicial traía tokens de Supabase (enlace mágico / PKCE).
 * Debe llamarse una vez al arranque, antes de `getSupabaseAuthClient()`, porque
 * el cliente limpia hash/query al intercambiar la sesión.
 */
let authTokensWereInInitialUrl = false;

export function snapshotSupabaseAuthUrlTokens(): void {
  if (typeof window === 'undefined') return;
  const { hash, search } = window.location;
  authTokensWereInInitialUrl =
    /access_token=/.test(hash) || /(?:^|[?&])code=/.test(search);
}

export function supabaseAuthTokensWereInInitialUrl(): boolean {
  return authTokensWereInInitialUrl;
}
