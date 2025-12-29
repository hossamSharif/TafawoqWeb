-- Migration: Update notification types to include payment notifications
-- Date: 2025-12-18
-- Description: Add payment_failed, payment_success, and grace_period_warning to allowed notification types
-- Issue: MODERATE - Notification inserts fail because payment notification types are not in the check constraint

-- Drop existing check constraint
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add updated check constraint with payment notification types
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check CHECK (
  type = ANY (ARRAY[
    'exam_completed'::text,
    'new_comment'::text,
    'comment_reply'::text,
    'report_resolved'::text,
    'reward_earned'::text,
    'payment_failed'::text,
    'payment_success'::text,
    'grace_period_warning'::text
  ])
);

-- Add comment for documentation
COMMENT ON CONSTRAINT notifications_type_check ON public.notifications IS 'Allowed notification types including payment notifications';

-- Add metadata column if it doesn't exist (used by grace period notifications)
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.notifications.metadata IS 'Additional metadata for notifications (e.g., days_remaining for grace period warnings)';

-- Add read column if it doesn't exist (fix for grace period notification inserts)
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS read boolean DEFAULT false;

COMMENT ON COLUMN public.notifications.read IS 'Whether the notification has been read by the user (replaces is_read)';
