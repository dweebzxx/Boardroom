/*
  # Create courses and schedule_items tables
  
  1. New Tables
    - `courses`
      - `id` (uuid, primary key)
      - `code` (text) - Course code like "MKTG 6051"
      - `name` (text) - Full course name
      - `instructor` (text) - Instructor name
      - `term` (text) - Academic term
      - `created_at` (timestamp)
    
    - `schedule_items`
      - `id` (uuid, primary key)
      - `course_id` (uuid, foreign key to courses)
      - `date` (date) - Due date
      - `type` (text) - "Quiz" or "Group Research"
      - `title` (text) - Item title
      - `due_time` (text) - Due time like "11:59pm"
      - `is_major` (boolean) - Highlights major deadlines
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on both tables
    - Allow public read access (no auth required for this MVP)
*/

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  instructor text NOT NULL,
  term text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to courses"
  ON courses
  FOR SELECT
  USING (true);

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

ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to schedule_items"
  ON schedule_items
  FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_schedule_items_course_id ON schedule_items(course_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_date ON schedule_items(date);
