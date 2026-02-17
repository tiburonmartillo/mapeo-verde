import { getSupabaseClient } from './client';
import { queryCache } from './cache';
import { requestDeduplicator } from './requestDeduplication';
import type { GreenAreaRow, ProjectRow, GazetteRow, EventRow, AreasDonacionRow, DocumentosJsonRow } from './types';
import { mapBoletinesToProjects, mapGacetasToDataset } from '../../utils/helpers';
import { projectId } from '../../utils/supabase/info';

/** Extrae la primera URL de una celda tipo "nombre (https://...)" o URL suelta */
function extractFirstUrl(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return '';
  const inParens = /\((https:\/\/[^)]+)\)/.exec(text);
  if (inParens) return inParens[1].trim();
  if (text.startsWith('http')) return text.split(/\s/)[0].trim();
  return '';
}

/** Construye la URL base pública al bucket de imágenes de áreas de donación en Supabase Storage */
function getAreasDonacionStorageBaseUrl(): string {
  if (!projectId) return '';
  return `https://${projectId}.supabase.co/storage/v1/object/public/public-data/areas_donacion`;
}

/**
 * Dado un nombre de archivo o URL original, construye la URL .webp
 * correspondiente en el bucket `public-data/areas_donacion`.
 */
function mapToStorageWebp(filenameOrUrl: string | null | undefined): string {
  if (!filenameOrUrl) return '';

  // Primero intentar extraer una URL limpia si viene en formato "Nombre (https://...)"
  const url = extractFirstUrl(filenameOrUrl) || String(filenameOrUrl);

  // Tomar solo el último segmento (nombre del archivo)
  const lastSegment = url.split('/').pop() || url;

  // Quitar posibles paréntesis o texto extra
  const clean = lastSegment.split('(')[0].trim();

  // Quitar extensión (.jpg, .png, etc.)
  const base = clean.replace(/\.[a-zA-Z0-9]+$/, '');
  if (!base) return '';

  const baseUrl = getAreasDonacionStorageBaseUrl();
  if (!baseUrl) return '';

  return `${baseUrl}/${encodeURIComponent(base)}.webp`;
}

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

const mapAreasDonacionRowToGreenArea = (row: AreasDonacionRow): GreenArea => {
  // Los datos pueden venir de una fila "plana" (tabla areas_donacion)
  // o anidados dentro de la propiedad data (tabla areas_donacion_json).
  const src: any = (row as any).data ?? row;

  const name =
    src.lugar ??
    src.Lugar ??
    src.nombre ??
    src.Nombre ??
    src.name ??
    src.Name ??
    `Área ${src.id ?? row.id}`;

  const address = src.direccion ?? src.Dirección ?? row.direccion ?? '';

  const lat = Number(src.latitud ?? src.Latitud ?? row.latitud) || 0;
  const lng = Number(src.longitud ?? src.Longitud ?? row.longitud) || 0;

  const portada = src.portada ?? src.Portada ?? row.portada;
  const evidencia = src.evidencia ?? src.Evidencia ?? row.evidencia;
  const storageImage =
    mapToStorageWebp(portada) || mapToStorageWebp(evidencia);
  const fallbackImage =
    extractFirstUrl(portada) || extractFirstUrl(evidencia) || '';
  const image = storageImage || fallbackImage;

  const tipo = src.tipo ?? src.Tipo ?? row.tipo;
  const estado = src.estado ?? src.Estado ?? row.estado;
  const necesidad = src.necesidad ?? src.Necesidad ?? row.necesidad;

  const need = necesidad ?? estado ?? '';
  const tags: string[] = [];
  if (tipo) tags.push(String(tipo));
  if (estado) tags.push(String(estado));
  if (necesidad) tags.push(String(necesidad));
  if (tags.length === 0) tags.push('Área verde');
  return {
    id: Number(src.id ?? row.id),
    name: String(name),
    address: String(address),
    lat,
    lng,
    tags,
    need: String(need),
    image,
  };
};

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
 * Obtiene áreas verdes desde la tabla areas_donacion (datos del CSV subido por upload_areas_donacion.py).
 * Si hay datos, se usan para llenar la página de áreas verdes; si no, usar getGreenAreas o datos estáticos.
 */
export const getAreasDonacion = async (options: QueryOptions = {}): Promise<GreenArea[]> => {
  const { useCache = true, cacheTTL, fallback = [] } = options;
  const cacheKey = queryCache.generateKey('areas_donacion');

  if (useCache) {
    const cached = queryCache.get<GreenArea[]>(cacheKey);
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

      const fetchTable = async (table: string): Promise<AreasDonacionRow[] | null> => {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('id', { ascending: true })
          .returns<AreasDonacionRow[]>();

        if (error || !data || data.length === 0) {
          return null;
        }
        return data;
      };

      // Prioridad: tabla relacional areas_donacion → tabla JSON areas_donacion_json
      let data: AreasDonacionRow[] | null = await fetchTable('areas_donacion');
      let isJsonTable = false;
      if (!data) {
        data = await fetchTable('areas_donacion_json');
        isJsonTable = !!data;
      }
      if (!data) {
        return fallback;
      }

      // Si viene de areas_donacion_json, el campo data puede ser un array de áreas
      let rowsToMap: AreasDonacionRow[] = [];
      if (isJsonTable && data.length > 0) {
        const firstRow = data[0] as any;
        if (firstRow.data && Array.isArray(firstRow.data)) {
          // data es un array: [{ Lugar: "...", ID: 1, ... }, ...]
          rowsToMap = firstRow.data.map((item: any) => ({
            id: item.ID ?? item.id ?? 0,
            data: item, // El mapper extraerá los campos de aquí
          })) as AreasDonacionRow[];
        } else if (firstRow.data && typeof firstRow.data === 'object') {
          // data es un objeto único: { Lugar: "...", ID: 1, ... }
          rowsToMap = [{
            id: firstRow.data.ID ?? firstRow.data.id ?? firstRow.id ?? 0,
            data: firstRow.data,
          } as AreasDonacionRow];
        } else {
          // Estructura plana o desconocida, usar como está
          rowsToMap = data;
        }
      } else {
        // Tabla relacional, usar directamente
        rowsToMap = data;
      }

      const result = rowsToMap.map(mapAreasDonacionRowToGreenArea);

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
 * Obtiene proyectos desde Supabase con caché y deduplicación.
 * Intenta primero la tabla relacional `projects`; si no existe, usa `boletines_json`.
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

      // Intentar tabla relacional primero
      let { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('date', { ascending: false });

      // Si falla o está vacía, intentar boletines_json
      if (error || !data || data.length === 0) {
        const jsonResult = await supabase
          .from('boletines_json')
          .select('*')
          .order('id', { ascending: false });

        if (!jsonResult.error && jsonResult.data && jsonResult.data.length > 0) {
          // Extraer el array de boletines del campo data (puede ser data.boletines o data directamente)
          const jsonData = jsonResult.data[0]?.data;
          if (jsonData?.boletines && Array.isArray(jsonData.boletines)) {
            // Usar el mapper existente que ya maneja el formato { boletines: [...] }
            const { mapBoletinesToProjects } = await import('../../utils/helpers/dataTransformers');
            const mapped = mapBoletinesToProjects(jsonData);
            const result = Array.isArray(mapped) ? mapped : [];
            if (useCache && result.length > 0) {
              queryCache.set(cacheKey, result, cacheTTL);
            }
            return result;
          }
        }
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
 * Obtiene gacetas desde Supabase con caché y deduplicación.
 * Intenta primero la tabla relacional `gazettes`; si no existe, usa `gacetas_json`.
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

      // Intentar tabla relacional primero
      let { data, error } = await supabase
        .from('gazettes')
        .select('*')
        .order('date', { ascending: false });

      // Si falla o está vacía, intentar gacetas_json
      if (error || !data || data.length === 0) {
        const jsonResult = await supabase
          .from('gacetas_json')
          .select('*')
          .order('id', { ascending: false });

        if (!jsonResult.error && jsonResult.data && jsonResult.data.length > 0) {
          // Extraer el array de gacetas del campo data (puede ser data.analyses o data directamente)
          const jsonData = jsonResult.data[0]?.data;
          if (jsonData?.analyses && Array.isArray(jsonData.analyses)) {
            // Usar el mapper existente que ya maneja el formato { analyses: [...] }
            const { mapGacetasToDataset } = await import('../../utils/helpers/dataTransformers');
            const mapped = mapGacetasToDataset(jsonData);
            const result = Array.isArray(mapped) ? mapped : [];
            if (useCache && result.length > 0) {
              queryCache.set(cacheKey, result, cacheTTL);
            }
            return result;
          }
        }
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

/**
 * Obtiene áreas verdes desde documentos_json (tabla unificada)
 * Lee documentos con source_type = 'areas_donacion' y mapea a GreenArea
 */
export const getAreasDonacionFromJson = async (options: QueryOptions = {}): Promise<GreenArea[]> => {
  const { useCache = true, cacheTTL, fallback = [] } = options;
  const cacheKey = queryCache.generateKey('documentos_json_areas_donacion');

  if (useCache) {
    const cached = queryCache.get<GreenArea[]>(cacheKey);
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
        .from('documentos_json')
        .select('*')
        .eq('source_type', 'areas_donacion')
        .order('source_id', { ascending: true })
        .returns<DocumentosJsonRow[]>();

      if (error || !data || data.length === 0) {
        return fallback;
      }

      // Extraer y mapear los datos JSON
      const rowsToMap: AreasDonacionRow[] = [];
      for (const row of data) {
        const jsonData = row.data;
        
        if (Array.isArray(jsonData)) {
          // Si data es un array de áreas
          jsonData.forEach((item: any) => {
            rowsToMap.push({
              id: item.ID ?? item.id ?? row.source_id,
              lugar: item.Lugar ?? item.lugar ?? item.nombre ?? item.name,
              nombre: item.nombre ?? item.name,
              name: item.name,
              tipo: item.Tipo ?? item.tipo,
              direccion: item.Dirección ?? item.direccion ?? item.address,
              latitud: item.Latitud ?? item.latitud ?? item.lat,
              longitud: item.Longitud ?? item.longitud ?? item.lng,
              portada: item.Portada ?? item.portada ?? item.image,
              evidencia: item.Evidencia ?? item.evidencia,
              video: item.Video ?? item.video,
              estado: item.Estado ?? item.estado,
              necesidad: item.Necesidad ?? item.necesidad ?? item.need,
              data: item,
            } as AreasDonacionRow);
          });
        } else if (jsonData && typeof jsonData === 'object') {
          // Si data es un objeto único
          rowsToMap.push({
            id: jsonData.ID ?? jsonData.id ?? row.source_id,
            lugar: jsonData.Lugar ?? jsonData.lugar ?? jsonData.nombre ?? jsonData.name,
            nombre: jsonData.nombre ?? jsonData.name,
            name: jsonData.name,
            tipo: jsonData.Tipo ?? jsonData.tipo,
            direccion: jsonData.Dirección ?? jsonData.direccion ?? jsonData.address,
            latitud: jsonData.Latitud ?? jsonData.latitud ?? jsonData.lat,
            longitud: jsonData.Longitud ?? jsonData.longitud ?? jsonData.lng,
            portada: jsonData.Portada ?? jsonData.portada ?? jsonData.image,
            evidencia: jsonData.Evidencia ?? jsonData.evidencia,
            video: jsonData.Video ?? jsonData.video,
            estado: jsonData.Estado ?? jsonData.estado,
            necesidad: jsonData.Necesidad ?? jsonData.necesidad ?? jsonData.need,
            data: jsonData,
          } as AreasDonacionRow);
        }
      }

      if (rowsToMap.length === 0) {
        return fallback;
      }

      const result = rowsToMap.map(mapAreasDonacionRowToGreenArea);

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
 * Obtiene proyectos desde documentos_json (tabla unificada)
 * Lee documentos con source_type = 'boletines' y mapea a Project usando mapBoletinesToProjects
 */
export const getProjectsFromJson = async (options: QueryOptions = {}): Promise<Project[]> => {
  const { useCache = true, cacheTTL, fallback = [] } = options;
  const cacheKey = queryCache.generateKey('documentos_json_boletines');

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
        .from('documentos_json')
        .select('*')
        .eq('source_type', 'boletines')
        .order('source_id', { ascending: false })
        .returns<DocumentosJsonRow[]>();

      if (error || !data || data.length === 0) {
        return fallback;
      }

      // Extraer los datos JSON y mapearlos usando mapBoletinesToProjects
      const boletinesData: any[] = [];
      for (const row of data) {
        const jsonData = row.data;
        
        if (Array.isArray(jsonData)) {
          // Si data es un array de boletines
          boletinesData.push(...jsonData);
        } else if (jsonData && typeof jsonData === 'object') {
          // Si data es un objeto único o tiene estructura { boletines: [...] }
          if (jsonData.boletines && Array.isArray(jsonData.boletines)) {
            boletinesData.push(...jsonData.boletines);
          } else {
            boletinesData.push(jsonData);
          }
        }
      }

      if (boletinesData.length === 0) {
        return fallback;
      }

      // Usar el mapper existente
      const result = mapBoletinesToProjects(boletinesData);

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
 * Obtiene gacetas desde documentos_json (tabla unificada)
 * Lee documentos con source_type = 'gacetas' y mapea a Gazette usando mapGacetasToDataset
 */
export const getGazettesFromJson = async (options: QueryOptions = {}): Promise<Gazette[]> => {
  const { useCache = true, cacheTTL, fallback = [] } = options;
  const cacheKey = queryCache.generateKey('documentos_json_gacetas');

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
        .from('documentos_json')
        .select('*')
        .eq('source_type', 'gacetas')
        .order('source_id', { ascending: false })
        .returns<DocumentosJsonRow[]>();

      if (error || !data || data.length === 0) {
        return fallback;
      }

      // Extraer los datos JSON y mapearlos usando mapGacetasToDataset
      const gacetasData: any[] = [];
      for (const row of data) {
        const jsonData = row.data;
        
        if (Array.isArray(jsonData)) {
          // Si data es un array de gacetas
          gacetasData.push(...jsonData);
        } else if (jsonData && typeof jsonData === 'object') {
          // Si data es un objeto único o tiene estructura { analyses: [...] }
          if (jsonData.analyses && Array.isArray(jsonData.analyses)) {
            gacetasData.push(...jsonData.analyses);
          } else if (jsonData.registros && Array.isArray(jsonData.registros)) {
            gacetasData.push(...jsonData.registros);
          } else {
            gacetasData.push(jsonData);
          }
        }
      }

      if (gacetasData.length === 0) {
        return fallback;
      }

      // Usar el mapper existente
      const result = mapGacetasToDataset(gacetasData);

      if (useCache && result.length > 0) {
        queryCache.set(cacheKey, result, cacheTTL);
      }

      return result;
    } catch (error) {
      return fallback;
    }
  });
};

