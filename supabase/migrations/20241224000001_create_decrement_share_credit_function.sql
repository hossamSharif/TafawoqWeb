-- Migration: Create decrement/increment share credit functions
-- Purpose: Atomic credit deduction with rollback capability for forum sharing
-- Author: Claude Code
-- Date: 2024-12-24

-- =====================================================
-- Function: decrement_share_credit
-- Purpose: Atomically decrement share credits with validation
-- Returns: JSONB with success status and remaining credits
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
  -- This prevents race conditions between credit check and deduction
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
-- Function: increment_share_credit
-- Purpose: Rollback function to restore credits if post creation fails
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
