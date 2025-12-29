-- Migration: Fix reward trigger to use UPSERT instead of UPDATE
-- Purpose: Ensures rewards are granted even if user_credits record doesn't exist
-- Issue: https://github.com/anthropics/claude-code/issues/CRITICAL-REWARD-SYSTEM
-- Date: 2025-12-17

-- Drop existing function to recreate with fix
DROP FUNCTION IF EXISTS public.grant_reward_on_completion() CASCADE;

-- Recreate function with UPSERT logic
CREATE OR REPLACE FUNCTION public.grant_reward_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id uuid;
  v_content_type text;
BEGIN
  -- Get the owner of the shared content
  SELECT author_id,
    CASE
      WHEN shared_exam_id IS NOT NULL THEN 'exam'
      ELSE 'practice'
    END
  INTO v_owner_id, v_content_type
  FROM public.forum_posts
  WHERE id = NEW.post_id;

  -- Don't reward if completing own content
  IF v_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Credit the owner using UPSERT to create record if it doesn't exist
  IF v_content_type = 'exam' THEN
    -- UPSERT: Insert new record or update existing
    INSERT INTO public.user_credits (user_id, exam_credits, practice_credits, total_completions, last_awarded_milestone, credit_history, updated_at)
    VALUES (
      v_owner_id,
      1,  -- Initial exam credit
      0,  -- Initial practice credit
      0,  -- Will be updated by milestone trigger
      0,  -- No milestone yet
      '[]'::jsonb,  -- Empty history
      now()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
      exam_credits = user_credits.exam_credits + 1,
      updated_at = now();
  ELSE
    -- Same UPSERT for practice credits
    INSERT INTO public.user_credits (user_id, exam_credits, practice_credits, total_completions, last_awarded_milestone, credit_history, updated_at)
    VALUES (
      v_owner_id,
      0,  -- Initial exam credit
      1,  -- Initial practice credit
      0,
      0,
      '[]'::jsonb,
      now()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
      practice_credits = user_credits.practice_credits + 1,
      updated_at = now();
  END IF;

  -- Create notification for owner
  INSERT INTO public.notifications (user_id, type, title, message, target_id, target_type)
  VALUES (
    v_owner_id,
    'reward_earned',
    'مكافأة جديدة!',
    CASE
      WHEN v_content_type = 'exam' THEN 'لقد أكمل مستخدم آخر اختبارك المشارك وحصلت على رصيد اختبار إضافي'
      ELSE 'لقد أكمل مستخدم آخر تدريبك المشارك وحصلت على رصيد تدريب إضافي'
    END,
    NEW.post_id,
    v_content_type
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS trg_grant_reward_on_completion ON public.shared_exam_completions;

CREATE TRIGGER trg_grant_reward_on_completion
AFTER INSERT ON public.shared_exam_completions
FOR EACH ROW
EXECUTE FUNCTION public.grant_reward_on_completion();

-- Add comment
COMMENT ON FUNCTION public.grant_reward_on_completion IS 'Trigger function to credit content owner when someone completes their shared content. Uses UPSERT to handle missing user_credits records.';
COMMENT ON TRIGGER trg_grant_reward_on_completion ON public.shared_exam_completions IS 'Automatically grants reward credits to content owner when someone completes their shared content';
