import type { SupabaseClient } from '@supabase/supabase-js';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Moderación global (ver todos los eventos, cola de participación):
 * - Supabase → Authentication → Users → Raw App Meta Data: { "role": "admin" }
 * - O fila en tabla `event_moderators` (user_id) — ver supabase/RUN_IN_SUPABASE_SQL_EDITOR.sql
 *
 * `resolveEventsModerator` usa la función RPC `is_events_moderator()` (misma lógica que RLS).
 */
export function isEventsModeratorFromJwt(user: User | null | undefined): boolean {
  return user?.app_metadata?.role === 'admin';
}

/** @deprecated Usar resolveEventsModerator cuando haya cliente Supabase */
export function isEventsModerator(user: User | null | undefined): boolean {
  return isEventsModeratorFromJwt(user);
}

export async function resolveEventsModerator(
  supabase: SupabaseClient,
  session: Session | null,
): Promise<boolean> {
  if (!session?.user) return false;
  const { data, error } = await supabase.rpc('is_events_moderator');
  if (!error) return !!data;
  return isEventsModeratorFromJwt(session.user);
}
