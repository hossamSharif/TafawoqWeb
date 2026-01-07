-- =====================================================
-- FIX: Server Connection Error for Exam Creation
-- =====================================================
-- This script ensures the required RPC functions exist
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/fvstedbsjiqvryqpnmzl/sql
-- =====================================================

-- Step 1: Create get_monthly_usage function (if not exists)
CREATE OR REPLACE FUNCTION public.get_monthly_usage(p_user_id uuid)
RETURNS TABLE (
  exams_this_month integer,
  practices_this_month integer,
  month_start_date date,
  month_end_date date
) AS $$
DECLARE
  v_month_start date;
  v_month_end date;
BEGIN
  -- Calculate current month boundaries
  v_month_start := date_trunc('month', CURRENT_DATE)::date;
  v_month_end := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::date;

  -- Count exams and practices started this month
  RETURN QUERY
  SELECT
    (
      SELECT COUNT(*)::integer
      FROM public.exam_sessions
      WHERE user_id = p_user_id
        AND created_at >= v_month_start
        AND created_at < v_month_end + INTERVAL '1 day'
        AND status IN ('in_progress', 'paused', 'completed')
    ) as exams_this_month,
    (
      SELECT COUNT(*)::integer
      FROM public.practice_sessions
      WHERE user_id = p_user_id
        AND created_at >= v_month_start
        AND created_at < v_month_end + INTERVAL '1 day'
        AND status IN ('in_progress', 'paused', 'completed')
    ) as practices_this_month,
    v_month_start as month_start_date,
    v_month_end as month_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 2: Add tracking column for share credits reset (if not exists)
ALTER TABLE public.user_credits
ADD COLUMN IF NOT EXISTS share_credits_last_reset_at timestamptz DEFAULT now();

-- Step 3: Backfill existing users
UPDATE public.user_credits
SET share_credits_last_reset_at = COALESCE(share_credits_last_reset_at, created_at, now())
WHERE share_credits_last_reset_at IS NULL;

-- Step 4: Create check_and_reset_monthly_credits function
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
  -- Get current month start
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
    -- Determine limits based on tier
    IF v_tier = 'premium' AND v_tier_status IN ('active', 'trialing') THEN
      v_exam_limit := 10;
      v_practice_limit := 15;
    ELSE
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

-- Step 5: Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_credits_last_reset
ON public.user_credits(share_credits_last_reset_at)
WHERE share_credits_last_reset_at IS NOT NULL;

-- =====================================================
-- Verification Query
-- =====================================================
SELECT
  'Functions created successfully' as status,
  COUNT(*) as function_count
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_monthly_usage', 'check_and_reset_monthly_credits');
