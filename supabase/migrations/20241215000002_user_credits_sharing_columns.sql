-- Migration: Add sharing columns to user_credits
-- Purpose: Track sharing quotas per tier

-- Add columns for sharing quotas
ALTER TABLE public.user_credits
ADD COLUMN IF NOT EXISTS share_credits_exam integer DEFAULT 2,
ADD COLUMN IF NOT EXISTS share_credits_practice integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS library_access_used integer DEFAULT 0;

-- Comment on columns
COMMENT ON COLUMN public.user_credits.share_credits_exam IS 'Remaining exam share quota (Free: 2, Premium: 10)';
COMMENT ON COLUMN public.user_credits.share_credits_practice IS 'Remaining practice share quota (Free: 3, Premium: 15)';
COMMENT ON COLUMN public.user_credits.library_access_used IS 'Library exams accessed (for free users limit tracking)';
