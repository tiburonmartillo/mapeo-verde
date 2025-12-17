import React, { useState, useEffect, useCallback, JSX } from 'react';
import { GREEN_AREAS_DATA, EVENTS_DATA, PAST_EVENTS_DATA } from '../data/static';
import { mapBoletinesToProjects, mapGacetasToDataset } from '../utils/helpers';
import { fetchGoogleCalendarEvents } from '../services/googleCalendar';

export interface DataContextType {
  greenAreas: any[];
  projects: any[];
  gazettes: any[];
  events: any[];
  pastEvents: any[];
  refresh: () => Promise<void>;
  loading: boolean;
  error: string | null;
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
});

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState({
    greenAreas: [],
    projects: [],
    gazettes: [],
    events: [],
    pastEvents: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
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
      
      console.log('📡 Cargando datos desde:', { baseUrl, boletinesUrl, gacetasUrl });
      
      // Cargar datos directamente desde public/data y Google Calendar
      const [boletinesResponse, gacetasResponse, googleCalendarEvents] = await Promise.allSettled([
        fetch(boletinesUrl).then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        }),
        fetch(gacetasUrl).then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        }),
        fetchGoogleCalendarEvents(),
      ]);

      // Procesar boletines a proyectos
      let projects: any[] = [];
      if (boletinesResponse.status === 'fulfilled' && boletinesResponse.value) {
        try {
          const mapped = mapBoletinesToProjects(boletinesResponse.value);
          projects = Array.isArray(mapped) ? mapped : [];
          console.log(`✅ Boletines cargados: ${projects.length} proyectos`);
        } catch (err) {
          console.warn('Error mapping boletines to projects:', err);
          projects = [];
        }
      } else {
        console.warn('❌ Boletines response failed:', boletinesResponse);
        if (boletinesResponse.status === 'rejected') {
          console.error('Error fetching boletines:', boletinesResponse.reason);
        }
      }

      // Procesar gacetas
      let gazettes: any[] = [];
      if (gacetasResponse.status === 'fulfilled' && gacetasResponse.value) {
        try {
          const mapped = mapGacetasToDataset(gacetasResponse.value);
          gazettes = Array.isArray(mapped) ? mapped : [];
          console.log(`✅ Gacetas cargadas: ${gazettes.length} gacetas`);
        } catch (err) {
          console.warn('Error mapping gacetas to dataset:', err);
          gazettes = [];
        }
      } else {
        console.warn('❌ Gacetas response failed:', gacetasResponse);
        if (gacetasResponse.status === 'rejected') {
          console.error('Error fetching gacetas:', gacetasResponse.reason);
        }
      }

      // Procesar eventos de Google Calendar
      let events: any[] = EVENTS_DATA; // Fallback a eventos estáticos
      if (googleCalendarEvents.status === 'fulfilled' && googleCalendarEvents.value) {
        const googleEvents = googleCalendarEvents.value;
        if (googleEvents.length > 0) {
          // Si hay eventos de Google Calendar, usarlos; si no, mantener los estáticos
          events = googleEvents;
          console.log(`✅ Eventos de Google Calendar cargados: ${events.length} eventos`);
          console.log('📋 Eventos cargados:', events.map(e => ({ title: e.title, date: e.date })));
        } else {
          console.log('ℹ️ No hay eventos en Google Calendar, usando eventos estáticos');
        }
      } else {
        console.warn('⚠️ Error cargando eventos de Google Calendar, usando eventos estáticos');
        if (googleCalendarEvents.status === 'rejected') {
          console.error('Error fetching Google Calendar events:', googleCalendarEvents.reason);
        }
      }

      // Usar datos estáticos para áreas verdes
      setData({
        greenAreas: GREEN_AREAS_DATA,
        projects: projects.length > 0 ? projects : [],
        gazettes: gazettes.length > 0 ? gazettes : [],
        events: events,
        pastEvents: PAST_EVENTS_DATA
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos');
      
      // Fallback completo a datos estáticos en caso de error
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
    error
  };

  return React.createElement(
    DataContext.Provider,
    { value: contextValue },
    children
  );
};
