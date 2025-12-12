/**
 * Subscription management utilities
 */

import { getStripe, SUBSCRIPTION_CONFIG } from './server'
import type Stripe from 'stripe'

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired'
export type SubscriptionTier = 'free' | 'premium'

export interface SubscriptionInfo {
  tier: SubscriptionTier
  status: SubscriptionStatus
  stripeSubscriptionId: string | null
  currentPeriodStart: Date | null
  currentPeriodEnd: Date | null
  trialEnd: Date | null
  canceledAt: Date | null
  cancelAtPeriodEnd: boolean
}

/**
 * Parse a Stripe subscription into our subscription info format
 */
export function parseStripeSubscription(subscription: Stripe.Subscription): SubscriptionInfo {
  const isActive = ['active', 'trialing'].includes(subscription.status)

  return {
    tier: isActive ? 'premium' : 'free',
    status: subscription.status as SubscriptionStatus,
    stripeSubscriptionId: subscription.id,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    trialEnd: subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null,
    canceledAt: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000)
      : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  }
}

/**
 * Check if a subscription is in an active state
 */
export function isSubscriptionActive(status: string): boolean {
  return ['active', 'trialing'].includes(status)
}

/**
 * Calculate days remaining until subscription ends
 */
export function getDaysRemaining(endDate: Date | string): number {
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

/**
 * Format subscription status for display (Arabic)
 */
export function formatSubscriptionStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'نشط',
    trialing: 'فترة تجريبية',
    past_due: 'متأخر الدفع',
    canceled: 'ملغي',
    unpaid: 'غير مدفوع',
    incomplete: 'غير مكتمل',
    incomplete_expired: 'انتهت صلاحيته',
  }
  return statusMap[status] || status
}

/**
 * Get features for a subscription tier
 */
export function getTierFeatures(tier: SubscriptionTier) {
  return tier === 'premium'
    ? SUBSCRIPTION_CONFIG.PREMIUM
    : SUBSCRIPTION_CONFIG.FREE
}

/**
 * Check if user has premium access
 */
export function hasPremiumAccess(tier: string, status: string): boolean {
  return tier === 'premium' && isSubscriptionActive(status)
}

/**
 * Sync subscription status from Stripe to local database format
 */
export function mapStripeStatusToLocal(
  subscription: Stripe.Subscription
): {
  tier: SubscriptionTier
  status: SubscriptionStatus
  current_period_start: string
  current_period_end: string
  trial_end_at: string | null
  canceled_at: string | null
} {
  return {
    tier: isSubscriptionActive(subscription.status) ? 'premium' : 'free',
    status: subscription.status as SubscriptionStatus,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    trial_end_at: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
  }
}

/**
 * Get Stripe subscription by ID
 */
export async function getSubscriptionById(subscriptionId: string): Promise<Stripe.Subscription> {
  const stripe = getStripe()
  return stripe.subscriptions.retrieve(subscriptionId)
}

/**
 * List all subscriptions for a customer
 */
export async function listCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
  const stripe = getStripe()
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 10,
  })
  return subscriptions.data
}

/**
 * Resume a paused subscription
 */
export async function resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const stripe = getStripe()
  return stripe.subscriptions.resume(subscriptionId, {
    billing_cycle_anchor: 'now',
  })
}
