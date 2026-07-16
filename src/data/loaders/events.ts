import { EVENTS_DATA, PAST_EVENTS_DATA } from '../static';
import {
  getEvents,
  getPastEvents,
  deduplicateEventsByIdAndContent,
} from '../../lib/supabase/queries';

export type AppEvent = Record<string, unknown> & {
  id?: number | string;
  date?: string;
  isoStart?: string;
  isoEnd?: string;
};

const byDateDesc = (a: AppEvent, b: AppEvent) => {
  const dA = (a?.date || '').toString().replace(/\//g, '-').slice(0, 10);
  const dB = (b?.date || '').toString().replace(/\//g, '-').slice(0, 10);
  return dB.localeCompare(dA);
};

export type LoadEventsResult = {
  events: AppEvent[];
  pastEvents: AppEvent[];
};

/**
 * Carga agenda + bitácora.
 * No toca projects/gazettes ni JSON estáticos de boletines/gacetas.
 */
export async function loadEvents(options?: {
  useCache?: boolean;
}): Promise<LoadEventsResult> {
  const useCache = options?.useCache ?? false;

  const [eventsSupabase, pastEventsSupabase] = await Promise.all([
    getEvents({ useCache, fallback: [] }),
    getPastEvents({ useCache, fallback: [] }),
  ]);

  let events: AppEvent[] = EVENTS_DATA as AppEvent[];
  if (eventsSupabase && eventsSupabase.length > 0) {
    events = deduplicateEventsByIdAndContent(eventsSupabase) as AppEvent[];
  }

  let pastEvents: AppEvent[] = PAST_EVENTS_DATA as AppEvent[];
  if (pastEventsSupabase && pastEventsSupabase.length > 0) {
    pastEvents = pastEventsSupabase as AppEvent[];
  }
  pastEvents = [...pastEvents].sort(byDateDesc);

  return {
    events: events?.length ? events : (EVENTS_DATA as AppEvent[]),
    pastEvents: pastEvents?.length ? pastEvents : (PAST_EVENTS_DATA as AppEvent[]),
  };
}

/**
 * Solo eventos de agenda (para polling / refresh silencioso).
 * Devuelve null si no hay datos nuevos o lista vacía (conservar UI).
 */
export async function loadAgendaEventsOnly(): Promise<AppEvent[] | null> {
  const eventsSupabase = await getEvents({ useCache: false, fallback: [] });
  if (!eventsSupabase || eventsSupabase.length === 0) return null;
  return deduplicateEventsByIdAndContent(eventsSupabase) as AppEvent[];
}

/** Hash estable para evitar setState si la agenda no cambió. */
export function hashAgendaEvents(events: AppEvent[]): string {
  return events
    .map(
      (e) =>
        `${String(e?.id ?? '')}|${String(e?.isoStart ?? '')}|${String(e?.isoEnd ?? '')}`,
    )
    .join(';;');
}
