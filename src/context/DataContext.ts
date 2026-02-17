import React, { useState, useEffect, useCallback } from 'react';
import { GREEN_AREAS_DATA, EVENTS_DATA, PAST_EVENTS_DATA } from '../data/static';
import {
  getAreasDonacion,
  getGreenAreas,
  getProjects,
  getGazettes,
  getEvents,
  getPastEvents,
  getAreasDonacionFromJson,
  getProjectsFromJson,
  getGazettesFromJson,
  checkSupabaseConnection,
} from '../lib/supabase';
import { mapBoletinesToProjects, mapGacetasToDataset } from '../utils/helpers';
import { fetchGoogleCalendarEvents } from '../services/googleCalendar';
import { fetchNotionPages, fetchNotionPageContent, NotionPage } from '../services/notion';

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
        projectsFromJson,
        projectsSupabase,
        gazettesFromJson,
        gazettesSupabase,
        eventsSupabase,
        pastEventsSupabase,
        boletinesResponse,
        gacetasResponse,
        googleCalendarEvents,
      ] = await Promise.all([
        getAreasDonacionFromJson({ useCache: true, fallback: [] }),
        getAreasDonacion({ useCache: true, fallback: [] }),
        getGreenAreas({ useCache: true, fallback: [] }),
        getProjectsFromJson({ useCache: true, fallback: [] }),
        getProjects({ useCache: true, fallback: [] }),
        getGazettesFromJson({ useCache: true, fallback: [] }),
        getGazettes({ useCache: true, fallback: [] }),
        getEvents({ useCache: true, fallback: [] }),
        getPastEvents({ useCache: true, fallback: [] }),
        fetch(boletinesUrl).then(res => (res.ok ? res.json() : [])).catch(() => []),
        fetch(gacetasUrl).then(res => (res.ok ? res.json() : [])).catch(() => []),
        fetchGoogleCalendarEvents().catch(() => []),
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

      // Eventos: Supabase → Google Calendar → estáticos
      let events: any[] = EVENTS_DATA;
      if (eventsSupabase && eventsSupabase.length > 0) {
        events = eventsSupabase;
      } else if (Array.isArray(googleCalendarEvents) && googleCalendarEvents.length > 0) {
        events = googleCalendarEvents;
      }

      // Bitácora (eventos pasados): Supabase → Notion → estáticos
      let pastEvents: any[] = PAST_EVENTS_DATA;
      if (pastEventsSupabase && pastEventsSupabase.length > 0) {
        pastEvents = pastEventsSupabase;
      } else {
      try {
        const notionPages = await fetchNotionPages();
        if (notionPages && notionPages.length > 0) {
          // Obtener contenido completo de cada página desde los bloques
          const pastEventsWithContent = await Promise.all(
            notionPages.map(async (page: NotionPage) => {
              // Siempre obtener el contenido completo desde los bloques de la página
              let content = '';
              let images: string[] = [];
              if (page.id) {
                try {
                  const pageData = await fetchNotionPageContent(page.id);
                  content = pageData.content;
                  images = pageData.images || [];
                } catch (contentError: any) {
                  // Error obteniendo contenido, continuar sin contenido
                }
              }
              
              return {
                id: page.id,
                title: page.title,
                date: page.date,
                category: page.category,
                stats: page.stats,
                portada: page.portada, // URL de la imagen de portada
                summary: content.substring(0, 200) + (content.length > 200 ? '...' : ''), // Resumen para la tarjeta
                content: content, // Contenido completo en markdown desde los bloques
                images: images, // Array de URLs de imágenes
                url: page.url,
              };
            })
          );
          pastEvents = pastEventsWithContent;
        } else {
          // Verificar si hay un error registrado
          if (typeof window !== 'undefined' && (window as any).__NOTION_ERROR__) {
            // Las variables de entorno no están configuradas o hay un error
            // Usar datos estáticos como fallback
          }
        }
      } catch (notionError: any) {
        // Error cargando desde Notion, usar datos estáticos
      }
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
