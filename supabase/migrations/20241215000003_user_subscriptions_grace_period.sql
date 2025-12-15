-- Migration: Add grace period columns to user_subscriptions
-- Purpose: Handle payment failures with 3-day grace period

-- Add columns for grace period handling
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS grace_period_end timestamptz,
ADD COLUMN IF NOT EXISTS payment_failed_at timestamptz,
ADD COLUMN IF NOT EXISTS downgrade_scheduled boolean DEFAULT false;

-- Add index for grace period expiry checks
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_grace_period
ON public.user_subscriptions(grace_period_end)
WHERE grace_period_end IS NOT NULL;

-- Comment on columns
COMMENT ON COLUMN public.user_subscriptions.grace_period_end IS 'When grace period expires (null if not in grace)';
COMMENT ON COLUMN public.user_subscriptions.payment_failed_at IS 'When last payment failure occurred';
COMMENT ON COLUMN public.user_subscriptions.downgrade_scheduled IS 'Whether auto-downgrade is scheduled';
