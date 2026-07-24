/**
 * Genera la URL para compartir un evento en WhatsApp
 */
export function shareToWhatsApp(event: any, baseUrl?: string): string {
  const eventUrl = baseUrl
    ? `${baseUrl}/e/${event.id}`
    : `${window.location.origin}/e/${event.id}`;
  const [y, m, d] = (event.date || '').split('-').map(Number);
  const eventDate = !isNaN(y) ? new Date(y, m - 1, d) : new Date();

  const message = `*${event.title}*

Fecha: ${eventDate.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}
Hora: ${event.time}
Ubicación: ${event.location || 'Por confirmar'}

${event.description ? `${event.description}\n\n` : ''}MÃ¡s detalles: ${eventUrl}`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/?text=${encodedMessage}`;
}

/**
 * Copia el texto del evento al portapapeles para compartir en Instagram
 */
export async function shareToInstagram(event: any, baseUrl?: string): Promise<boolean> {
  const eventUrl = baseUrl
    ? `${baseUrl}/e/${event.id}`
    : window.location.origin + `/e/${event.id}`;
  const [y, m, d] = (event.date || '').split('-').map(Number);
  const eventDate = !isNaN(y) ? new Date(y, m - 1, d) : new Date();

  const text = `🌱 ${event.title}

📅 ${eventDate.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}
🕐 ${event.time}
📍 ${event.location || 'Por confirmar'}

${event.description ? `${event.description}\n\n` : ''}${eventUrl}`;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
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
export function getShareMessage(event: any, baseUrl?: string): string {
  const eventUrl = baseUrl
    ? `${baseUrl}/e/${event.id}`
    : window.location.origin + `/e/${event.id}`;
  const [y, m, d] = (event.date || '').split('-').map(Number);
  const eventDate = !isNaN(y) ? new Date(y, m - 1, d) : new Date();

  return `🌱 ${event.title}

📅 ${eventDate.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}
🕐 ${event.time}
📍 ${event.location || 'Por confirmar'}

${event.description ? `${event.description}\n\n` : ''}${eventUrl}`;
}
