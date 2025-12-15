-- Migration: Create RLS policies for library access
-- Purpose: Secure access to library_access and maintenance_log tables

-- ============================================
-- library_access RLS Policies
-- ============================================

-- Users can view their own access records
DROP POLICY IF EXISTS "library_access_select_own" ON public.library_access;
CREATE POLICY "library_access_select_own" ON public.library_access
FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own access records (with limit check in application layer)
DROP POLICY IF EXISTS "library_access_insert_own" ON public.library_access;
CREATE POLICY "library_access_insert_own" ON public.library_access
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own access records (for exam_started/exam_completed)
DROP POLICY IF EXISTS "library_access_update_own" ON public.library_access;
CREATE POLICY "library_access_update_own" ON public.library_access
FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- maintenance_log RLS Policies
-- ============================================

-- Only admins can view maintenance log
DROP POLICY IF EXISTS "maintenance_log_select_admin" ON public.maintenance_log;
CREATE POLICY "maintenance_log_select_admin" ON public.maintenance_log
FOR SELECT USING (public.is_user_admin(auth.uid()));

-- Only admins can insert into maintenance log
DROP POLICY IF EXISTS "maintenance_log_insert_admin" ON public.maintenance_log;
CREATE POLICY "maintenance_log_insert_admin" ON public.maintenance_log
FOR INSERT WITH CHECK (public.is_user_admin(auth.uid()));

-- ============================================
-- forum_posts RLS Policy Update for Library
-- ============================================

-- Allow all authenticated users to view library-visible posts
-- Note: This extends existing policies, check for conflicts
DROP POLICY IF EXISTS "library_visible_posts_select" ON public.forum_posts;
CREATE POLICY "library_visible_posts_select" ON public.forum_posts
FOR SELECT USING (
  is_library_visible = true
  OR author_id = auth.uid()
  OR public.is_user_admin(auth.uid())
);
