-- =============================================================================
-- Gestión de moderadores desde la app (solo quien ya es moderador de eventos).
-- Ejecutar en Supabase → SQL Editor después de RUN_IN_SUPABASE_SQL_EDITOR.sql
-- =============================================================================
-- Permisos que gestiona esta página:
--   - Moderador de agenda (tabla event_moderators): alta/baja desde la UI.
--   - Rol JWT {"role":"admin"}: solo lectura aquí; sigue en Dashboard → Users
--     o Admin API (no expongas service_role en el navegador).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.moderator_list_auth_users(
  p_limit int DEFAULT 150,
  p_search text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  email text,
  user_created_at timestamptz,
  jwt_admin boolean,
  events_moderator boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_events_moderator() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    u.created_at,
    (coalesce(u.raw_app_meta_data->>'role', '') = 'admin'),
    EXISTS (SELECT 1 FROM public.event_moderators em WHERE em.user_id = u.id)
  FROM auth.users u
  WHERE
    (
      p_search IS NULL
      OR trim(p_search) = ''
      OR u.email::text ILIKE '%' || trim(p_search) || '%'
    )
  ORDER BY u.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 150), 1), 500);
END;
$$;

COMMENT ON FUNCTION public.moderator_list_auth_users IS
  'Lista usuarios de auth (email, flags moderación). Solo is_events_moderator().';

GRANT EXECUTE ON FUNCTION public.moderator_list_auth_users(int, text) TO authenticated;


CREATE OR REPLACE FUNCTION public.moderator_grant_events_moderator(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_events_moderator() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.event_moderators (user_id)
  VALUES (target_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

COMMENT ON FUNCTION public.moderator_grant_events_moderator IS
  'Añade moderación de eventos (tabla event_moderators). Solo is_events_moderator().';

GRANT EXECUTE ON FUNCTION public.moderator_grant_events_moderator(uuid) TO authenticated;


CREATE OR REPLACE FUNCTION public.moderator_revoke_events_moderator(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_events_moderator() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'No puedes quitarte a ti mismo la moderación por tabla. Usa otra cuenta moderadora o el rol JWT en el panel de Supabase.'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.event_moderators WHERE user_id = target_user_id;
END;
$$;

COMMENT ON FUNCTION public.moderator_revoke_events_moderator IS
  'Quita moderación de eventos (tabla). No permite auto-revoke. Solo is_events_moderator().';

GRANT EXECUTE ON FUNCTION public.moderator_revoke_events_moderator(uuid) TO authenticated;
