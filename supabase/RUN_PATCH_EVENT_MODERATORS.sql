-- =============================================================================
-- Parche: moderación sin depender solo del JWT
-- Ejecutar en Supabase → SQL Editor si YA tenías las políticas por created_by
-- y la cuenta admin no ve todos los eventos.
-- =============================================================================
-- Opción A: en Dashboard → Users → tu usuario → Raw App Meta Data: {"role":"admin"}
-- Opción B: añade tu UUID de usuario a event_moderators (ver INSERT abajo).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.event_moderators (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.event_moderators IS 'Pueden ver/editar todos los eventos.';

ALTER TABLE public.event_moderators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_moderators_no_client" ON public.event_moderators;
CREATE POLICY "event_moderators_no_client" ON public.event_moderators
  FOR ALL TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.is_events_moderator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    coalesce((auth.jwt()->'app_metadata'->>'role'), '') = 'admin'
    OR EXISTS (SELECT 1 FROM public.event_moderators m WHERE m.user_id = auth.uid());
$$;

GRANT EXECUTE ON FUNCTION public.is_events_moderator() TO authenticated;

DROP POLICY IF EXISTS "auth_select_events" ON public.events;
DROP POLICY IF EXISTS "auth_insert_events" ON public.events;
DROP POLICY IF EXISTS "auth_update_events" ON public.events;
DROP POLICY IF EXISTS "auth_delete_events" ON public.events;

CREATE POLICY "auth_select_events" ON public.events FOR SELECT TO authenticated
  USING (public.is_events_moderator() OR (created_by = auth.uid()));

CREATE POLICY "auth_insert_events" ON public.events FOR INSERT TO authenticated
  WITH CHECK (public.is_events_moderator() OR (created_by = auth.uid()));

CREATE POLICY "auth_update_events" ON public.events FOR UPDATE TO authenticated
  USING (public.is_events_moderator() OR (created_by = auth.uid()))
  WITH CHECK (public.is_events_moderator() OR (created_by = auth.uid()));

CREATE POLICY "auth_delete_events" ON public.events FOR DELETE TO authenticated
  USING (public.is_events_moderator() OR (created_by = auth.uid()));

-- Sustituye por el UUID de Authentication → Users (columna User UID)
-- INSERT INTO public.event_moderators (user_id) VALUES ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
