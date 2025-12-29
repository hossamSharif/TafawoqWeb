-- Migration: Create get_monthly_usage RPC function
-- Purpose: Count exam and practice sessions started/paused/completed this calendar month
-- Returns counts for subscription limit enforcement
-- Date: 2024-12-23

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
  -- Includes in_progress, paused, and completed sessions
  -- Excludes abandoned and failed sessions
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

COMMENT ON FUNCTION public.get_monthly_usage IS
'Returns count of exam and practice sessions started this calendar month (including in_progress, paused, and completed). Used for monthly limit enforcement. Free tier: 2 exams/month, 3 practices/month. Premium tier: 10 exams/month, 15 practices/month.';
