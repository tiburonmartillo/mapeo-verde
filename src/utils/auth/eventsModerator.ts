import type { User } from '@supabase/supabase-js';

/**
 * Moderadores pueden ver y editar todas las filas de `events` (incl. propuestas del
 * formulario y filas sin `created_by`). Configurar en Supabase → Authentication → Users
 * → Raw App Meta Data: { "role": "admin" }
 */
export function isEventsModerator(user: User | null | undefined): boolean {
  const role = user?.app_metadata?.role;
  return role === 'admin';
}
