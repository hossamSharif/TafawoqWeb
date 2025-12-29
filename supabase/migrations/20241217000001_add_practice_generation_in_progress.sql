-- Migration: Add generation_in_progress column to practice_sessions
-- This column is used to prevent concurrent batch generation for a single session

-- Add the missing generation_in_progress column
ALTER TABLE practice_sessions
ADD COLUMN IF NOT EXISTS generation_in_progress BOOLEAN DEFAULT FALSE;

-- Also ensure generated_batches and generation_context columns exist
-- (they may already exist based on the types file)
ALTER TABLE practice_sessions
ADD COLUMN IF NOT EXISTS generated_batches INTEGER DEFAULT 0;

ALTER TABLE practice_sessions
ADD COLUMN IF NOT EXISTS generation_context JSONB DEFAULT '{"generatedIds": [], "lastBatchIndex": -1}'::JSONB;

-- Add comment for documentation
COMMENT ON COLUMN practice_sessions.generation_in_progress IS 'Lock flag to prevent concurrent batch generation for a single practice session';
COMMENT ON COLUMN practice_sessions.generated_batches IS 'Number of question batches that have been generated for this session';
COMMENT ON COLUMN practice_sessions.generation_context IS 'Context data for batch generation including generated question IDs and last batch index';
