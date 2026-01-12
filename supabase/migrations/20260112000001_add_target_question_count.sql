-- Migration: Add target_question_count column to practice_sessions
-- This column stores the user's requested question count, separate from the current loaded count
-- This is needed because questions are loaded in batches of 5, but users can request 10, 20, 50+ questions

-- Add the target_question_count column
ALTER TABLE practice_sessions
ADD COLUMN IF NOT EXISTS target_question_count INTEGER DEFAULT 5;

-- Copy existing question_count values to target_question_count for existing sessions
-- (retroactive fix - existing sessions will have their question_count as target)
UPDATE practice_sessions
SET target_question_count = COALESCE(question_count, 5)
WHERE target_question_count IS NULL OR target_question_count = 5;

-- Add comment for documentation
COMMENT ON COLUMN practice_sessions.target_question_count IS 'The user-requested total question count for this practice session. Separate from question_count which tracks currently loaded questions.';
