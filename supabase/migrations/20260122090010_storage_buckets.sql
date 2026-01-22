-- Storage buckets for course documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('course_docs', 'course_docs', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('course_doc_images', 'course_doc_images', false)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public read for course docs'
  ) THEN
    CREATE POLICY "Allow public read for course docs"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'course_docs');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public insert for course docs'
  ) THEN
    CREATE POLICY "Allow public insert for course docs"
      ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'course_docs');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public read for course doc images'
  ) THEN
    CREATE POLICY "Allow public read for course doc images"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'course_doc_images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public insert for course doc images'
  ) THEN
    CREATE POLICY "Allow public insert for course doc images"
      ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'course_doc_images');
  END IF;
END $$;
