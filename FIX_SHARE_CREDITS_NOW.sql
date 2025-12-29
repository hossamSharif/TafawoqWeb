-- ========================================================
-- FIX SHARE CREDITS - Run this in Supabase SQL Editor
-- ========================================================
--
-- This script:
-- 1. Creates the decrement_share_credit function
-- 2. Creates the increment_share_credit function (for rollback)
-- 3. Creates the check_and_reset_monthly_credits function
-- 4. Ensures user husameldeenh@gmail.com has credits initialized
--
-- How to run:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Create a new query
-- 3. Copy and paste this ENTIRE file
-- 4. Click "Run" button
-- ========================================================

-- =====================================================
-- Function 1: decrement_share_credit
-- =====================================================
CREATE OR REPLACE FUNCTION public.decrement_share_credit(
  p_user_id uuid,
  p_credit_type text
)
RETURNS jsonb AS $$
DECLARE
  v_current_credits integer;
  v_column_name text;
BEGIN
  -- Determine which column to decrement
  IF p_credit_type = 'exam' THEN
    v_column_name := 'share_credits_exam';
  ELSIF p_credit_type = 'practice' THEN
    v_column_name := 'share_credits_practice';
  ELSE
    RAISE EXCEPTION 'Invalid credit type: %', p_credit_type;
  END IF;

  -- Atomic decrement with row-level lock
  EXECUTE format('
    UPDATE public.user_credits
    SET %I = %I - 1,
        updated_at = now()
    WHERE user_id = $1
      AND %I > 0
    RETURNING %I
  ', v_column_name, v_column_name, v_column_name, v_column_name)
  INTO v_current_credits
  USING p_user_id;

  -- Check if update succeeded
  IF v_current_credits IS NULL THEN
    -- Either user not found or credits already at 0
    SELECT CASE
      WHEN p_credit_type = 'exam' THEN share_credits_exam
      ELSE share_credits_practice
    END INTO v_current_credits
    FROM public.user_credits
    WHERE user_id = p_user_id;

    IF v_current_credits IS NULL THEN
      RAISE EXCEPTION 'User credits record not found';
    ELSE
      RAISE EXCEPTION 'Insufficient credits';
    END IF;
  END IF;

  -- Return success with new balance
  RETURN jsonb_build_object(
    'success', true,
    'remaining_credits', v_current_credits
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.decrement_share_credit IS
'Atomically decrements share credits. Fails if credits insufficient. Returns remaining credits.';

-- =====================================================
-- Function 2: increment_share_credit (Rollback)
-- =====================================================
CREATE OR REPLACE FUNCTION public.increment_share_credit(
  p_user_id uuid,
  p_credit_type text
)
RETURNS void AS $$
DECLARE
  v_column_name text;
BEGIN
  -- Determine which column to increment
  IF p_credit_type = 'exam' THEN
    v_column_name := 'share_credits_exam';
  ELSIF p_credit_type = 'practice' THEN
    v_column_name := 'share_credits_practice';
  ELSE
    RAISE EXCEPTION 'Invalid credit type: %', p_credit_type;
  END IF;

  -- Increment the credit
  EXECUTE format('
    UPDATE public.user_credits
    SET %I = %I + 1,
        updated_at = now()
    WHERE user_id = $1
  ', v_column_name, v_column_name)
  USING p_user_id;

  -- Log rollback for monitoring
  RAISE NOTICE 'Credit rollback performed for user % (type: %)', p_user_id, p_credit_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.increment_share_credit IS
'Rollback function to restore credits if post creation fails after credit deduction.';

-- =====================================================
-- Function 3: check_and_reset_monthly_credits
-- =====================================================

-- First, add the column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_credits'
    AND column_name = 'share_credits_last_reset_at'
  ) THEN
    ALTER TABLE public.user_credits
    ADD COLUMN share_credits_last_reset_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create the reset function
CREATE OR REPLACE FUNCTION public.check_and_reset_monthly_credits(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_last_reset timestamptz;
  v_month_start date;
  v_tier text;
  v_did_reset boolean := false;
BEGIN
  -- Get first day of current month
  v_month_start := date_trunc('month', CURRENT_DATE)::date;

  -- Get last reset time and user tier
  SELECT
    uc.share_credits_last_reset_at,
    COALESCE(us.tier, 'free')
  INTO v_last_reset, v_tier
  FROM public.user_credits uc
  LEFT JOIN public.user_subscriptions us ON us.user_id = uc.user_id
  WHERE uc.user_id = p_user_id;

  -- Check if we're in a new month
  IF date_trunc('month', v_last_reset)::date < v_month_start THEN
    -- Reset credits based on tier
    UPDATE public.user_credits
    SET
      share_credits_exam = CASE WHEN v_tier = 'premium' THEN 10 ELSE 2 END,
      share_credits_practice = CASE WHEN v_tier = 'premium' THEN 15 ELSE 3 END,
      share_credits_last_reset_at = now()
    WHERE user_id = p_user_id;

    v_did_reset := true;
  END IF;

  RETURN jsonb_build_object('reset_performed', v_did_reset);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_and_reset_monthly_credits IS
'Checks if its a new month and resets share credits based on user tier.';

-- =====================================================
-- Initialize credits for husameldeenh@gmail.com
-- =====================================================

-- Get user ID
DO $$
DECLARE
  v_user_id uuid;
  v_tier text;
  v_exam_credits integer;
  v_practice_credits integer;
BEGIN
  -- Find user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'husameldeenh@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User husameldeenh@gmail.com not found - skipping credit initialization';
    RETURN;
  END IF;

  RAISE NOTICE 'Found user: %', v_user_id;

  -- Check if user already has credits
  IF EXISTS (SELECT 1 FROM public.user_credits WHERE user_id = v_user_id) THEN
    RAISE NOTICE 'User already has credits record - skipping';
    RETURN;
  END IF;

  -- Get user tier
  SELECT COALESCE(tier, 'free') INTO v_tier
  FROM public.user_subscriptions
  WHERE user_id = v_user_id;

  v_tier := COALESCE(v_tier, 'free');

  -- Set credits based on tier
  IF v_tier = 'premium' THEN
    v_exam_credits := 10;
    v_practice_credits := 15;
  ELSE
    v_exam_credits := 2;
    v_practice_credits := 3;
  END IF;

  RAISE NOTICE 'Initializing credits for tier: % (exam: %, practice: %)',
    v_tier, v_exam_credits, v_practice_credits;

  -- Insert credits
  INSERT INTO public.user_credits (
    user_id,
    share_credits_exam,
    share_credits_practice,
    share_credits_last_reset_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_exam_credits,
    v_practice_credits,
    now(),
    now(),
    now()
  );

  RAISE NOTICE 'Credits initialized successfully!';
END $$;

-- =====================================================
-- Verification Query
-- =====================================================
SELECT
  'Credits for husameldeenh@gmail.com:' as info,
  uc.share_credits_exam,
  uc.share_credits_practice,
  uc.share_credits_last_reset_at,
  COALESCE(us.tier, 'free') as tier
FROM public.user_credits uc
LEFT JOIN public.user_subscriptions us ON us.user_id = uc.user_id
WHERE uc.user_id = (
  SELECT id FROM auth.users WHERE email = 'husameldeenh@gmail.com'
);

-- =====================================================
-- Success Message
-- =====================================================
SELECT '✅ All functions created and credits initialized!' as status;
