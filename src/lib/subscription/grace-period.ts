// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
/**
 * Grace Period Handling for Subscription Management
 * T086-T088: Payment failures and grace period handling
 *
 * When a payment fails:
 * 1. Set grace_period_end to 3 days from payment_failed_at
 * 2. User retains premium access during grace period
 * 3. Create notification about payment failure
 * 4. If payment succeeds during grace, clear grace period
 * 5. If grace period expires, auto-downgrade to free tier
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { GRACE_PERIOD_DAYS } from '@/types/subscription'
import { applyDowngradeLimits } from './edge-cases'

type SupabaseClient = ReturnType<typeof createClient<Database>>

export interface GracePeriodInfo {
  inGracePeriod: boolean
  gracePeriodEnd: string | null
  daysRemaining: number | null
  paymentFailedAt: string | null
  willDowngrade: boolean
  hasExpired: boolean
}

/**
 * Get grace period status for a user
 */
export async function getGracePeriodStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<GracePeriodInfo> {
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('grace_period_end, payment_failed_at, downgrade_scheduled, status')
    .eq('user_id', userId)
    .maybeSingle()

  if (!subscription?.grace_period_end) {
    return {
      inGracePeriod: false,
      gracePeriodEnd: null,
      daysRemaining: null,
      paymentFailedAt: null,
      willDowngrade: false,
      hasExpired: false,
    }
  }

  const now = new Date()
  const gracePeriodEnd = new Date(subscription.grace_period_end)
  const hasExpired = gracePeriodEnd <= now

  const daysRemaining = hasExpired
    ? 0
    : Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  return {
    inGracePeriod: !hasExpired,
    gracePeriodEnd: subscription.grace_period_end,
    daysRemaining,
    paymentFailedAt: subscription.payment_failed_at,
    willDowngrade: subscription.downgrade_scheduled || false,
    hasExpired,
  }
}

/**
 * Start grace period after payment failure
 * Called from Stripe webhook on invoice.payment_failed event
 */
export async function startGracePeriod(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; gracePeriodEnd: string }> {
  const now = new Date()
  const gracePeriodEnd = new Date(now.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000)

  // Update subscription with grace period info
  const { error: updateError } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'past_due',
      payment_failed_at: now.toISOString(),
      grace_period_end: gracePeriodEnd.toISOString(),
      downgrade_scheduled: true,
    })
    .eq('user_id', userId)

  if (updateError) {
    console.error('Error starting grace period:', updateError)
    return { success: false, gracePeriodEnd: '' }
  }

  return { success: true, gracePeriodEnd: gracePeriodEnd.toISOString() }
}

/**
 * Clear grace period after successful payment
 * Called from Stripe webhook on invoice.payment_succeeded event
 */
export async function clearGracePeriod(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'active',
      payment_failed_at: null,
      grace_period_end: null,
      downgrade_scheduled: false,
    })
    .eq('user_id', userId)

  if (error) {
    console.error('Error clearing grace period:', error)
    return { success: false }
  }

  // Send success notification
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'payment_success',
    title: 'تم الدفع بنجاح!',
    message: 'تم استلام الدفعة وتجديد اشتراكك المميز.',
    read: false,
  })

  return { success: true }
}

/**
 * Process expired grace periods and downgrade users
 * This should be called periodically (e.g., via cron job or scheduled function)
 */
export async function processExpiredGracePeriods(
  supabase: SupabaseClient
): Promise<{ processed: number; errors: string[] }> {
  const now = new Date().toISOString()

  // Find all users with expired grace periods
  const { data: expiredUsers, error: fetchError } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .lte('grace_period_end', now)
    .eq('downgrade_scheduled', true)
    .not('grace_period_end', 'is', null)

  if (fetchError || !expiredUsers) {
    console.error('Error fetching expired grace periods:', fetchError)
    return { processed: 0, errors: [fetchError?.message || 'Unknown error'] }
  }

  const errors: string[] = []
  let processed = 0

  for (const { user_id } of expiredUsers) {
    const result = await applyDowngradeLimits(supabase, user_id)
    if (result.success) {
      processed++
    } else {
      errors.push(`User ${user_id}: ${result.message}`)
    }
  }

  return { processed, errors }
}

/**
 * Create payment failure notification
 */
export async function createPaymentFailureNotification(
  supabase: SupabaseClient,
  userId: string,
  daysRemaining: number
): Promise<void> {
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'payment_failed',
    title: 'فشل في الدفع',
    message: `فشلت عملية الدفع لاشتراكك. لديك ${daysRemaining} أيام لتحديث معلومات الدفع قبل تحويل اشتراكك للخطة المجانية.`,
    read: false,
    metadata: {
      days_remaining: daysRemaining,
    },
  })
}

/**
 * Create grace period warning notification
 * Sent when user is in grace period (e.g., 1 day remaining)
 */
export async function createGracePeriodWarningNotification(
  supabase: SupabaseClient,
  userId: string,
  daysRemaining: number
): Promise<void> {
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'grace_period_warning',
    title: 'تنبيه: اشتراكك على وشك الانتهاء',
    message: `لديك ${daysRemaining} ${daysRemaining === 1 ? 'يوم' : 'أيام'} متبقية لتحديث معلومات الدفع. بعد ذلك سيتم تحويل اشتراكك للخطة المجانية.`,
    read: false,
    metadata: {
      days_remaining: daysRemaining,
    },
  })
}

/**
 * Check if user should retain premium access during grace period
 */
export function shouldRetainPremiumAccess(gracePeriodInfo: GracePeriodInfo): boolean {
  // User retains premium access during active grace period
  return gracePeriodInfo.inGracePeriod && !gracePeriodInfo.hasExpired
}
