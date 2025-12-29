-- Add exam_config column to exam_sessions table for retake functionality
-- This stores the original exam configuration to enable generating similar exams

-- Add exam_config column
ALTER TABLE exam_sessions
ADD COLUMN IF NOT EXISTS exam_config jsonb DEFAULT '{}'::jsonb;

-- Create index for better query performance on exam_config
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_created
  ON exam_sessions(user_id, created_at DESC);

-- Backfill existing sessions with inferred config
UPDATE exam_sessions
SET exam_config = jsonb_build_object(
  'track', COALESCE(track, 'scientific'),
  'totalQuestions', COALESCE(total_questions, 96),
  'timeLimit', 120,
  'generatedAt', created_at
)
WHERE exam_config = '{}'::jsonb OR exam_config IS NULL;

-- Add comment
COMMENT ON COLUMN exam_sessions.exam_config IS 'Stores the original exam configuration for retake functionality including track, question count, time limit, and difficulty distribution';
