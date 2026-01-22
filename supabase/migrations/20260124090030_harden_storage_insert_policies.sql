-- Finalize storage insert policies: no public insert, authenticated insert with path scope.
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

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow authenticated insert for course docs'
  ) THEN
    DROP POLICY "Allow authenticated insert for course docs" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow authenticated insert for course doc images'
  ) THEN
    DROP POLICY "Allow authenticated insert for course doc images" ON storage.objects;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow authenticated insert for course docs (scoped)'
  ) THEN
    CREATE POLICY "Allow authenticated insert for course docs (scoped)"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'course_docs'
        AND name LIKE 'courses/%'
        AND auth.role() = 'authenticated'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow authenticated insert for course doc images (scoped)'
  ) THEN
    CREATE POLICY "Allow authenticated insert for course doc images (scoped)"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'course_doc_images'
        AND name LIKE 'courses/%'
        AND auth.role() = 'authenticated'
      );
  END IF;
END $$;
