-- Migration: Add grace period columns to user_subscriptions
-- Date: 2025-12-18
-- Description: Add columns needed for payment failure grace period handling
-- Issue: CRITICAL - Columns referenced in grace-period.ts and webhook handler but missing from schema

-- Add missing columns for grace period functionality
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS grace_period_end timestamptz,
ADD COLUMN IF NOT EXISTS payment_failed_at timestamptz,
ADD COLUMN IF NOT EXISTS downgrade_scheduled boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.user_subscriptions.grace_period_end IS 'End date of grace period after payment failure (3 days from payment_failed_at)';
COMMENT ON COLUMN public.user_subscriptions.payment_failed_at IS 'Timestamp when the most recent payment failed';
COMMENT ON COLUMN public.user_subscriptions.downgrade_scheduled IS 'Whether automatic downgrade to free tier is scheduled after grace period expires';

-- Create index for grace period queries (used by cron job to process expired grace periods)
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_grace_period_end
ON public.user_subscriptions(grace_period_end)
WHERE grace_period_end IS NOT NULL AND downgrade_scheduled = true;

-- Add index for performance on payment_failed_at queries
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_payment_failed_at
ON public.user_subscriptions(payment_failed_at)
WHERE payment_failed_at IS NOT NULL;
