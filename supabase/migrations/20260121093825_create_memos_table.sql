/*
  # Create memos table for executive memo workspace
  
  1. New Tables
    - `memos`
      - `id` (uuid, primary key)
      - `course_id` (uuid, foreign key to courses)
      - `topic` (text, nullable) - Linked schedule item topic
      - `content` (text) - Memo content
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on table
    - Allow public read/write access for MVP (no auth)
*/

CREATE TABLE IF NOT EXISTS memos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  topic text,
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE memos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to memos"
  ON memos
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to memos"
  ON memos
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to memos"
  ON memos
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_memos_course_id ON memos(course_id);
