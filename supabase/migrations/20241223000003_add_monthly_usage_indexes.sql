-- Migration: Add indexes for efficient monthly usage queries
-- Purpose: Optimize get_monthly_usage performance with partial indexes
-- Date: 2024-12-23

-- Index for exam sessions monthly queries
-- Covers queries filtering by user_id, created_at, and status
-- Partial index only includes active statuses (in_progress, paused, completed)
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_created_status
ON exam_sessions (user_id, created_at DESC, status)
WHERE status IN ('in_progress', 'paused', 'completed');

-- Index for practice sessions monthly queries
-- Covers queries filtering by user_id, created_at, and status
-- Partial index only includes active statuses (in_progress, paused, completed)
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_created_status
ON practice_sessions (user_id, created_at DESC, status)
WHERE status IN ('in_progress', 'paused', 'completed');

-- Comments for documentation
COMMENT ON INDEX idx_exam_sessions_user_created_status IS
'Optimizes monthly usage queries for exam sessions. Partial index on active statuses (in_progress, paused, completed) reduces index size and improves query performance.';

COMMENT ON INDEX idx_practice_sessions_user_created_status IS
'Optimizes monthly usage queries for practice sessions. Partial index on active statuses (in_progress, paused, completed) reduces index size and improves query performance.';
