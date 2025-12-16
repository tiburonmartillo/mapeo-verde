import React, { useState, useEffect, useCallback, JSX } from 'react';
import { GREEN_AREAS_DATA, EVENTS_DATA, PAST_EVENTS_DATA } from '../data/static';
import { mapBoletinesToProjects, mapGacetasToDataset } from '../utils/helpers';

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
      // Cargar datos directamente desde public/data
      const [boletinesResponse, gacetasResponse] = await Promise.allSettled([
        fetch('/data/boletines.json').then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        }),
        fetch('/data/gacetas_semarnat_analizadas.json').then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        }),
      ]);

      // Procesar boletines a proyectos
      let projects: any[] = [];
      if (boletinesResponse.status === 'fulfilled' && boletinesResponse.value) {
        try {
          const mapped = mapBoletinesToProjects(boletinesResponse.value);
          projects = Array.isArray(mapped) ? mapped : [];
        } catch (err) {
          console.warn('Error mapping boletines to projects:', err);
          projects = [];
        }
      } else {
        console.warn('Boletines response failed:', boletinesResponse);
      }

      // Procesar gacetas
      let gazettes: any[] = [];
      if (gacetasResponse.status === 'fulfilled' && gacetasResponse.value) {
        try {
          const mapped = mapGacetasToDataset(gacetasResponse.value);
          gazettes = Array.isArray(mapped) ? mapped : [];
        } catch (err) {
          console.warn('Error mapping gacetas to dataset:', err);
          gazettes = [];
        }
      } else {
        console.warn('Gacetas response failed:', gacetasResponse);
      }

      // Usar datos estáticos para áreas verdes y eventos
      setData({
        greenAreas: GREEN_AREAS_DATA,
        projects: projects.length > 0 ? projects : [],
        gazettes: gazettes.length > 0 ? gazettes : [],
        events: EVENTS_DATA,
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
