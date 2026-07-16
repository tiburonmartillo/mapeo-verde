import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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
import {
  isPerfLazyDataEnabled,
  getAgendaRefreshMs,
  getRequiredDataSlices,
  shouldLoadHealth,
  type DataSlice,
} from '../config/perf';
import {
  checkSupabaseHealth,
  loadEvents,
  loadAgendaEventsOnly,
  loadGreenAreas,
  hashAgendaEvents,
} from '../data/loaders';

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
  const location = useLocation();
  const lazy = isPerfLazyDataEnabled();

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
    pastEvents: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  const eventsLoadedRef = useRef(false);
  const greenLoadedRef = useRef(false);
  const healthLoadedRef = useRef(false);
  const lastAgendaEventsHashRef = useRef<string>('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /** Carga slices según lo que necesite la ruta actual. */
  const ensureSlices = useCallback(async (needed: Set<DataSlice>, pathname: string) => {
    const tasks: Promise<void>[] = [];

    if (needed.has('events') && !eventsLoadedRef.current) {
      eventsLoadedRef.current = true;
      tasks.push(
        loadEvents({ useCache: false })
          .then((result) => {
            if (!mountedRef.current) return;
            lastAgendaEventsHashRef.current = hashAgendaEvents(result.events);
            setData((prev) => ({
              ...prev,
              events: result.events,
              pastEvents: result.pastEvents,
            }));
          })
          .catch((err) => {
            if (!mountedRef.current) return;
            eventsLoadedRef.current = false;
            setData((prev) => ({
              ...prev,
              events: EVENTS_DATA,
              pastEvents: PAST_EVENTS_DATA,
            }));
            setError(err instanceof Error ? err.message : 'Error al cargar eventos');
          }),
      );
    }

    if (needed.has('greenAreas') && !greenLoadedRef.current) {
      greenLoadedRef.current = true;
      tasks.push(
        loadGreenAreas({ useCache: true, includeParticipation: true })
          .then((areas) => {
            if (!mountedRef.current) return;
            setData((prev) => ({ ...prev, greenAreas: areas }));
          })
          .catch((err) => {
            if (!mountedRef.current) return;
            greenLoadedRef.current = false;
            setData((prev) => ({ ...prev, greenAreas: GREEN_AREAS_DATA }));
            setError(err instanceof Error ? err.message : 'Error al cargar áreas verdes');
          }),
      );
    }

    if (tasks.length > 0) {
      setLoading(true);
      setError(null);
      await Promise.all(tasks);
      if (mountedRef.current) setLoading(false);
    }

    // Health check deferred (no bloquea UI)
    if (shouldLoadHealth(pathname) && !healthLoadedRef.current) {
      healthLoadedRef.current = true;
      setTimeout(() => {
        checkSupabaseHealth({ useCache: true })
          .then((connection) => {
            if (!mountedRef.current) return;
            setSupabaseConnected(connection.connected);
            setSupabaseError(connection.error ?? null);
          })
          .catch(() => {
            if (!mountedRef.current) return;
            setSupabaseConnected(false);
            setSupabaseError('Error de conexión');
          });
      }, 0);
    }
  }, []);

  const fetchAgendaEvents = useCallback(async () => {
    try {
      if (isPerfLazyDataEnabled()) {
        const events = await loadAgendaEventsOnly();
        if (!events || events.length === 0) return;
        const nextHash = hashAgendaEvents(events);
        if (nextHash === lastAgendaEventsHashRef.current) return;
        lastAgendaEventsHashRef.current = nextHash;
        setData((prev) => ({ ...prev, events }));
        return;
      }

      const eventsSupabase = await getEvents({ useCache: false, fallback: [] });
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

  /** Path legacy: Promise.all completo (incluye JSON estáticos de boletines/gacetas). */
  const fetchDataLegacy = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const connection = await checkSupabaseConnection();
      setSupabaseConnected(connection.connected);
      setSupabaseError(connection.error ?? null);

      const baseUrl = import.meta.env.BASE_URL || '/';
      const normalizePath = (path: string) => {
        const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        return `${cleanBase}${cleanPath}`.replace(/\/+/g, '/');
      };

      const boletinesUrl = normalizePath('data/boletines.json');
      const gacetasUrl = normalizePath('data/gacetas_semarnat_analizadas.json');

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
      ] = await Promise.all([
        getAreasDonacionFromJson({ useCache: true, fallback: [] }),
        getAreasDonacion({ useCache: true, fallback: [] }),
        getGreenAreas({ useCache: true, fallback: [] }),
        getParticipationGreenAreas(),
        getProjectsFromJson({ useCache: true, fallback: [] }),
        getProjects({ useCache: true, fallback: [] }),
        getGazettesFromJson({ useCache: true, fallback: [] }),
        getGazettes({ useCache: true, fallback: [] }),
        getEvents({ useCache: false, fallback: [] }),
        getPastEvents({ useCache: false, fallback: [] }),
        fetch(boletinesUrl)
          .then((res) => (res.ok ? res.json() : []))
          .catch(() => []),
        fetch(gacetasUrl)
          .then((res) => (res.ok ? res.json() : []))
          .catch(() => []),
      ]);

      const byDateDesc = (a: any, b: any) => {
        const dA = (a?.date || '').toString().replace(/\//g, '-').slice(0, 10);
        const dB = (b?.date || '').toString().replace(/\//g, '-').slice(0, 10);
        return dB.localeCompare(dA);
      };

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

      let events: any[] = EVENTS_DATA;
      if (eventsSupabase && eventsSupabase.length > 0) {
        events = deduplicateEventsByIdAndContent(eventsSupabase);
      }

      let pastEvents: any[] = PAST_EVENTS_DATA;
      if (pastEventsSupabase && pastEventsSupabase.length > 0) {
        pastEvents = pastEventsSupabase;
      }
      pastEvents = [...pastEvents].sort(byDateDesc);

      let greenAreas = GREEN_AREAS_DATA;
      if (areasDonacionFromJson && areasDonacionFromJson.length > 0) {
        greenAreas = areasDonacionFromJson;
      } else if (areasDonacion && areasDonacion.length > 0) {
        greenAreas = areasDonacion;
      } else if (greenAreasSupabase && greenAreasSupabase.length > 0) {
        greenAreas = greenAreasSupabase;
      }
      if (participationGreenAreas && participationGreenAreas.length > 0) {
        greenAreas = [...greenAreas, ...participationGreenAreas];
      }

      lastAgendaEventsHashRef.current = events
        .map((e: any) => `${String(e?.id ?? '')}|${String(e?.isoStart ?? '')}|${String(e?.isoEnd ?? '')}`)
        .join(';;');

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
        pastEvents: PAST_EVENTS_DATA,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Lazy: carga por ruta. Legacy: carga completa al montar.
  useEffect(() => {
    if (lazy) {
      ensureSlices(getRequiredDataSlices(location.pathname), location.pathname);
    } else {
      fetchDataLegacy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lazy, location.pathname]);

  // Polling de agenda: en lazy solo en /agenda* y con pestaña visible.
  useEffect(() => {
    const intervalMs = getAgendaRefreshMs();

    const tick = () => {
      if (isPerfLazyDataEnabled()) {
        const onAgenda =
          location.pathname === '/agenda' || location.pathname.startsWith('/agenda/');
        if (!onAgenda) return;
        if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      }
      fetchAgendaEvents();
    };

    const interval = window.setInterval(tick, intervalMs);

    const onVisibility = () => {
      if (
        isPerfLazyDataEnabled() &&
        document.visibilityState === 'visible' &&
        (location.pathname === '/agenda' || location.pathname.startsWith('/agenda/'))
      ) {
        fetchAgendaEvents();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchAgendaEvents, location.pathname, lazy]);

  useEffect(() => {
    const handler = () => {
      fetchAgendaEvents();
    };
    window.addEventListener('mapeo-verde:events-updated', handler);
    return () => window.removeEventListener('mapeo-verde:events-updated', handler);
  }, [fetchAgendaEvents]);

  const refresh = useCallback(async () => {
    if (lazy) {
      eventsLoadedRef.current = false;
      greenLoadedRef.current = false;
      healthLoadedRef.current = false;
      lastAgendaEventsHashRef.current = '';
      await ensureSlices(getRequiredDataSlices(location.pathname), location.pathname);
    } else {
      await fetchDataLegacy();
    }
  }, [lazy, location.pathname, ensureSlices, fetchDataLegacy]);

  const contextValue: DataContextType = useMemo(
    () => ({
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
    }),
    [
      data.greenAreas,
      data.projects,
      data.gazettes,
      data.events,
      data.pastEvents,
      refresh,
      loading,
      error,
      supabaseConnected,
      supabaseError,
    ],
  );

  return React.createElement(DataContext.Provider, { value: contextValue }, children);
};
