-- Boardroom schema source of truth
-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Legacy table alignment (safe no-ops on fresh setups)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'debate_sessions'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'debate_messages'
    ) THEN
      ALTER TABLE public.debate_messages
        DROP CONSTRAINT IF EXISTS debate_messages_session_id_fkey;
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'debate_messages'
          AND column_name = 'session_id'
      ) THEN
        ALTER TABLE public.debate_messages
          RENAME COLUMN session_id TO debate_id;
      END IF;
    END IF;

    ALTER TABLE public.debate_sessions
      RENAME TO debates;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'memos'
  ) THEN
    ALTER TABLE public.memos
      RENAME TO executive_briefs;
  END IF;
END $$;

-- Core course management
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  instructor text NOT NULL,
  term text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schedule_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  date date NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  due_time text NOT NULL DEFAULT '11:59pm',
  is_major boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RAG pipeline
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  title text NOT NULL,
  source text,
  storage_path text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ingestion_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  status text NOT NULL,
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Debate sessions + messages
CREATE TABLE IF NOT EXISTS debates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  topic text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS debate_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id uuid NOT NULL REFERENCES debates(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('analyst', 'strategist', 'professor', 'ceo')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'debate_messages'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'debate_messages_debate_id_fkey'
  ) THEN
    ALTER TABLE public.debate_messages
      ADD CONSTRAINT debate_messages_debate_id_fkey
      FOREIGN KEY (debate_id) REFERENCES public.debates(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Executive briefs
CREATE TABLE IF NOT EXISTS executive_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id uuid REFERENCES debates(id) ON DELETE SET NULL,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  topic text,
  content text NOT NULL DEFAULT '',
  content_markdown text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS + policies
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE debates ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_briefs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Allow public read access to courses'
  ) THEN
    CREATE POLICY "Allow public read access to courses" ON courses FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'schedule_items' AND policyname = 'Allow public read access to schedule_items'
  ) THEN
    CREATE POLICY "Allow public read access to schedule_items" ON schedule_items FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Allow public read access to documents'
  ) THEN
    CREATE POLICY "Allow public read access to documents" ON documents FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Allow public insert to documents'
  ) THEN
    CREATE POLICY "Allow public insert to documents" ON documents FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'document_chunks' AND policyname = 'Allow public read access to document_chunks'
  ) THEN
    CREATE POLICY "Allow public read access to document_chunks" ON document_chunks FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'document_chunks' AND policyname = 'Allow public insert to document_chunks'
  ) THEN
    CREATE POLICY "Allow public insert to document_chunks" ON document_chunks FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ingestion_jobs' AND policyname = 'Allow public read access to ingestion_jobs'
  ) THEN
    CREATE POLICY "Allow public read access to ingestion_jobs" ON ingestion_jobs FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ingestion_jobs' AND policyname = 'Allow public insert to ingestion_jobs'
  ) THEN
    CREATE POLICY "Allow public insert to ingestion_jobs" ON ingestion_jobs FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'debates' AND policyname = 'Allow public read access to debates'
  ) THEN
    CREATE POLICY "Allow public read access to debates" ON debates FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'debates' AND policyname = 'Allow public insert to debates'
  ) THEN
    CREATE POLICY "Allow public insert to debates" ON debates FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'debate_messages' AND policyname = 'Allow public read access to debate_messages'
  ) THEN
    CREATE POLICY "Allow public read access to debate_messages" ON debate_messages FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'debate_messages' AND policyname = 'Allow public insert to debate_messages'
  ) THEN
    CREATE POLICY "Allow public insert to debate_messages" ON debate_messages FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'executive_briefs' AND policyname = 'Allow public read access to executive_briefs'
  ) THEN
    CREATE POLICY "Allow public read access to executive_briefs" ON executive_briefs FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'executive_briefs' AND policyname = 'Allow public insert to executive_briefs'
  ) THEN
    CREATE POLICY "Allow public insert to executive_briefs" ON executive_briefs FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'executive_briefs' AND policyname = 'Allow public update to executive_briefs'
  ) THEN
    CREATE POLICY "Allow public update to executive_briefs" ON executive_briefs FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schedule_items_course_id ON schedule_items(course_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_date ON schedule_items(date);
CREATE INDEX IF NOT EXISTS idx_documents_course_id ON documents(course_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_document_id ON ingestion_jobs(document_id);
CREATE INDEX IF NOT EXISTS idx_debates_course_id ON debates(course_id);
CREATE INDEX IF NOT EXISTS idx_debate_messages_debate_id ON debate_messages(debate_id);
CREATE INDEX IF NOT EXISTS idx_executive_briefs_course_id ON executive_briefs(course_id);

-- Match documents RPC for RAG
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
LANGUAGE sql STABLE AS $$
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;
