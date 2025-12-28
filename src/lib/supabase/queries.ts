import { getSupabaseClient } from './client';
import { queryCache } from './cache';
import { requestDeduplicator } from './requestDeduplication';
import type { GreenAreaRow, ProjectRow, GazetteRow, EventRow } from './types';

/**
 * Tipos de datos compatibles con el formato esperado por la aplicación
 * Estos mapean desde los tipos de Supabase al formato usado en la UI
 */
export interface GreenArea {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  tags: string[];
  need: string;
  image: string;
}

export interface Project {
  id: string;
  project: string;
  promoter: string;
  type: string;
  date: string;
  year: string;
  status: string;
  lat: number;
  lng: number;
  description: string;
  impact: string;
}

export interface Gazette {
  id: string;
  project: string;
  promoter: string;
  type: string;
  date: string;
  year: string;
  status: string;
  lat: number;
  lng: number;
  description: string;
  impact: string;
}

export interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  isoStart: string;
  isoEnd: string;
  location: string;
  category: string;
  image: string;
  description: string;
}

/**
 * Helper para mapear EventRow de Supabase a Event de la aplicación
 */
const mapEventRowToEvent = (row: EventRow): Event => ({
  id: row.id,
  title: row.title,
  date: row.date,
  time: row.time,
  isoStart: row.iso_start,
  isoEnd: row.iso_end,
  location: row.location,
  category: row.category,
  image: row.image || '',
  description: row.description || '',
});

/**
 * Helper para mapear GreenAreaRow de Supabase a GreenArea de la aplicación
 */
const mapGreenAreaRowToGreenArea = (row: GreenAreaRow): GreenArea => ({
  id: row.id,
  name: row.name,
  address: row.address,
  lat: row.lat,
  lng: row.lng,
  tags: row.tags || [],
  need: row.need || '',
  image: row.image || '',
});

/**
 * Opciones para queries con caché
 */
interface QueryOptions {
  useCache?: boolean;
  cacheTTL?: number; // Tiempo de vida del caché en milisegundos
  fallback?: any[]; // Datos de fallback si falla la query
}

/**
 * Obtiene áreas verdes desde Supabase con caché y deduplicación
 */
export const getGreenAreas = async (options: QueryOptions = {}): Promise<GreenArea[]> => {
  const { useCache = true, cacheTTL, fallback = [] } = options;
  const cacheKey = queryCache.generateKey('green_areas');

  // Intentar obtener del caché
  if (useCache) {
    const cached = queryCache.get<GreenArea[]>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Usar deduplicación para evitar requests simultáneos idénticos
  return requestDeduplicator.dedupe(cacheKey, async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return fallback;
      }

      const { data, error } = await supabase
        .from('green_areas')
        .select('*')
        .order('id', { ascending: true })
        .returns<GreenAreaRow[]>();

      if (error) {
        return fallback;
      }

      const result = (data || []).map(mapGreenAreaRowToGreenArea);

      // Guardar en caché
      if (useCache && result.length > 0) {
        queryCache.set(cacheKey, result, cacheTTL);
      }

      return result;
    } catch (error) {
      return fallback;
    }
  });
};

/**
 * Obtiene proyectos desde Supabase con caché y deduplicación
 */
export const getProjects = async (options: QueryOptions = {}): Promise<Project[]> => {
  const { useCache = true, cacheTTL, fallback = [] } = options;
  const cacheKey = queryCache.generateKey('projects');

  if (useCache) {
    const cached = queryCache.get<Project[]>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  return requestDeduplicator.dedupe(cacheKey, async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return fallback;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        return fallback;
      }

      const result = (data || []) as Project[];

      if (useCache && result.length > 0) {
        queryCache.set(cacheKey, result, cacheTTL);
      }

      return result;
    } catch (error) {
      return fallback;
    }
  });
};

/**
 * Obtiene gacetas desde Supabase con caché y deduplicación
 */
export const getGazettes = async (options: QueryOptions = {}): Promise<Gazette[]> => {
  const { useCache = true, cacheTTL, fallback = [] } = options;
  const cacheKey = queryCache.generateKey('gazettes');

  if (useCache) {
    const cached = queryCache.get<Gazette[]>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  return requestDeduplicator.dedupe(cacheKey, async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return fallback;
      }

      const { data, error } = await supabase
        .from('gazettes')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        return fallback;
      }

      const result = (data || []) as Gazette[];

      if (useCache && result.length > 0) {
        queryCache.set(cacheKey, result, cacheTTL);
      }

      return result;
    } catch (error) {
      return fallback;
    }
  });
};

/**
 * Obtiene eventos desde Supabase con caché y deduplicación
 */
export const getEvents = async (options: QueryOptions = {}): Promise<Event[]> => {
  const { useCache = true, cacheTTL, fallback = [] } = options;
  const cacheKey = queryCache.generateKey('events');

  if (useCache) {
    const cached = queryCache.get<Event[]>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  return requestDeduplicator.dedupe(cacheKey, async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return fallback;
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })
        .gte('date', new Date().toISOString().split('T')[0])
        .returns<EventRow[]>(); // Solo eventos futuros

      if (error) {
        return fallback;
      }

      const result = (data || []).map(mapEventRowToEvent);

      if (useCache && result.length > 0) {
        queryCache.set(cacheKey, result, cacheTTL);
      }

      return result;
    } catch (error) {
      return fallback;
    }
  });
};

/**
 * Obtiene eventos pasados desde Supabase con caché y deduplicación
 */
export const getPastEvents = async (options: QueryOptions = {}): Promise<Event[]> => {
  const { useCache = true, cacheTTL, fallback = [] } = options;
  const cacheKey = queryCache.generateKey('past_events');

  if (useCache) {
    const cached = queryCache.get<Event[]>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  return requestDeduplicator.dedupe(cacheKey, async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return fallback;
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false })
        .lt('date', new Date().toISOString().split('T')[0])
        .returns<EventRow[]>(); // Solo eventos pasados

      if (error) {
        return fallback;
      }

      const result = (data || []).map(mapEventRowToEvent);

      if (useCache && result.length > 0) {
        queryCache.set(cacheKey, result, cacheTTL);
      }

      return result;
    } catch (error) {
      return fallback;
    }
  });
};

/**
 * Limpia el caché de todas las queries
 */
export const clearCache = (): void => {
  queryCache.clear();
};

