-- Bucket público para logos de organización (perfil). Ejecutar en SQL Editor tras crear el bucket
-- en Dashboard → Storage → New bucket → name: organization_logos → Public bucket ✓
-- O bien: insert into storage.buckets (id, name, public) values ('organization_logos', 'organization_logos', true);

-- Políticas: cada usuario autenticado sube solo bajo carpeta = su user id (primer segmento del path).

DROP POLICY IF EXISTS "organization_logos_insert_own" ON storage.objects;
CREATE POLICY "organization_logos_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'organization_logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "organization_logos_update_own" ON storage.objects;
CREATE POLICY "organization_logos_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'organization_logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "organization_logos_delete_own" ON storage.objects;
CREATE POLICY "organization_logos_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'organization_logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Lectura pública (URLs en directorio / tarjetas)
DROP POLICY IF EXISTS "organization_logos_select_public" ON storage.objects;
CREATE POLICY "organization_logos_select_public"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'organization_logos');
