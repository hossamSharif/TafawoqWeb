-- Migration: Backfill default share credits for existing users
-- Purpose: Initialize share_credits_exam, share_credits_practice, and library_access_used for existing users

-- Backfill for free users (default tier)
UPDATE public.user_credits uc
SET
  share_credits_exam = COALESCE(share_credits_exam, 2),
  share_credits_practice = COALESCE(share_credits_practice, 3),
  library_access_used = COALESCE(library_access_used, 0)
WHERE EXISTS (
  SELECT 1 FROM public.user_subscriptions us
  WHERE us.user_id = uc.user_id
  AND (us.tier = 'free' OR us.tier IS NULL)
);

-- Backfill for premium users
UPDATE public.user_credits uc
SET
  share_credits_exam = COALESCE(share_credits_exam, 10),
  share_credits_practice = COALESCE(share_credits_practice, 15),
  library_access_used = COALESCE(library_access_used, 0)
WHERE EXISTS (
  SELECT 1 FROM public.user_subscriptions us
  WHERE us.user_id = uc.user_id
  AND us.tier = 'premium'
);

-- Handle users that don't have a subscription record yet (default to free tier limits)
UPDATE public.user_credits uc
SET
  share_credits_exam = COALESCE(share_credits_exam, 2),
  share_credits_practice = COALESCE(share_credits_practice, 3),
  library_access_used = COALESCE(library_access_used, 0)
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_subscriptions us
  WHERE us.user_id = uc.user_id
);

-- Comment on migration
COMMENT ON COLUMN public.user_credits.share_credits_exam IS 'Sharing quota for exams - backfilled for existing users based on tier';
COMMENT ON COLUMN public.user_credits.share_credits_practice IS 'Sharing quota for practices - backfilled for existing users based on tier';
COMMENT ON COLUMN public.user_credits.library_access_used IS 'Number of library exams accessed - for free tier limit tracking';
