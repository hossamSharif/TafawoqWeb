-- Migration: Fix admin RLS recursion
-- Purpose: Create is_user_admin function and fix user_profiles RLS policies

-- ============================================
-- Create is_user_admin security definer function
-- ============================================
-- This function bypasses RLS to check admin status, preventing recursion

CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Direct query bypasses RLS due to SECURITY DEFINER
  SELECT is_admin INTO v_is_admin
  FROM public.user_profiles
  WHERE user_id = check_user_id;

  RETURN COALESCE(v_is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set function owner and grant execute permission
COMMENT ON FUNCTION public.is_user_admin IS 'Checks if user is admin (bypasses RLS to prevent recursion)';

-- ============================================
-- Drop problematic recursive policies
-- ============================================

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;

-- ============================================
-- Create proper user_profiles RLS policies
-- ============================================

-- Users can read their own profile
DROP POLICY IF EXISTS "Users read own profile" ON public.user_profiles;
CREATE POLICY "Users read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can read all profiles (using security definer function)
CREATE POLICY "Admins can read all profiles" ON public.user_profiles
  FOR SELECT USING (public.is_user_admin(auth.uid()));

-- Users can update their own profile
DROP POLICY IF EXISTS "Users update own profile" ON public.user_profiles;
CREATE POLICY "Users update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can update all profiles (using security definer function)
CREATE POLICY "Admins can update all profiles" ON public.user_profiles
  FOR UPDATE USING (public.is_user_admin(auth.uid()));

-- System/users can insert their own profile on creation
DROP POLICY IF EXISTS "System insert profile" ON public.user_profiles;
CREATE POLICY "System insert profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
