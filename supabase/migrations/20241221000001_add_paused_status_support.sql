-- Migration: Add paused status support for exam and practice sessions
-- Adds columns to track pause state and remaining time for precise timer resume

-- Add paused_at timestamp to exam_sessions
-- This is set when a session is paused and cleared when resumed
ALTER TABLE exam_sessions
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ NULL;

-- Add remaining_time_seconds for precise timer resume on exams
-- Stores the exact remaining time when paused (countdown continues from here)
ALTER TABLE exam_sessions
ADD COLUMN IF NOT EXISTS remaining_time_seconds INTEGER NULL;

-- Add paused_at timestamp to practice_sessions
-- Practice sessions don't have countdown timers, but track pause state
ALTER TABLE practice_sessions
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ NULL;

-- Add index for efficient querying of paused sessions
CREATE INDEX IF NOT EXISTS idx_exam_sessions_paused
ON exam_sessions (user_id, status)
WHERE status = 'paused';

CREATE INDEX IF NOT EXISTS idx_practice_sessions_paused
ON practice_sessions (user_id, status)
WHERE status = 'paused';

-- Add index for active sessions query (in_progress or paused)
CREATE INDEX IF NOT EXISTS idx_exam_sessions_active
ON exam_sessions (user_id, status)
WHERE status IN ('in_progress', 'paused');

CREATE INDEX IF NOT EXISTS idx_practice_sessions_active
ON practice_sessions (user_id, status)
WHERE status IN ('in_progress', 'paused');

-- Comments for documentation
COMMENT ON COLUMN exam_sessions.paused_at IS 'Timestamp when session was paused. NULL if not paused or never paused.';
COMMENT ON COLUMN exam_sessions.remaining_time_seconds IS 'Remaining exam time in seconds when paused, for precise timer resume. NULL if not paused.';
COMMENT ON COLUMN practice_sessions.paused_at IS 'Timestamp when practice session was paused. NULL if not paused or never paused.';
