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
