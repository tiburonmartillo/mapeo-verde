import { getRandomUnsplashImage } from '../utils/images';

export const EVENTS_DATA = [
  {
    id: 1,
    title: "Reforestación Urbana: Corredor Oriente",
    date: "2025-12-14",
    time: "08:00 AM - 12:00 PM",
    isoStart: "20251214T080000",
    isoEnd: "20251214T120000",
    location: "Av. Tecnológico esq. Poliducto",
    category: "Voluntariado",
    image: getRandomUnsplashImage('reforestacion-1', 1000, 1000),
    description: "Únete a la brigada para plantar 50 mezquites nativos. Trae ropa cómoda, gorra y tu botella de agua. Nosotros ponemos la herramienta."
  },
  {
    id: 2,
    title: "Taller: Huertos en Espacios Pequeños",
    date: "2025-12-15",
    time: "10:00 AM - 02:00 PM",
    isoStart: "20251215T100000",
    isoEnd: "20251215T140000",
    location: "Casa de la Cultura (Centro)",
    category: "Educación",
    image: getRandomUnsplashImage('huerto-2', 1000, 1000),
    description: "Aprende a cultivar tus propios alimentos en macetas y balcones. Incluye kit de semillas de temporada."
  },
  {
    id: 3,
    title: "Avistamiento de Aves: Bosque de los Cobos",
    date: "2025-12-16",
    time: "07:00 AM - 11:00 AM",
    isoStart: "20251216T070000",
    isoEnd: "20251216T110000",
    location: "Entrada Principal Bosque de los Cobos",
    category: "Recorrido",
    image: getRandomUnsplashImage('aves-3', 1000, 1000),
    description: "Caminata guiada por ornitólogos locales. Identificaremos especies migratorias que visitan nuestra ciudad en invierno."
  },
  {
    id: 4,
    title: "Mercado de Trueque y Reciclaje",
    date: "2025-12-16",
    time: "11:00 AM - 04:00 PM",
    isoStart: "20251216T110000",
    isoEnd: "20251216T160000",
    location: "Parque Rodolfo Landeros",
    category: "Comunidad",
    image: getRandomUnsplashImage('reciclaje-4', 1000, 1000),
    description: "Trae tus residuos separados (vidrio, cartón, electrónicos) y cámbialos por productos locales o plantas."
  }
];

export const PAST_EVENTS_DATA = [
  {
    id: 1,
    title: "Limpieza Masiva: Río San Pedro",
    date: "2025-12-08",
    category: "Resultados",
    stats: "350kg Recolectados",
    summary: "Gracias a los 45 voluntarios que asistieron, logramos retirar más de media tonelada de residuos sólidos del cauce del río."
  },
  {
    id: 2,
    title: "Reforestación: Parque México",
    date: "2025-12-02",
    category: "Misión Cumplida",
    stats: "120 Árboles Plantados",
    summary: "Se plantaron especies nativas (Mezquite y Huizache) con una tasa de supervivencia esperada del 90% gracias al sistema de riego instalado."
  },
  {
    id: 3,
    title: "Censo Ciudadano: Centro Histórico",
    date: "2025-11-25",
    category: "Data",
    stats: "450 Árboles Catalogados",
    summary: "La brigada de datos completó el mapeo de 12 manzanas, identificando 3 árboles patrimoniales en riesgo que ya fueron reportados."
  }
];

// Helper to generate Google Calendar Link
export const getGoogleCalendarUrl = (event: any) => {
  const details = encodeURIComponent(`${event.description}\n\nOrganizado por Mapeo Verde`);
  const location = encodeURIComponent(event.location);
  const title = encodeURIComponent(event.title);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${event.isoStart}/${event.isoEnd}&details=${details}&location=${location}`;
};

// Helper to generate .ics file content (basic)
export const downloadICS = (event: any) => {
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

