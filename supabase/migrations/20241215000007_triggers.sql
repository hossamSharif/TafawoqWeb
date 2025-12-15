-- Migration: Create triggers
-- Purpose: Automatic reward granting on content completion

-- Drop trigger if exists to avoid conflicts
DROP TRIGGER IF EXISTS trg_grant_reward_on_completion ON public.shared_exam_completions;

-- Create trigger for reward on completion
CREATE TRIGGER trg_grant_reward_on_completion
AFTER INSERT ON public.shared_exam_completions
FOR EACH ROW
EXECUTE FUNCTION public.grant_reward_on_completion();

-- Comment on trigger
COMMENT ON TRIGGER trg_grant_reward_on_completion ON public.shared_exam_completions
IS 'Automatically grants reward credits to content owner when someone completes their shared content';
