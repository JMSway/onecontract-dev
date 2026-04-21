INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'templates',
  'templates',
  false,
  10485760,
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "templates_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'templates' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "templates_storage_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'templates' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "templates_storage_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'templates' AND auth.uid() IS NOT NULL
  );
