-- Migration: Create database functions for library access
-- Purpose: Helper functions for library access limits and rewards

-- Function to check if user can access more library exams
CREATE OR REPLACE FUNCTION public.check_library_access_limit(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_tier text;
  v_access_count integer;
BEGIN
  -- Get user tier
  SELECT tier INTO v_tier
  FROM public.user_subscriptions
  WHERE user_id = p_user_id;

  -- Premium users have unlimited access
  IF v_tier = 'premium' THEN
    RETURN true;
  END IF;

  -- Count existing library accesses for free user
  SELECT COUNT(*) INTO v_access_count
  FROM public.library_access
  WHERE user_id = p_user_id;

  -- Free users limited to 1
  RETURN v_access_count < 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant reward when someone completes shared content
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

  -- Credit the owner
  IF v_content_type = 'exam' THEN
    UPDATE public.user_credits
    SET exam_credits = COALESCE(exam_credits, 0) + 1,
        updated_at = now()
    WHERE user_id = v_owner_id;
  ELSE
    UPDATE public.user_credits
    SET practice_credits = COALESCE(practice_credits, 0) + 1,
        updated_at = now()
    WHERE user_id = v_owner_id;
  END IF;

  -- Create notification for owner
  INSERT INTO public.notifications (user_id, type, title, message, target_id, target_type)
  VALUES (
    v_owner_id,
    'reward_earned',
    'مكافأة جديدة!',
    'لقد أكمل مستخدم آخر اختبارك المشارك وحصلت على رصيد إضافي',
    NEW.post_id,
    v_content_type
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get library exams with access status
CREATE OR REPLACE FUNCTION public.get_library_exams(
  p_user_id uuid,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_section text DEFAULT NULL,
  p_sort text DEFAULT 'popular'
)
RETURNS TABLE (
  post_id uuid,
  title text,
  section text,
  question_count integer,
  creator_name text,
  creator_id uuid,
  completion_count integer,
  user_has_access boolean,
  user_completed boolean,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fp.id as post_id,
    fp.title,
    es.track as section,
    es.total_questions as question_count,
    up.display_name as creator_name,
    fp.author_id as creator_id,
    COALESCE(fp.completion_count, 0)::integer as completion_count,
    EXISTS(
      SELECT 1 FROM public.library_access la
      WHERE la.user_id = p_user_id AND la.post_id = fp.id
    ) as user_has_access,
    EXISTS(
      SELECT 1 FROM public.shared_exam_completions sec
      WHERE sec.user_id = p_user_id AND sec.post_id = fp.id
    ) as user_completed,
    fp.created_at
  FROM public.forum_posts fp
  LEFT JOIN public.user_profiles up ON fp.author_id = up.user_id
  LEFT JOIN public.exam_sessions es ON fp.shared_exam_id = es.id
  WHERE fp.post_type = 'exam_share'
    AND fp.is_library_visible = true
    AND COALESCE(fp.status, 'active') != 'deleted'
    AND (p_section IS NULL OR es.track = p_section)
  ORDER BY
    CASE WHEN p_sort = 'popular' THEN COALESCE(fp.completion_count, 0) END DESC,
    CASE WHEN p_sort = 'recent' THEN fp.created_at END DESC,
    fp.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on functions
COMMENT ON FUNCTION public.check_library_access_limit IS 'Checks if user can access more library exams (free users limited to 1)';
COMMENT ON FUNCTION public.grant_reward_on_completion IS 'Trigger function to credit content owner when someone completes their shared content';
COMMENT ON FUNCTION public.get_library_exams IS 'Fetches library-visible exams with access status for pagination';
