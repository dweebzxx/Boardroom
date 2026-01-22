/*
  # RAG Schema Support

  1. Extensions
    - Enable `vector` extension for embeddings support

  2. New Tables
    - `documents`
      - Stores metadata about uploaded course documents
      - `file_type` restricted to specific values
    - `document_chunks`
      - Stores split content chunks and their embeddings
      - References documents and courses
      - Includes IVFFlat index for vector search
    - `user_profiles`
      - Stores user preferences and writing styles

  3. Updates
    - `debate_sessions`
      - Add RAG context columns (chunks, brief) and status
    - `debate_messages`
      - Add source tracking and token usage

  4. Functions
    - `match_documents` for similarity search using cosine distance
*/

-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) CHECK (file_type IN ('syllabus', 'reading', 'case_study', 'lecture_notes', 'assignment_rubric')),
  storage_path TEXT NOT NULL,
  file_size_bytes INTEGER,
  page_count INTEGER,
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create document_chunks table
CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_length INTEGER NOT NULL,
  page_number INTEGER,
  section_title VARCHAR(255),
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name VARCHAR(100) DEFAULT 'Josh',
  writing_style JSONB DEFAULT '[]'::jsonb,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns to debate_sessions
ALTER TABLE debate_sessions ADD COLUMN IF NOT EXISTS context_chunks uuid[];
ALTER TABLE debate_sessions ADD COLUMN IF NOT EXISTS executive_brief text;
ALTER TABLE debate_sessions ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'active';

-- Add columns to debate_messages
ALTER TABLE debate_messages ADD COLUMN IF NOT EXISTS sources uuid[];
ALTER TABLE debate_messages ADD COLUMN IF NOT EXISTS tokens_used integer;

-- Create IVFFlat index on document_chunks embedding
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops);

-- Create match_documents function
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding VECTOR(1536),
  match_course_id UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
) RETURNS TABLE (
  id UUID,
  content TEXT,
  page_number INTEGER,
  section_title VARCHAR,
  similarity FLOAT,
  document_filename VARCHAR
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.content,
    dc.page_number,
    dc.section_title,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    d.filename AS document_filename
  FROM document_chunks dc
  JOIN documents d ON dc.document_id = d.id
  WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
  AND dc.course_id = match_course_id
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Create indexes on foreign keys
CREATE INDEX IF NOT EXISTS idx_documents_course_id ON documents(course_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_course_id ON document_chunks(course_id);
