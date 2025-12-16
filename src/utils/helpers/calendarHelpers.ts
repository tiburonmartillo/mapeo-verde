export const getGoogleCalendarUrl = (event: any): string => {
  const details = encodeURIComponent(`${event.description}\n\nOrganizado por Mapeo Verde`);
  const location = encodeURIComponent(event.location);
  const title = encodeURIComponent(event.title);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${event.isoStart}/${event.isoEnd}&details=${details}&location=${location}`;
};

// Helper to generate .ics file content (basic)
export const downloadICS = (event: any): void => {
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Mapeo Verde//Events//EN
BEGIN:VEVENT
UID:${event.id}@mapeoverde.org
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${event.isoStart}
DTEND:${event.isoEnd}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
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
