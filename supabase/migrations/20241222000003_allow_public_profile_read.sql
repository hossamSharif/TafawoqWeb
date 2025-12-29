-- Migration: Allow public read access to user profiles for forum display
-- Purpose: Fix "Unknown" username issue in forum posts
-- Date: 2024-12-22

-- Add a policy to allow all users (authenticated and anonymous) to view basic profile info
-- This is needed for displaying author names in forum posts, comments, etc.
DROP POLICY IF EXISTS "Public profile read for forum" ON public.user_profiles;
CREATE POLICY "Public profile read for forum"
  ON public.user_profiles
  FOR SELECT
  TO public  -- IMPORTANT: This specifies the role that the policy applies to
  USING (true);  -- Allow anyone to view profiles

-- Note: This policy allows reading user_profiles for all users
-- The 'public' role in PostgreSQL represents both authenticated and anonymous users
-- This is safe because user_profiles only contains public information:
-- - user_id
-- - display_name
-- - profile_picture_url
-- - created_at/updated_at metadata
