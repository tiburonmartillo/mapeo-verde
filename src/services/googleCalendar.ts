import ICAL from 'ical.js';

export interface GoogleCalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // "HH:MM AM/PM - HH:MM AM/PM"
  isoStart: string; // YYYYMMDDTHHMMSS
  isoEnd: string; // YYYYMMDDTHHMMSS
  location: string;
  category: string;
  image: string;
  description: string;
  googleCalendarUrl?: string;
}

const GOOGLE_CALENDAR_ICAL_URL = 'https://calendar.google.com/calendar/ical/bce9da9cb33f280d49d3962f712747a07d9728d2954bac9d0c24db0c08f16470%40group.calendar.google.com/public/basic.ics';

/**
 * Formatea una fecha ISO a formato YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formatea una hora a formato HH:MM AM/PM
 */
function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}

/**
 * Formatea una fecha a formato ISO 8601 básico (YYYYMMDDTHHMMSS)
 */
function formatISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Convierte URL de Google Drive a URL de imagen directa
 */
function convertGoogleDriveToImageUrl(driveUrl: string): string {
  try {
    // Si es un enlace de compartir de Google Drive, convertir a URL de vista previa
    // Formato: https://drive.google.com/file/d/FILE_ID/view
    const fileIdMatch = driveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      // Convertir a URL de vista previa de Google Drive
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    
    // Si ya tiene el formato uc?export=view, devolverlo tal cual
    if (driveUrl.includes('uc?export=view')) {
      return driveUrl;
    }
    
    // Si tiene formato open?id=, convertir
    const openIdMatch = driveUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (openIdMatch && openIdMatch[1]) {
      const fileId = openIdMatch[1];
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
  } catch (error) {
  }
  
  return driveUrl;
}

/**
 * Extrae URL de imagen de attachments del evento iCal
 */
function extractImageFromAttachments(event: ICAL.Event): string {
  try {
    // Buscar attachments en el evento
    const attachments = event.component.getAllProperties('attach');
    
    
    for (const attach of attachments) {
      const url = attach.getFirstValue();
      const fmtType = attach.getParameter('fmttype');
      
      
      if (url) {
        const urlString = typeof url === 'string' ? url : String(url);
        
        // Verificar si es una URL de imagen directa
        const imageUrlRegex = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i;
        if (imageUrlRegex.test(urlString)) {
          return urlString;
        }
        
        // Verificar si es una URL de Google Drive
        if (urlString.includes('drive.google.com')) {
          const imageUrl = convertGoogleDriveToImageUrl(urlString);
          return imageUrl;
        }
        
        // Verificar si es una URL de Google Photos
        if (urlString.includes('photos.app.goo.gl') || urlString.includes('photos.google.com')) {
          return urlString;
        }
        
        // Si el tipo MIME indica que es una imagen
        if (fmtType && fmtType.startsWith('image/')) {
          // Si es Google Drive, convertir
          if (urlString.includes('drive.google.com')) {
            return convertGoogleDriveToImageUrl(urlString);
          }
          return urlString;
        }
      }
    }
  } catch (error) {
  }
  
  return '';
}

/**
 * Extrae URL de imagen de la descripción del evento (si existe)
 */
function extractImageFromDescription(description: string): string {
  if (!description) return '';
  
  // Buscar URLs de imágenes en la descripción (más flexible)
  // Patrón 1: URLs directas de imágenes
  const directImageRegex = /(https?:\/\/[^\s<>"']+\.(jpg|jpeg|png|gif|webp|svg))(?:\?[^\s<>"']*)?/gi;
  const directMatch = description.match(directImageRegex);
  if (directMatch && directMatch.length > 0) {
    return directMatch[0];
  }
  
  // Patrón 2: URLs de Google Photos
  const googlePhotosRegex = /(https?:\/\/photos\.app\.goo\.gl\/[^\s<>"']+)/i;
  const photosMatch = description.match(googlePhotosRegex);
  if (photosMatch) {
    return photosMatch[1];
  }
  
  // Patrón 3: URLs de Google Drive (mejorado)
  const driveRegex = /(https?:\/\/drive\.google\.com\/[^\s<>"']+)/i;
  const driveMatch = description.match(driveRegex);
  if (driveMatch) {
    // Convertir URL de Google Drive a URL de imagen directa
    return convertGoogleDriveToImageUrl(driveMatch[1]);
  }
  
  // Patrón 3b: URLs de Google Drive con formato abreviado
  const driveShortRegex = /(https?:\/\/[^\s<>"']*drive\.google\.com[^\s<>"']+)/i;
  const driveShortMatch = description.match(driveShortRegex);
  if (driveShortMatch) {
    return convertGoogleDriveToImageUrl(driveShortMatch[1]);
  }
  
  // Patrón 4: URLs de Imgur
  const imgurRegex = /(https?:\/\/(?:i\.)?imgur\.com\/[^\s<>"']+)/i;
  const imgurMatch = description.match(imgurRegex);
  if (imgurMatch) {
    return imgurMatch[1];
  }
  
  // Patrón 5: Buscar en formato markdown [texto](url)
  const markdownRegex = /\[([^\]]+)\]\((https?:\/\/[^\s<>"']+\.(jpg|jpeg|png|gif|webp|svg))\)/i;
  const markdownMatch = description.match(markdownRegex);
  if (markdownMatch && markdownMatch[2]) {
    return markdownMatch[2];
  }
  
  // Patrón 6: Buscar en formato HTML <img src="url">
  const htmlImgRegex = /<img[^>]+src=["']([^"']+\.(jpg|jpeg|png|gif|webp|svg))["']/i;
  const htmlMatch = description.match(htmlImgRegex);
  if (htmlMatch && htmlMatch[1]) {
    return htmlMatch[1];
  }
  
  return '';
}

/**
 * Obtiene la categoría del evento desde las categorías o tags
 */
function getCategory(event: ICAL.Event): string {
  // Intentar obtener de categories
  const categories = event.component.getFirstPropertyValue('categories');
  if (categories && Array.isArray(categories) && categories.length > 0) {
    return categories[0];
  }
  if (typeof categories === 'string' && categories) {
    return categories;
  }
  
  // Intentar obtener de tags o keywords
  const keywords = event.component.getFirstPropertyValue('keywords');
  if (keywords) {
    return typeof keywords === 'string' ? keywords : keywords[0] || 'Evento';
  }
  
  return 'Evento'; // Categoría por defecto
}

/**
 * Convierte un evento de ICAL a la estructura de la aplicación
 */
function mapICalEventToAppEvent(event: ICAL.Event, index: number): GoogleCalendarEvent | null {
  try {
    // Obtener la fecha usando la zona horaria del evento o local
    const startDate = event.startDate?.toJSDate();
    const endDate = event.endDate?.toJSDate();
    
    if (!startDate) {
      return null;
    }

    const summary = event.summary || 'Sin título';
    const description = event.description || '';
    const location = event.location || '';
    
    // Asegurar que usamos la fecha local correcta (sin ajustes de zona horaria)
    // El evento viene en zona horaria de México, así que usamos la fecha tal cual
    const date = formatDate(startDate);
    
    const startTime = formatTime(startDate);
    const endTime = endDate ? formatTime(endDate) : startTime;
    const time = endDate && endDate.getTime() !== startDate.getTime() 
      ? `${startTime} - ${endTime}` 
      : startTime;
    
    const isoStart = formatISO(startDate);
    const isoEnd = endDate ? formatISO(endDate) : isoStart;
    
    // Generar ID único del evento
    const uid = event.uid || `event-${index}-${date}`;
    
    // Extraer imagen: primero de attachments, luego de la descripción, finalmente usar una por defecto
    let image = extractImageFromAttachments(event);
    
    if (!image) {
      image = extractImageFromDescription(description);
    }
    
    if (!image) {
      // Imagen por defecto relacionada con eventos ambientales
      image = 'https://images.unsplash.com/photo-1542601906990-b4d3fb7d5763?q=80&w=1000&auto=format&fit=crop';
    } else {
    }
    
    const category = getCategory(event);
    
    // Construir URL del evento en Google Calendar si es posible
    const googleCalendarUrl = event.url || undefined;

    const mappedEvent = {
      id: uid,
      title: summary,
      date,
      time,
      isoStart,
      isoEnd,
      location,
      category,
      image,
      description,
      googleCalendarUrl
    };
    
    
    return mappedEvent;
  } catch (error) {
    return null;
  }
}

/**
 * Intenta obtener el iCal con URL directa y proxies CORS (fallback cuando el proxy de Vite falla en desarrollo).
 */
async function fetchIcalWithFallbacks(calendarUrl: string): Promise<string> {
  try {
    const res = await fetch(calendarUrl, {
      method: 'GET',
      headers: { Accept: 'text/calendar' },
      mode: 'cors',
    });
    if (res?.ok) {
      const text = await res.text();
      if (text?.trim().length) return text;
    }
  } catch {
    // ignorar
  }
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(calendarUrl)}`;
    const res = await fetch(proxyUrl, {
      method: 'GET',
      headers: { Accept: 'text/calendar' },
      mode: 'cors',
    });
    if (res?.ok) {
      let data = await res.text();
      if (data.trim().startsWith('{')) {
        try {
          const j = JSON.parse(data);
          if (j.contents) data = j.contents;
        } catch {
          /* no JSON */
        }
      }
      if (data?.trim().length) return data;
    }
  } catch {
    // ignorar
  }
  try {
    const altUrl = `https://corsproxy.io/?${encodeURIComponent(calendarUrl)}`;
    const res = await fetch(altUrl, {
      method: 'GET',
      headers: { Accept: 'text/calendar' },
      mode: 'cors',
    });
    if (res?.ok) {
      const text = await res.text();
      if (text?.trim().length) return text;
    }
  } catch {
    // ignorar
  }
  throw new Error('No se pudo cargar el calendario desde ninguna fuente');
}

/**
 * Obtiene eventos desde el feed iCal de Google Calendar
 */
export async function fetchGoogleCalendarEvents(): Promise<GoogleCalendarEvent[]> {
  try {
    const calendarUrl = import.meta.env.VITE_GOOGLE_CALENDAR_ICAL_URL || GOOGLE_CALENDAR_ICAL_URL;
    const isDevelopment = import.meta.env.DEV;
    let icalData: string;

    if (isDevelopment) {
      // En desarrollo: proxy de Vite (/api/calendar). Si falla, fallback con URL directa y proxies CORS.
      try {
        const response = await fetch('/api/calendar', {
          method: 'GET',
          headers: { Accept: 'text/calendar' },
        });
        if (response?.ok) {
          const text = await response.text();
          if (text?.trim().length) icalData = text;
          else throw new Error('Empty');
        } else {
          throw new Error(String(response?.status ?? 'unknown'));
        }
      } catch {
        icalData = await fetchIcalWithFallbacks(calendarUrl);
      }
    } else {
      // En producción (GitHub Pages): solo fetch directa + proxies CORS (no hay backend).
      icalData = await fetchIcalWithFallbacks(calendarUrl);
    }

    if (!icalData || icalData.trim().length === 0) {
      return [];
    }
    

    // Parsear el archivo iCal
    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    if (vevents.length === 0) {
      return [];
    }

    const events: GoogleCalendarEvent[] = [];
    
    for (let i = 0; i < vevents.length; i++) {
      const event = new ICAL.Event(vevents[i]);
      const mappedEvent = mapICalEventToAppEvent(event, i);
      
      if (mappedEvent) {
        events.push(mappedEvent);
      }
    }

    return events;
  } catch (error) {
    // Retornar array vacío en caso de error para que la app continúe funcionando
    return [];
  }
}

