/**
 * Feature flags de rendimiento.
 *
 * VITE_PERF_LAZY_DATA=1 → carga perezosa (solo events + green areas en el bootstrap;
 *   sin projects/gazettes ni JSON de ~2 MB al arrancar).
 * VITE_PERF_LAZY_DATA=0 → comportamiento legacy (Promise.all completo).
 *
 * Por defecto: lazy ON (esta rama). Desactivar con =0 para rollback.
 */
export function isPerfLazyDataEnabled(): boolean {
  const raw = import.meta.env.VITE_PERF_LAZY_DATA;
  if (raw === '0' || raw === 'false') return false;
  if (raw === '1' || raw === 'true') return true;
  // Default ON en la rama de perf; en main se puede cambiar a false.
  return true;
}

/** Intervalo de polling de agenda (ms). Default 60s. */
export function getAgendaRefreshMs(): number {
  const n = Number(import.meta.env.VITE_AGENDA_REFRESH_MS);
  return Number.isFinite(n) && n > 0 ? n : 60_000;
}

/** Slice de datos que puede cargarse de forma independiente. */
export type DataSlice = 'events' | 'greenAreas';

/**
 * Determina qué data slices requiere la ruta actual.
 *
 * Home       → events + greenAreas
 * Agenda     → events
 * Admin / páginas sin MainApp → vacío
 * Boletines, gacetas, investigación, participación → vacío (sin datos públicos)
 */
export function getRequiredDataSlices(pathname: string): Set<DataSlice> {
  const p = pathname.replace(/\/+$/, '') || '/';

  if (p === '/agenda' || p.startsWith('/agenda/') || p.startsWith('/e/')) return new Set(['events']);
  if (p === '/' || p === '/inicio') return new Set(['events', 'greenAreas']);

  return new Set();
}

/**
 * Rutas que montan MainApp → tienen Footer → necesitan health check.
 */
export function shouldLoadHealth(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (
    p.startsWith('/admin') ||
    p === '/ingreso' ||
    p === '/links' ||
    p === '/manifiesto' ||
    p === '/email-generator' ||
    p === '/aviso-de-privacidad'
  ) {
    return false;
  }
  return true;
}
