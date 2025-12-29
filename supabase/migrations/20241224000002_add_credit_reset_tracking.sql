-- Migration: Add monthly credit reset mechanism
-- Purpose: Track and automatically reset share credits monthly
-- Author: Claude Code
-- Date: 2024-12-24

-- =====================================================
-- Step 1: Add tracking column for last reset timestamp
-- =====================================================
ALTER TABLE public.user_credits
ADD COLUMN IF NOT EXISTS share_credits_last_reset_at timestamptz DEFAULT now();

COMMENT ON COLUMN public.user_credits.share_credits_last_reset_at IS
'Timestamp of last monthly share credits reset. Used to determine when to reset credits.';

-- =====================================================
-- Step 2: Backfill existing users with reset timestamp
-- =====================================================
UPDATE public.user_credits
SET share_credits_last_reset_at = COALESCE(share_credits_last_reset_at, created_at, now())
WHERE share_credits_last_reset_at IS NULL;

-- =====================================================
-- Function: check_and_reset_monthly_credits
-- Purpose: Check if credits need reset and perform it if needed
-- Returns: JSONB with reset status and current credits
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_and_reset_monthly_credits(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_last_reset timestamptz;
  v_month_start date;
  v_tier text;
  v_tier_status text;
  v_exam_limit integer;
  v_practice_limit integer;
  v_did_reset boolean := false;
  v_current_exam_credits integer;
  v_current_practice_credits integer;
BEGIN
  -- Get current month start (UTC)
  v_month_start := date_trunc('month', CURRENT_DATE)::date;

  -- Get last reset time, current tier, and tier status
  SELECT
    uc.share_credits_last_reset_at,
    COALESCE(us.tier, 'free'),
    COALESCE(us.status, 'inactive')
  INTO v_last_reset, v_tier, v_tier_status
  FROM public.user_credits uc
  LEFT JOIN public.user_subscriptions us ON us.user_id = uc.user_id
  WHERE uc.user_id = p_user_id;

  -- If user not found, return error
  IF v_last_reset IS NULL THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;

  -- Check if we're in a new month (reset needed)
  IF date_trunc('month', v_last_reset) < v_month_start THEN
    -- Determine limits based on tier and subscription status
    -- Premium status requires both tier='premium' AND status in ['active', 'trialing']
    IF v_tier = 'premium' AND v_tier_status IN ('active', 'trialing') THEN
      v_exam_limit := 10;
      v_practice_limit := 15;
    ELSE
      -- Default to free tier limits
      v_exam_limit := 2;
      v_practice_limit := 3;
    END IF;

    -- Reset credits to tier limits
    UPDATE public.user_credits
    SET share_credits_exam = v_exam_limit,
        share_credits_practice = v_practice_limit,
        share_credits_last_reset_at = now(),
        updated_at = now()
    WHERE user_id = p_user_id;

    v_did_reset := true;
    v_current_exam_credits := v_exam_limit;
    v_current_practice_credits := v_practice_limit;

    -- Log the reset for monitoring
    RAISE NOTICE 'Monthly credits reset for user % (tier: %, exam: %, practice: %)',
      p_user_id, v_tier, v_exam_limit, v_practice_limit;
  ELSE
    -- No reset needed, get current credits
    SELECT share_credits_exam, share_credits_practice
    INTO v_current_exam_credits, v_current_practice_credits
    FROM public.user_credits
    WHERE user_id = p_user_id;
  END IF;

  -- Return current state
  RETURN jsonb_build_object(
    'reset_performed', v_did_reset,
    'exam_credits', v_current_exam_credits,
    'practice_credits', v_current_practice_credits,
    'last_reset_at', (SELECT share_credits_last_reset_at FROM user_credits WHERE user_id = p_user_id),
    'tier', v_tier
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_and_reset_monthly_credits IS
'Checks if share credits need monthly reset and performs it. Called before checking credit availability.';

-- =====================================================
-- Create index for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_credits_last_reset
ON public.user_credits(share_credits_last_reset_at)
WHERE share_credits_last_reset_at IS NOT NULL;

COMMENT ON INDEX idx_user_credits_last_reset IS
'Index to optimize monthly reset queries';
