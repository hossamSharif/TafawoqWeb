-- Migration: Update check_exam_eligibility to use monthly limits instead of weekly
-- Purpose: Align with platform monthly limit system (2/month for free, 10/month for premium)
-- Previous: Weekly limits (3/week for free, unlimited for premium)
-- Date: 2024-12-23

DROP FUNCTION IF EXISTS public.check_exam_eligibility(uuid);

CREATE OR REPLACE FUNCTION public.check_exam_eligibility(p_user_id uuid)
RETURNS TABLE (
  is_eligible boolean,
  exams_taken_this_month integer,
  max_exams_per_month integer,
  next_eligible_at timestamptz,
  reason text
) AS $$
DECLARE
  v_tier text;
  v_subscription_status text;
  v_monthly_count integer;
  v_max_exams integer;
  v_month_start date;
  v_next_month_start timestamptz;
BEGIN
  -- Get user subscription tier and status (default to 'free' if no subscription)
  SELECT COALESCE(tier, 'free'), COALESCE(status, 'inactive')
  INTO v_tier, v_subscription_status
  FROM public.user_subscriptions
  WHERE user_id = p_user_id
  LIMIT 1;

  -- If no subscription record exists, treat as free tier
  IF v_tier IS NULL THEN
    v_tier := 'free';
  END IF;

  -- Set monthly limits based on tier
  -- Premium users with active/trialing status get higher limits
  IF v_tier = 'premium' AND v_subscription_status IN ('active', 'trialing') THEN
    v_max_exams := 10; -- Premium: 10 exams per month
  ELSE
    v_max_exams := 2; -- Free: 2 exams per month
  END IF;

  -- Get monthly usage from get_monthly_usage function
  SELECT exams_this_month, month_start_date
  INTO v_monthly_count, v_month_start
  FROM public.get_monthly_usage(p_user_id);

  -- Calculate next month start
  v_next_month_start := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::timestamptz;

  -- Check if user has reached the limit
  IF v_monthly_count >= v_max_exams THEN
    -- Monthly limit reached
    RETURN QUERY SELECT
      false as is_eligible,
      v_monthly_count as exams_taken_this_month,
      v_max_exams as max_exams_per_month,
      v_next_month_start as next_eligible_at,
      format('تم الوصول للحد الشهري. استخدمت %s من %s اختبار', v_monthly_count, v_max_exams) as reason;
  ELSE
    -- User is eligible
    RETURN QUERY SELECT
      true as is_eligible,
      v_monthly_count as exams_taken_this_month,
      v_max_exams as max_exams_per_month,
      null::timestamptz as next_eligible_at,
      format('مؤهل لإنشاء اختبار. استخدمت %s من %s', v_monthly_count, v_max_exams) as reason;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.check_exam_eligibility IS
'Checks if user is eligible to create a new exam based on subscription tier and monthly limits. Free: 2/month, Premium: 10/month. Automatically counts sessions with status in (in_progress, paused, completed). Monthly limits reset on first day of each month.';
