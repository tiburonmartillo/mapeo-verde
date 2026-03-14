/** Offset de Ciudad de México respecto a UTC, ej. -06:00 (sin horario de verano). */
const CDMX_OFFSET = '-06:00';

/**
 * Normaliza una fecha/hora a ISO sin zona (YYYY-MM-DDTHH:mm:ss).
 * Acepta compacto 20260314T180000 o ISO 2026-03-14T18:00:00.
 */
function toLocalISOString(s: string): string | null {
  const compact = s.replace(/[-:]/g, '');
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?/.exec(compact);
  if (m) {
    const [, y, mo, d, h, min, sec] = m;
    return `${y}-${mo}-${d}T${h}:${min}:${sec || '00'}`;
  }
  const iso = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(s.trim());
  if (iso) return iso[0];
  return null;
}

/**
 * Convierte hora local CDMX (sin Z) a Date UTC.
 * Ej: "2026-03-14T18:00:00" = 18:00 CDMX → 00:00 UTC (día siguiente).
 */
function localCdmxToUTC(localISO: string): Date {
  const withOffset = `${localISO.replace(/Z$/, '')}${CDMX_OFFSET}`;
  return new Date(withOffset);
}

/**
 * Google Calendar TEMPLATE espera fechas en UTC: YYYYMMDDTHHmmssZ.
 * Los eventos se guardan en hora local de Ciudad de México; aquí se convierte a UTC.
 */
function toGoogleCalendarDate(isoOrCompact: string | null | undefined): string {
  if (!isoOrCompact || typeof isoOrCompact !== 'string') return '';
  const s = isoOrCompact.trim();

  // Ya tiene Z o offset (+/-): interpretar como UTC o con offset y formatear en UTC
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(s)) {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const h = String(d.getUTCHours()).padStart(2, '0');
    const min = String(d.getUTCMinutes()).padStart(2, '0');
    const sec = String(d.getUTCSeconds()).padStart(2, '0');
    return `${y}${m}${day}T${h}${min}${sec}Z`;
  }

  // Sin zona: tratar como hora local CDMX y convertir a UTC
  const localISO = toLocalISOString(s);
  if (localISO) {
    const d = localCdmxToUTC(localISO);
    if (!Number.isNaN(d.getTime())) {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      const h = String(d.getUTCHours()).padStart(2, '0');
      const min = String(d.getUTCMinutes()).padStart(2, '0');
      const sec = String(d.getUTCSeconds()).padStart(2, '0');
      return `${y}${m}${day}T${h}${min}${sec}Z`;
    }
  }

  const fallback = new Date(s);
  if (Number.isNaN(fallback.getTime())) return '';
  const y = fallback.getUTCFullYear();
  const m = String(fallback.getUTCMonth() + 1).padStart(2, '0');
  const day = String(fallback.getUTCDate()).padStart(2, '0');
  const h = String(fallback.getUTCHours()).padStart(2, '0');
  const min = String(fallback.getUTCMinutes()).padStart(2, '0');
  const sec = String(fallback.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${day}T${h}${min}${sec}Z`;
}

export const getGoogleCalendarUrl = (event: any): string => {
  const details = encodeURIComponent(`${event.description || ''}\n\nOrganizado por Mapeo Verde`);
  const location = encodeURIComponent(event.location || '');
  const title = encodeURIComponent(event.title || '');
  const start = toGoogleCalendarDate(event.isoStart);
  const end = toGoogleCalendarDate(event.isoEnd) || start;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
};

// Helper to generate .ics file content (basic)
export const downloadICS = (event: any): void => {
  const start = toGoogleCalendarDate(event.isoStart);
  const end = toGoogleCalendarDate(event.isoEnd) || start;
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Mapeo Verde//Events//EN
BEGIN:VEVENT
UID:${event.id}@mapeoverde.org
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${start}
DTEND:${end}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location || ''}
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
