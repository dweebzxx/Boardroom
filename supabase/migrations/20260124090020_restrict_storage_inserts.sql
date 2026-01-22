-- Tighten storage insert access to authenticated users or service role.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public insert for course docs'
  ) THEN
    DROP POLICY "Allow public insert for course docs" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public insert for course doc images'
  ) THEN
    DROP POLICY "Allow public insert for course doc images" ON storage.objects;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow authenticated insert for course docs'
  ) THEN
    CREATE POLICY "Allow authenticated insert for course docs"
      ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'course_docs' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow authenticated insert for course doc images'
  ) THEN
    CREATE POLICY "Allow authenticated insert for course doc images"
      ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'course_doc_images' AND auth.role() = 'authenticated');
  END IF;
END $$;
