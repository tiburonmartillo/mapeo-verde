-- =============================================================================
-- Storage buckets: event_banners + organization_logos
-- Ejecutar en Supabase → SQL Editor si es primera vez o si se reinició el proyecto.
-- =============================================================================

-- Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('event_banners', 'event_banners', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('organization_logos', 'organization_logos', true) ON CONFLICT DO NOTHING;

-- event_banners policies
CREATE POLICY IF NOT EXISTS "banners_public_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'event_banners');
CREATE POLICY IF NOT EXISTS "banners_anon_insert" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'event_banners');
CREATE POLICY IF NOT EXISTS "banners_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'event_banners');
CREATE POLICY IF NOT EXISTS "banners_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'event_banners');
CREATE POLICY IF NOT EXISTS "banners_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'event_banners');

-- organization_logos policies
CREATE POLICY IF NOT EXISTS "logos_public_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'organization_logos');
CREATE POLICY IF NOT EXISTS "logos_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'organization_logos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY IF NOT EXISTS "logos_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'organization_logos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY IF NOT EXISTS "logos_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'organization_logos' AND (storage.foldername(name))[1] = auth.uid()::text);
