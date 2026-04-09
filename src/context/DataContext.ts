import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GREEN_AREAS_DATA, EVENTS_DATA, PAST_EVENTS_DATA } from '../data/static';
import {
  getAreasDonacion,
  getGreenAreas,
  getParticipationGreenAreas,
  getProjects,
  getGazettes,
  getEvents,
  getPastEvents,
  getAreasDonacionFromJson,
  getProjectsFromJson,
  getGazettesFromJson,
  checkSupabaseConnection,
  deduplicateEventsByIdAndContent,
} from '../lib/supabase';
import { mapBoletinesToProjects, mapGacetasToDataset } from '../utils/helpers';
// import { fetchGoogleCalendarEvents } from '../services/googleCalendar'; // bloqueado por el momento

export interface DataContextType {
  greenAreas: any[];
  projects: any[];
  gazettes: any[];
  events: any[];
  pastEvents: any[];
  refresh: () => Promise<void>;
  loading: boolean;
  error: string | null;
  /** Estado de conexión a Supabase (se verifica al cargar datos) */
  supabaseConnected: boolean;
  supabaseError: string | null;
}

export const DataContext = React.createContext<DataContextType>({
  greenAreas: [],
  projects: [],
  gazettes: [],
  events: [],
  pastEvents: [],
  refresh: async () => {},
  loading: true,
  error: null,
  supabaseConnected: false,
  supabaseError: null,
});

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<{
    greenAreas: any[];
    projects: any[];
    gazettes: any[];
    events: any[];
    pastEvents: any[];
  }>({
    greenAreas: [],
    projects: [],
    gazettes: [],
    events: [],
    pastEvents: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const lastAgendaEventsHashRef = useRef<string>('');

  const fetchAgendaEvents = useCallback(async () => {
    try {
      const [eventsSupabase /* , googleCalendarEvents */] = await Promise.all([
        getEvents({ useCache: false, fallback: [] }),
        // getParticipationEvents() ya no se mezcla: los publicados están en la tabla events
        // fetchGoogleCalendarEvents().catch(() => []), // bloqueado por el momento
      ]);

      let events: any[] = [];
      if (eventsSupabase && eventsSupabase.length > 0) {
        events = eventsSupabase;
      }

      if (events.length === 0) return;
      const deduped = deduplicateEventsByIdAndContent(events);
      const nextHash = deduped
        .map((e: any) => `${String(e?.id ?? '')}|${String(e?.isoStart ?? '')}|${String(e?.isoEnd ?? '')}`)
        .join(';;');
      if (nextHash === lastAgendaEventsHashRef.current) return;
      lastAgendaEventsHashRef.current = nextHash;

      setData((prev) => ({ ...prev, events: deduped }));
    } catch {
      // refresh silencioso: si falla, conservar lo ya mostrado
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const connection = await checkSupabaseConnection();
      setSupabaseConnected(connection.connected);
      setSupabaseError(connection.error ?? null);

      // Obtener el base URL de Vite (resuelve automáticamente el base path)
      const baseUrl = import.meta.env.BASE_URL || '/';
      // Normalizar las rutas: eliminar barras duplicadas
      const normalizePath = (path: string) => {
        // Asegurar que baseUrl termine con / y path no empiece con /
        const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        return `${cleanBase}${cleanPath}`.replace(/\/+/g, '/');
      };
      
      const boletinesUrl = normalizePath('data/boletines.json');
      const gacetasUrl = normalizePath('data/gacetas_semarnat_analizadas.json');

      // Prioridad: documentos_json (tabla unificada) → tablas relacionales → JSON estáticos
      const [
        areasDonacionFromJson,
        areasDonacion,
        greenAreasSupabase,
        participationGreenAreas,
        projectsFromJson,
        projectsSupabase,
        gazettesFromJson,
        gazettesSupabase,
        eventsSupabase,
        pastEventsSupabase,
        boletinesResponse,
        gacetasResponse,
        // googleCalendarEvents, // bloqueado por el momento
      ] = await Promise.all([
        getAreasDonacionFromJson({ useCache: true, fallback: [] }),
        getAreasDonacion({ useCache: true, fallback: [] }),
        getGreenAreas({ useCache: true, fallback: [] }),
        getParticipationGreenAreas(),
        getProjectsFromJson({ useCache: true, fallback: [] }),
        getProjects({ useCache: true, fallback: [] }),
        getGazettesFromJson({ useCache: true, fallback: [] }),
        getGazettes({ useCache: true, fallback: [] }),
        // Eventos y bitácora: sin caché para reflejar siempre los últimos cambios
        getEvents({ useCache: false, fallback: [] }),
        getPastEvents({ useCache: false, fallback: [] }),
        fetch(boletinesUrl).then(res => (res.ok ? res.json() : [])).catch(() => []),
        fetch(gacetasUrl).then(res => (res.ok ? res.json() : [])).catch(() => []),
        // fetchGoogleCalendarEvents().catch(() => []), // bloqueado por el momento
      ]);

      // Ordenar por fecha (más reciente primero); acepta YYYY-MM-DD o similares
      const byDateDesc = (a: any, b: any) => {
        const dA = (a?.date || '').toString().replace(/\//g, '-').slice(0, 10);
        const dB = (b?.date || '').toString().replace(/\//g, '-').slice(0, 10);
        return dB.localeCompare(dA);
      };

      // Proyectos: documentos_json → Supabase → boletines JSON estático
      let projects: any[] = [];
      if (projectsFromJson && projectsFromJson.length > 0) {
        projects = projectsFromJson;
      } else if (projectsSupabase && projectsSupabase.length > 0) {
        projects = projectsSupabase;
      } else if (boletinesResponse != null) {
        try {
          const mapped = mapBoletinesToProjects(boletinesResponse);
          projects = Array.isArray(mapped) ? mapped : [];
        } catch {
          projects = [];
        }
      }
      projects = [...projects].sort(byDateDesc);

      // Gacetas: documentos_json → Supabase → JSON estático
      let gazettes: any[] = [];
      if (gazettesFromJson && gazettesFromJson.length > 0) {
        gazettes = gazettesFromJson;
      } else if (gazettesSupabase && gazettesSupabase.length > 0) {
        gazettes = gazettesSupabase;
      } else if (gacetasResponse != null) {
        try {
          const mapped = mapGacetasToDataset(gacetasResponse);
          gazettes = Array.isArray(mapped) ? mapped : [];
        } catch {
          gazettes = [];
        }
      }
      gazettes = [...gazettes].sort(byDateDesc);

      // Eventos: solo tabla events (incluye los publicados desde propuestas; no mezclar getParticipationEvents para evitar duplicados)
      let events: any[] = EVENTS_DATA;
      if (eventsSupabase && eventsSupabase.length > 0) {
        events = deduplicateEventsByIdAndContent(eventsSupabase);
      }

      // Bitácora (eventos pasados): Supabase → estáticos
      let pastEvents: any[] = PAST_EVENTS_DATA;
      if (pastEventsSupabase && pastEventsSupabase.length > 0) {
        pastEvents = pastEventsSupabase;
      }

      // Bitácora: más reciente primero
      pastEvents = [...pastEvents].sort(byDateDesc);

      // Áreas verdes: documentos_json → Supabase (areas_donacion → green_areas) → estáticos
      let greenAreas = GREEN_AREAS_DATA;
      if (areasDonacionFromJson && areasDonacionFromJson.length > 0) {
        greenAreas = areasDonacionFromJson;
      } else if (areasDonacion && areasDonacion.length > 0) {
        greenAreas = areasDonacion;
      } else if (greenAreasSupabase && greenAreasSupabase.length > 0) {
        greenAreas = greenAreasSupabase;
      }

      // Añadir propuestas ciudadanas de áreas verdes (al final de la lista)
      if (participationGreenAreas && participationGreenAreas.length > 0) {
        greenAreas = [...greenAreas, ...participationGreenAreas];
      }

      setData({
        greenAreas: greenAreas?.length ? greenAreas : GREEN_AREAS_DATA,
        projects: projects?.length ? projects : [],
        gazettes: gazettes?.length ? gazettes : [],
        events: events?.length ? events : EVENTS_DATA,
        pastEvents: pastEvents?.length ? pastEvents : PAST_EVENTS_DATA,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos');
      setData({
        greenAreas: GREEN_AREAS_DATA,
        projects: [],
        gazettes: [],
        events: EVENTS_DATA,
        pastEvents: PAST_EVENTS_DATA
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-actualizar Agenda en "tiempo real" (polling).
  // Nota: Google Calendar iCal no ofrece push realtime en un sitio estático; esto es lo más cercano sin backend.
  useEffect(() => {
    // Permitir ajustar por env si se requiere (ms). Default: 60s
    const intervalMs = Number(import.meta.env.VITE_AGENDA_REFRESH_MS) || 60_000;
    const interval = window.setInterval(() => {
      fetchAgendaEvents();
    }, intervalMs);
    return () => window.clearInterval(interval);
  }, [fetchAgendaEvents]);

  // Escuchar eventos globales del admin para refrescar la agenda sin recargar la página
  useEffect(() => {
    const handler = () => {
      fetchAgendaEvents();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('mapeo-verde:events-updated', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mapeo-verde:events-updated', handler);
      }
    };
  }, [fetchAgendaEvents]);

  // Función de refresh que recarga los datos
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const contextValue: DataContextType = {
    greenAreas: data.greenAreas,
    projects: data.projects,
    gazettes: data.gazettes,
    events: data.events,
    pastEvents: data.pastEvents,
    refresh,
    loading,
    error,
    supabaseConnected,
    supabaseError,
  };

  return React.createElement(
    DataContext.Provider,
    { value: contextValue },
    children
  );
};
