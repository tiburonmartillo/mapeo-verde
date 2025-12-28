import { GoogleCalendarEvent } from '../../services/googleCalendar';
import { getGoogleCalendarUrl } from './calendarHelpers';

/**
 * Genera la URL para compartir un evento en WhatsApp
 */
export function shareToWhatsApp(event: GoogleCalendarEvent, baseUrl?: string): string {
  const calendarUrl = getGoogleCalendarUrl(event);
  
  const message = `*${event.title}*

Fecha: ${new Date(event.date).toLocaleDateString('es-MX', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  })}
Hora: ${event.time}
Ubicación: ${event.location || 'Por confirmar'}

${event.description ? `${event.description}\n\n` : ''}Más detalles: ${calendarUrl}`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/?text=${encodedMessage}`;
}

/**
 * Copia el texto del evento al portapapeles para compartir en Instagram
 */
export async function shareToInstagram(event: GoogleCalendarEvent, baseUrl?: string): Promise<boolean> {
  const eventUrl = baseUrl 
    ? `${baseUrl}/agenda/${event.id}` 
    : window.location.origin + `/agenda/${event.id}`;
  
  const text = `🌱 ${event.title}

📅 ${new Date(event.date).toLocaleDateString('es-MX', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  })}
🕐 ${event.time}
📍 ${event.location || 'Por confirmar'}

${event.description ? `${event.description}\n\n` : ''}${eventUrl}`;

  try {
    // Intentar usar la API moderna del portapapeles
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback para navegadores más antiguos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  } catch (error) {
    return false;
  }
}

/**
 * Genera un mensaje formateado para compartir el evento
 */
export function getShareMessage(event: GoogleCalendarEvent, baseUrl?: string): string {
  const eventUrl = baseUrl 
    ? `${baseUrl}/agenda/${event.id}` 
    : window.location.origin + `/agenda/${event.id}`;
  
  return `🌱 ${event.title}

📅 ${new Date(event.date).toLocaleDateString('es-MX', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  })}
🕐 ${event.time}
📍 ${event.location || 'Por confirmar'}

${event.description ? `${event.description}\n\n` : ''}${eventUrl}`;
}

