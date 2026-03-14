/**
 * Google Calendar TEMPLATE expects dates as YYYYMMDDTHHmmssZ (no hyphens/colons).
 * ISO strings like 2026-03-14T18:00:00+00:00 can be misparsed and show year 1901.
 */
function toGoogleCalendarDate(isoOrCompact: string | null | undefined): string {
  if (!isoOrCompact || typeof isoOrCompact !== 'string') return '';
  const s = isoOrCompact.trim();
  // Already compact: 20260314T180000 or 20260314T180000Z
  if (/^\d{8}T\d{6}/.test(s)) {
    const normalized = s.replace(/[-:]/g, '').slice(0, 15);
    return normalized.length === 15 ? normalized + 'Z' : s;
  }
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
