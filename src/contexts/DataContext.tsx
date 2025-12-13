import React, { useState, useEffect } from 'react';
import { GREEN_AREAS_DATA, GAZETTES_DATA } from '../constants/mockData';
import { EVENTS_DATA, PAST_EVENTS_DATA } from '../constants/eventsData';
import { mapBoletinesToProjects, mapGacetasToDataset } from '../utils/dataMappers';

export interface DataContextType {
  greenAreas: any[];
  projects: any[];
  gazettes: any[];
  events: any[];
  pastEvents: any[];
  refresh: () => void;
  loading: boolean;
}

export const DataContext = React.createContext<DataContextType>({
  greenAreas: [],
  projects: [],
  gazettes: [],
  events: [],
  pastEvents: [],
  refresh: () => {},
  loading: true
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

  const fetchData = async () => {
    setLoading(true);

    const fetchLocalJSON = async (path: string) => {
      try {
        const res = await fetch(path);
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    };

    const [boletinesSource, gacetasSource] = await Promise.all([
      fetchLocalJSON('/mapeo-verde/data/boletines.json'),
      fetchLocalJSON('/mapeo-verde/data/gacetas_semarnat_analizadas.json')
    ]);

    const projects = mapBoletinesToProjects(boletinesSource);
    const gazettes = mapGacetasToDataset(gacetasSource);

    setData({
      greenAreas: GREEN_AREAS_DATA,
      projects: projects.length ? projects : GAZETTES_DATA,
      gazettes: gazettes.length ? gazettes : GAZETTES_DATA,
      events: EVENTS_DATA,
      pastEvents: PAST_EVENTS_DATA
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DataContext.Provider value={{ ...data, refresh: fetchData, loading }}>
      {children}
    </DataContext.Provider>
  );
};

