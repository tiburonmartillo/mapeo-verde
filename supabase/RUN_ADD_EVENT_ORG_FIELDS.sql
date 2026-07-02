-- =============================================================================
-- Agrega columnas de organización, enlaces y lugar a la tabla events.
-- Ejecutar en Supabase → SQL Editor después de RUN_IN_SUPABASE_SQL_EDITOR.sql
-- y RUN_ORGANIZATION_PROFILES_PHASE1.sql.
-- =============================================================================

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organization_profiles (id) ON DELETE SET NULL;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_url text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS place_name text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organizers text;

COMMENT ON COLUMN public.events.organization_id IS 'FK al perfil de la organización que creó el evento (solo admin autenticado).';
COMMENT ON COLUMN public.events.event_url IS 'URL de publicación original o redes del evento.';
COMMENT ON COLUMN public.events.place_name IS 'Nombre del lugar (ej. Jardín de San Marcos).';
COMMENT ON COLUMN public.events.organizers IS 'Organización(es) convocante(s) en texto libre (formulario público).';
