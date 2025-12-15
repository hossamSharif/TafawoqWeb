-- Migration: Add library columns to forum_posts
-- Purpose: Enable exam library functionality

-- Add columns for library visibility and admin content tracking
ALTER TABLE public.forum_posts
ADD COLUMN IF NOT EXISTS is_library_visible boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_admin_upload boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS library_access_count integer DEFAULT 0;

-- Add index for library queries
CREATE INDEX IF NOT EXISTS idx_forum_posts_library_visible
ON public.forum_posts(is_library_visible, created_at DESC)
WHERE is_library_visible = true;

-- Add index for admin content filtering
CREATE INDEX IF NOT EXISTS idx_forum_posts_admin_upload
ON public.forum_posts(is_admin_upload)
WHERE is_admin_upload = true;

-- Comment on columns
COMMENT ON COLUMN public.forum_posts.is_library_visible IS 'Whether post appears in exam library';
COMMENT ON COLUMN public.forum_posts.is_admin_upload IS 'Whether content was uploaded by admin';
COMMENT ON COLUMN public.forum_posts.library_access_count IS 'How many users have accessed from library';
