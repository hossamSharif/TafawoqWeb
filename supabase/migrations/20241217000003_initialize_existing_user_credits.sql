-- Migration: Initialize user_credits for all existing users
-- Purpose: Backfill user_credits table for users who don't have a record yet
-- Issue: CRITICAL - Users without credits record don't receive rewards
-- Date: 2025-12-17

-- Insert user_credits for all users who don't have one
INSERT INTO public.user_credits (user_id, exam_credits, practice_credits, total_completions, last_awarded_milestone, credit_history, created_at, updated_at)
SELECT
  u.id as user_id,
  0 as exam_credits,
  0 as practice_credits,
  0 as total_completions,
  0 as last_awarded_milestone,
  '[]'::jsonb as credit_history,
  now() as created_at,
  now() as updated_at
FROM auth.users u
LEFT JOIN public.user_credits uc ON u.id = uc.user_id
WHERE uc.user_id IS NULL; -- Only insert for users without credits record

-- Create function to auto-initialize user_credits on user signup
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user_credits record for new user
  INSERT INTO public.user_credits (user_id, exam_credits, practice_credits, total_completions, last_awarded_milestone, credit_history)
  VALUES (
    NEW.id,
    0,
    0,
    0,
    0,
    '[]'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicate inserts

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-initialize user_credits when user is created
DROP TRIGGER IF EXISTS trg_initialize_user_credits ON auth.users;

CREATE TRIGGER trg_initialize_user_credits
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.initialize_user_credits();

-- Add comments
COMMENT ON FUNCTION public.initialize_user_credits IS 'Automatically creates user_credits record when a new user signs up';
COMMENT ON TRIGGER trg_initialize_user_credits ON auth.users IS 'Ensures every new user has a user_credits record initialized to zero';
