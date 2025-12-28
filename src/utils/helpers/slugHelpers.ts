/**
 * Convierte un título a un slug URL-friendly
 * @param title - El título a convertir
 * @returns El slug generado
 */
export const generateSlug = (title: string): string => {
  if (!title) return '';
  
  return title
    .toLowerCase()
    .normalize('NFD') // Normaliza caracteres con acentos
    .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos
    .replace(/[^a-z0-9]+/g, '-') // Reemplaza caracteres no alfanuméricos con guiones
    .replace(/^-+|-+$/g, '') // Elimina guiones al inicio y final
    .substring(0, 100); // Limita la longitud
};

/**
 * Busca un evento por slug o ID
 * @param events - Array de eventos
 * @param identifier - Slug o ID del evento
 * @returns El evento encontrado o undefined
 */
export const findEventByIdentifier = (events: any[], identifier: string | number): any => {
  const searchId = String(identifier);
  
  // Primero intentar buscar por slug
  const eventBySlug = events.find((e: any) => {
    if (!e.title) return false;
    const slug = generateSlug(e.title);
    return slug === searchId;
  });
  
  if (eventBySlug) return eventBySlug;
  
  // Si no se encuentra por slug, buscar por ID (compatibilidad con URLs antiguas)
  return events.find((e: any) => {
    const eId = String(e.id);
    return eId === searchId;
  });
};

