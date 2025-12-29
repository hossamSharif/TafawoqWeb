-- Migration: Backfill missing user_profiles records
-- Purpose: Create user_profiles for users who registered but skipped onboarding
-- Issue: Users without profiles show "Unknown" as their username
-- Created: 2024-12-22

-- ============================================
-- Backfill: Create profiles for existing users
-- ============================================

-- Create profiles for users who don't have one
INSERT INTO public.user_profiles (
  user_id,
  email,
  display_name,
  academic_track,
  onboarding_completed,
  created_at,
  updated_at
)
SELECT
  u.id,
  u.email,
  split_part(u.email, '@', 1) as display_name,
  'scientific' as academic_track, -- Default track, user will update during onboarding
  false as onboarding_completed,
  u.created_at,
  NOW() as updated_at
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles p
  WHERE p.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Add comment
COMMENT ON TABLE public.user_profiles
IS 'User profiles - records are created automatically during onboarding or backfilled for existing users';
