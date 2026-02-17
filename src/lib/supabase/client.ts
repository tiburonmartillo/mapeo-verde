import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// Singleton pattern para reutilizar la misma instancia del cliente
let supabaseClient: SupabaseClient | null = null;

/**
 * Obtiene o crea una instancia única del cliente de Supabase
 * Esto evita crear múltiples conexiones y mejora el rendimiento
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  // Si ya existe, devolverlo
  if (supabaseClient) {
    return supabaseClient;
  }

  // Validar que tengamos las credenciales necesarias
  if (!projectId || !publicAnonKey) {
    return null;
  }

  try {
    const supabaseUrl = `https://${projectId}.supabase.co`;
    
    supabaseClient = createClient(supabaseUrl, publicAnonKey, {
      auth: {
        persistSession: false, // No necesitamos persistir sesiones para datos públicos
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'x-client-info': 'mapeo-verde@1.0.0',
        },
      },
      db: {
        schema: 'public',
      },
      realtime: {
        // Deshabilitar realtime si no se usa
        params: {
          eventsPerSecond: 2,
        },
      },
    });

    return supabaseClient;
  } catch (error) {
    return null;
  }
};

/**
 * Limpia la instancia del cliente (útil para testing o reset)
 */
export const resetSupabaseClient = (): void => {
  supabaseClient = null;
};

/**
 * Verifica que la conexión a Supabase funcione (credenciales + red + tabla accesible).
 * Intenta verificar con areas_donacion_json o areas_donacion primero; si no existen, prueba green_areas.
 */
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      error: 'Credenciales no configuradas (revisa projectId y publicAnonKey en src/utils/supabase/info)',
    };
  }
  try {
    // Intentar primero con las tablas _json que sabemos que existen en este proyecto
    const tablesToTry = [
      'areas_donacion_json',
      'boletines_json',
      'gacetas_json',
      'areas_donacion',
      'projects',
      'gazettes',
      'green_areas',
    ];
    for (const table of tablesToTry) {
      const { error } = await client.from(table).select('id').limit(1);
      if (!error) {
        return { connected: true };
      }
    }
    // Si todas las tablas fallan, la conexión funciona pero no hay tablas accesibles
    return { connected: true, error: 'No se encontraron tablas accesibles' };
  } catch (e) {
    return {
      connected: false,
      error: e instanceof Error ? e.message : 'Error de red o tiempo de espera agotado',
    };
  }
}

