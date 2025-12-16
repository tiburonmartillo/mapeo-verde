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
    console.warn('Supabase credentials not found. Using fallback data.');
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
    console.error('Error creating Supabase client:', error);
    return null;
  }
};

/**
 * Limpia la instancia del cliente (útil para testing o reset)
 */
export const resetSupabaseClient = (): void => {
  supabaseClient = null;
};

