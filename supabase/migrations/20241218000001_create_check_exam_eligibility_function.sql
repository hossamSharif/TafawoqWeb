-- Migration: Create check_exam_eligibility function
-- Purpose: Check if user is eligible to create a new exam based on weekly limits and subscription tier
-- Issue: CRITICAL - Function was missing, causing exam creation to fail
-- Date: 2025-12-18

-- Function to check if user can create a new exam
CREATE OR REPLACE FUNCTION public.check_exam_eligibility(p_user_id uuid)
RETURNS TABLE (
  is_eligible boolean,
  exams_taken_this_week integer,
  max_exams_per_week integer,
  next_eligible_at timestamptz,
  reason text
) AS $$
DECLARE
  v_tier text;
  v_weekly_count integer;
  v_week_start_date date;
  v_days_since_week_start integer;
  v_max_exams integer;
BEGIN
  -- Get user subscription tier (default to 'free' if no subscription)
  SELECT COALESCE(tier, 'free')
  INTO v_tier
  FROM public.user_subscriptions
  WHERE user_id = p_user_id
  LIMIT 1;

  -- If no subscription record exists, treat as free tier
  IF v_tier IS NULL THEN
    v_tier := 'free';
  END IF;

  -- Premium users have unlimited exams
  IF v_tier = 'premium' THEN
    RETURN QUERY SELECT
      true as is_eligible,
      0 as exams_taken_this_week,
      999999 as max_exams_per_week,
      null::timestamptz as next_eligible_at,
      'Premium user - unlimited exams' as reason;
    RETURN;
  END IF;

  -- Free tier has 3 exams per week
  v_max_exams := 3;

  -- Get weekly exam count and week start date from performance_records
  SELECT
    COALESCE(weekly_exam_count, 0),
    week_start_date
  INTO
    v_weekly_count,
    v_week_start_date
  FROM public.performance_records
  WHERE user_id = p_user_id;

  -- If no performance record exists, user hasn't taken any exams
  IF v_weekly_count IS NULL THEN
    v_weekly_count := 0;
    v_week_start_date := CURRENT_DATE;
  END IF;

  -- Calculate days since week start
  IF v_week_start_date IS NULL THEN
    v_days_since_week_start := 8; -- Force reset if no week_start_date
  ELSE
    v_days_since_week_start := CURRENT_DATE - v_week_start_date;
  END IF;

  -- Reset count if more than 7 days have passed
  IF v_days_since_week_start >= 7 THEN
    v_weekly_count := 0;
    v_week_start_date := CURRENT_DATE;

    -- Update performance_records with reset values
    UPDATE public.performance_records
    SET
      weekly_exam_count = 0,
      week_start_date = CURRENT_DATE,
      updated_at = now()
    WHERE user_id = p_user_id;

    -- If no record exists, create one
    IF NOT FOUND THEN
      INSERT INTO public.performance_records (
        user_id,
        weekly_exam_count,
        week_start_date,
        exam_history,
        category_performance
      ) VALUES (
        p_user_id,
        0,
        CURRENT_DATE,
        '[]'::jsonb,
        '{}'::jsonb
      );
    END IF;
  END IF;

  -- Check if user has reached the limit
  IF v_weekly_count >= v_max_exams THEN
    -- Calculate next eligible time (start of next week)
    RETURN QUERY SELECT
      false as is_eligible,
      v_weekly_count as exams_taken_this_week,
      v_max_exams as max_exams_per_week,
      (v_week_start_date + INTERVAL '7 days')::timestamptz as next_eligible_at,
      'Weekly limit reached' as reason;
  ELSE
    -- User is eligible
    RETURN QUERY SELECT
      true as is_eligible,
      v_weekly_count as exams_taken_this_week,
      v_max_exams as max_exams_per_week,
      null::timestamptz as next_eligible_at,
      'Eligible to create exam' as reason;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION public.check_exam_eligibility IS 'Checks if user is eligible to create a new exam based on subscription tier and weekly limits. Free users: 3/week, Premium: unlimited. Automatically resets weekly count after 7 days.';
