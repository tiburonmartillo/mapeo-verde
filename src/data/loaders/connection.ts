import { getSupabaseClient } from '../../lib/supabase/client';
import { queryCache } from '../../lib/supabase/cache';
import { requestDeduplicator } from '../../lib/supabase/requestDeduplication';

export type ConnectionStatus = {
  connected: boolean;
  error?: string;
};

const CACHE_KEY = 'health:supabase';
const CACHE_TTL_MS = 2 * 60 * 1000;

/**
 * Health check barato: una sola tabla conocida.
 * Sustituye el loop de 7 tablas de checkSupabaseConnection en el path lazy.
 */
export async function checkSupabaseHealth(options?: {
  useCache?: boolean;
}): Promise<ConnectionStatus> {
  const useCache = options?.useCache !== false;

  if (useCache) {
    const cached = queryCache.get<ConnectionStatus>(CACHE_KEY);
    if (cached) return cached;
  }

  return requestDeduplicator.dedupe(CACHE_KEY, async () => {
    const client = getSupabaseClient();
    if (!client) {
      const result: ConnectionStatus = {
        connected: false,
        error:
          'Credenciales no configuradas (revisa projectId y publicAnonKey en src/utils/supabase/info)',
      };
      return result;
    }

    try {
      // Tabla canónica del proyecto; si falla, un reintento en events (siempre usada).
      const primary = await client.from('areas_donacion_json').select('id').limit(1);
      if (!primary.error) {
        const result: ConnectionStatus = { connected: true };
        if (useCache) queryCache.set(CACHE_KEY, result, CACHE_TTL_MS);
        return result;
      }

      const fallback = await client.from('events').select('id').limit(1);
      if (!fallback.error) {
        const result: ConnectionStatus = { connected: true };
        if (useCache) queryCache.set(CACHE_KEY, result, CACHE_TTL_MS);
        return result;
      }

      const result: ConnectionStatus = {
        connected: true,
        error: 'No se encontraron tablas accesibles',
      };
      if (useCache) queryCache.set(CACHE_KEY, result, CACHE_TTL_MS);
      return result;
    } catch (e) {
      return {
        connected: false,
        error: e instanceof Error ? e.message : 'Error de red o tiempo de espera agotado',
      };
    }
  });
}
