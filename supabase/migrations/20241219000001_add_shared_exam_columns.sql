-- Migration: Add shared exam tracking columns to exam_sessions and practice_sessions
-- Purpose: Track which exams/practices were started from forum posts or library
-- Required for: Reward system and library exam completion tracking

-- Add columns to exam_sessions
ALTER TABLE public.exam_sessions
ADD COLUMN IF NOT EXISTS shared_from_post_id uuid REFERENCES public.forum_posts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_library_exam boolean DEFAULT false;

-- Add columns to practice_sessions
ALTER TABLE public.practice_sessions
ADD COLUMN IF NOT EXISTS shared_from_post_id uuid REFERENCES public.forum_posts(id) ON DELETE SET NULL;

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_exam_sessions_shared_from_post_id
ON public.exam_sessions(shared_from_post_id)
WHERE shared_from_post_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_exam_sessions_is_library_exam
ON public.exam_sessions(is_library_exam)
WHERE is_library_exam = true;

CREATE INDEX IF NOT EXISTS idx_practice_sessions_shared_from_post_id
ON public.practice_sessions(shared_from_post_id)
WHERE shared_from_post_id IS NOT NULL;

-- Comments
COMMENT ON COLUMN public.exam_sessions.shared_from_post_id IS 'Reference to forum post if this exam was started from a shared exam post';
COMMENT ON COLUMN public.exam_sessions.is_library_exam IS 'True if this exam was started from the library (not regular forum sharing)';
COMMENT ON COLUMN public.practice_sessions.shared_from_post_id IS 'Reference to forum post if this practice was started from a shared practice post';
