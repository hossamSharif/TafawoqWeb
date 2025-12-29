-- BUG-006 FIX: Notification target_type constraint violation
-- The trigger uses 'exam'/'practice' but constraint only allows 'post', 'comment', 'report', 'reward'
-- Run this in Supabase Dashboard > SQL Editor

-- Step 1: Drop the broken trigger and function
DROP FUNCTION IF EXISTS public.grant_reward_on_completion() CASCADE;

-- Step 2: Recreate with fixed target_type = 'post'
CREATE OR REPLACE FUNCTION public.grant_reward_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id uuid;
  v_content_type text;
BEGIN
  SELECT author_id,
    CASE WHEN shared_exam_id IS NOT NULL THEN 'exam' ELSE 'practice' END
  INTO v_owner_id, v_content_type
  FROM public.forum_posts
  WHERE id = NEW.post_id;

  IF v_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  IF v_content_type = 'exam' THEN
    INSERT INTO public.user_credits (user_id, exam_credits, practice_credits, total_completions, last_awarded_milestone, credit_history, updated_at)
    VALUES (v_owner_id, 1, 0, 0, 0, '[]'::jsonb, now())
    ON CONFLICT (user_id) DO UPDATE SET exam_credits = user_credits.exam_credits + 1, updated_at = now();
  ELSE
    INSERT INTO public.user_credits (user_id, exam_credits, practice_credits, total_completions, last_awarded_milestone, credit_history, updated_at)
    VALUES (v_owner_id, 0, 1, 0, 0, '[]'::jsonb, now())
    ON CONFLICT (user_id) DO UPDATE SET practice_credits = user_credits.practice_credits + 1, updated_at = now();
  END IF;

  -- FIXED: Use 'post' instead of v_content_type ('exam'/'practice')
  INSERT INTO public.notifications (user_id, type, title, message, target_id, target_type)
  VALUES (
    v_owner_id,
    'reward_earned',
    'مكافأة جديدة!',
    CASE WHEN v_content_type = 'exam' THEN 'لقد أكمل مستخدم آخر اختبارك المشارك وحصلت على رصيد اختبار إضافي'
    ELSE 'لقد أكمل مستخدم آخر تدريبك المشارك وحصلت على رصيد تدريب إضافي' END,
    NEW.post_id,
    'post'  -- FIXED: Changed from v_content_type to 'post'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the trigger
CREATE TRIGGER trg_grant_reward_on_completion
AFTER INSERT ON public.shared_exam_completions
FOR EACH ROW EXECUTE FUNCTION public.grant_reward_on_completion();

-- Step 4: Also check for any trigger on exam_sessions that might be auto-inserting into shared_exam_completions
-- Run this to see all triggers:
SELECT tgname, tgrelid::regclass as table_name, tgfoid::regproc as function_name
FROM pg_trigger
WHERE NOT tgisinternal
ORDER BY tgrelid::regclass;

-- If you see any trigger on exam_sessions that inserts into shared_exam_completions, drop it:
-- DROP TRIGGER IF EXISTS <trigger_name> ON public.exam_sessions;
