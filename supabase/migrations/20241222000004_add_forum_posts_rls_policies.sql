-- Migration: Add missing RLS policies for forum_posts table
-- Purpose: Allow authenticated users to INSERT, UPDATE, and DELETE forum posts
-- Issue: Users were getting "Server Error" when trying to create posts because only SELECT policy existed
-- Created: 2024-12-22

-- ============================================
-- forum_posts RLS Policies
-- ============================================

-- INSERT Policy: Authenticated users (not banned) can create posts
DROP POLICY IF EXISTS "forum_posts_insert_authenticated" ON public.forum_posts;
CREATE POLICY "forum_posts_insert_authenticated" ON public.forum_posts
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND is_banned = true
  )
);

-- UPDATE Policy: Authors can update their own posts, or admins can update any post
DROP POLICY IF EXISTS "forum_posts_update_author_or_admin" ON public.forum_posts;
CREATE POLICY "forum_posts_update_author_or_admin" ON public.forum_posts
FOR UPDATE USING (
  auth.uid() = author_id
  OR public.is_user_admin(auth.uid())
);

-- DELETE Policy: Authors can delete (soft delete) their own posts, or admins can delete any post
DROP POLICY IF EXISTS "forum_posts_delete_author_or_admin" ON public.forum_posts;
CREATE POLICY "forum_posts_delete_author_or_admin" ON public.forum_posts
FOR DELETE USING (
  auth.uid() = author_id
  OR public.is_user_admin(auth.uid())
);

-- ============================================
-- comments RLS Policies
-- ============================================

-- SELECT Policy: Anyone can view active comments
DROP POLICY IF EXISTS "comments_select_all" ON public.comments;
CREATE POLICY "comments_select_all" ON public.comments
FOR SELECT USING (status = 'active');

-- INSERT Policy: Authenticated users (not banned) can create comments
DROP POLICY IF EXISTS "comments_insert_authenticated" ON public.comments;
CREATE POLICY "comments_insert_authenticated" ON public.comments
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND is_banned = true
  )
);

-- UPDATE Policy: Authors can update their own comments, or admins can update any comment
DROP POLICY IF EXISTS "comments_update_author_or_admin" ON public.comments;
CREATE POLICY "comments_update_author_or_admin" ON public.comments
FOR UPDATE USING (
  auth.uid() = author_id
  OR public.is_user_admin(auth.uid())
);

-- DELETE Policy: Authors can delete their own comments, or admins can delete any comment
DROP POLICY IF EXISTS "comments_delete_author_or_admin" ON public.comments;
CREATE POLICY "comments_delete_author_or_admin" ON public.comments
FOR DELETE USING (
  auth.uid() = author_id
  OR public.is_user_admin(auth.uid())
);

-- ============================================
-- reactions RLS Policies
-- ============================================

-- SELECT Policy: Anyone can view reactions
DROP POLICY IF EXISTS "reactions_select_all" ON public.reactions;
CREATE POLICY "reactions_select_all" ON public.reactions
FOR SELECT USING (true);

-- INSERT Policy: Authenticated users (not banned) can create reactions
DROP POLICY IF EXISTS "reactions_insert_authenticated" ON public.reactions;
CREATE POLICY "reactions_insert_authenticated" ON public.reactions
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND is_banned = true
  )
);

-- DELETE Policy: Users can only delete their own reactions
DROP POLICY IF EXISTS "reactions_delete_own" ON public.reactions;
CREATE POLICY "reactions_delete_own" ON public.reactions
FOR DELETE USING (auth.uid() = user_id);

-- Add comment for this migration
COMMENT ON POLICY "forum_posts_insert_authenticated" ON public.forum_posts
IS 'Allows authenticated users who are not banned to create forum posts';

COMMENT ON POLICY "forum_posts_update_author_or_admin" ON public.forum_posts
IS 'Allows authors to update their own posts, or admins to update any post';

COMMENT ON POLICY "forum_posts_delete_author_or_admin" ON public.forum_posts
IS 'Allows authors to delete their own posts, or admins to delete any post';
