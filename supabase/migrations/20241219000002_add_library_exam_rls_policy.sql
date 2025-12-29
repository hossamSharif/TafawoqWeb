-- Migration: Add RLS policy to allow reading exam_sessions linked to library-visible posts
-- Purpose: Enable users to access library exam content (questions) when starting a library exam
-- Created: 2025-12-19

-- Allow reading exam_sessions that are linked to library-visible forum posts
-- This is needed so users can start exams from the library
CREATE POLICY "Users can read exam_sessions linked to library posts"
ON public.exam_sessions
FOR SELECT
USING (
  -- User can read their own sessions
  auth.uid() = user_id
  OR
  -- User can read sessions linked to library-visible posts
  id IN (
    SELECT shared_exam_id
    FROM public.forum_posts
    WHERE is_library_visible = true
    AND shared_exam_id IS NOT NULL
  )
);

-- Note: This policy uses OR with the existing user_id check
-- If there's an existing policy that conflicts, you may need to drop it first

COMMENT ON POLICY "Users can read exam_sessions linked to library posts" ON public.exam_sessions
IS 'Allows users to read exam_sessions that are either their own or linked to library-visible posts';
