-- Migration: Create question bookmarks and notes tables for review features
-- Created: 2024-12-26

-- Create question_bookmarks table
CREATE TABLE IF NOT EXISTS question_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  session_type text NOT NULL CHECK (session_type IN ('exam', 'practice')),
  question_index integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(user_id, session_id, question_index)
);

-- Create indexes for question_bookmarks
CREATE INDEX idx_question_bookmarks_user_session
  ON question_bookmarks(user_id, session_id);

CREATE INDEX idx_question_bookmarks_session_type
  ON question_bookmarks(session_type, session_id);

-- Enable RLS for question_bookmarks
ALTER TABLE question_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS policies for question_bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON question_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks"
  ON question_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON question_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Create question_notes table
CREATE TABLE IF NOT EXISTS question_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  session_type text NOT NULL CHECK (session_type IN ('exam', 'practice')),
  question_index integer NOT NULL,
  note_text text NOT NULL CHECK (char_length(note_text) <= 1000 AND char_length(note_text) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(user_id, session_id, question_index)
);

-- Create indexes for question_notes
CREATE INDEX idx_question_notes_user_session
  ON question_notes(user_id, session_id);

CREATE INDEX idx_question_notes_session_type
  ON question_notes(session_type, session_id);

CREATE INDEX idx_question_notes_updated_at
  ON question_notes(user_id, updated_at DESC);

-- Enable RLS for question_notes
ALTER TABLE question_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for question_notes
CREATE POLICY "Users can view own notes"
  ON question_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notes"
  ON question_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON question_notes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON question_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for question_notes updated_at
DROP TRIGGER IF EXISTS set_question_notes_updated_at ON question_notes;
CREATE TRIGGER set_question_notes_updated_at
  BEFORE UPDATE ON question_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE question_bookmarks IS 'Stores user bookmarks for specific questions in exam/practice sessions';
COMMENT ON TABLE question_notes IS 'Stores user personal notes for specific questions in exam/practice sessions';

COMMENT ON COLUMN question_bookmarks.session_id IS 'References exam_sessions.id or practice_sessions.id depending on session_type';
COMMENT ON COLUMN question_notes.session_id IS 'References exam_sessions.id or practice_sessions.id depending on session_type';
COMMENT ON COLUMN question_notes.note_text IS 'User note text, max 1000 characters, min 1 character';
