-- Migration: Create library_access table
-- Purpose: Track which library exams each user has accessed

CREATE TABLE IF NOT EXISTS public.library_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  accessed_at timestamptz NOT NULL DEFAULT now(),
  exam_started boolean DEFAULT false,
  exam_completed boolean DEFAULT false,

  -- One access record per user per exam
  CONSTRAINT library_access_user_post_unique UNIQUE(user_id, post_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_library_access_user_id
ON public.library_access(user_id);

CREATE INDEX IF NOT EXISTS idx_library_access_post_id
ON public.library_access(post_id);

-- Enable Row Level Security
ALTER TABLE public.library_access ENABLE ROW LEVEL SECURITY;

-- Comment on table
COMMENT ON TABLE public.library_access IS 'Tracks which library exams each user has accessed for free tier limit enforcement';
