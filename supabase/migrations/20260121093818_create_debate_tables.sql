/*
  # Create debate_sessions and debate_messages tables
  
  1. New Tables
    - `debate_sessions`
      - `id` (uuid, primary key)
      - `course_id` (uuid, foreign key to courses)
      - `topic` (text) - The schedule item topic being debated
      - `created_at` (timestamp)
    
    - `debate_messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to debate_sessions)
      - `role` (text) - "analyst", "strategist", "professor", or "ceo"
      - `content` (text) - Message content
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on both tables
    - Allow public read/write access for MVP (no auth)
*/

CREATE TABLE IF NOT EXISTS debate_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  topic text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE debate_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to debate_sessions"
  ON debate_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to debate_sessions"
  ON debate_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS debate_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES debate_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('analyst', 'strategist', 'professor', 'ceo')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE debate_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to debate_messages"
  ON debate_messages
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to debate_messages"
  ON debate_messages
  FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_debate_sessions_course_id ON debate_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_debate_messages_session_id ON debate_messages(session_id);
