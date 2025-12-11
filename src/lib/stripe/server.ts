import Stripe from 'stripe'
import { serverEnv } from '@/lib/env'

/**
 * Stripe server-side client
 * Uses lazy initialization to avoid build-time errors
 */
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(serverEnv.stripe.secretKey, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  }
  return _stripe
}

// Legacy export for backwards compatibility
export const stripe = {
  get checkout() { return getStripe().checkout },
  get customers() { return getStripe().customers },
  get subscriptions() { return getStripe().subscriptions },
  get billingPortal() { return getStripe().billingPortal },
  get webhooks() { return getStripe().webhooks },
}

/**
 * Subscription tier configuration
 */
export const SUBSCRIPTION_CONFIG = {
  FREE: {
    name: 'free',
    priceId: null,
    examsPerWeek: 1,
    practiceUnlimited: false,
    features: [
      'اختبار قياسي واحد أسبوعياً',
      'تمارين محدودة',
      'نتائج أساسية',
    ],
  },
  PREMIUM: {
    name: 'premium',
    priceId: serverEnv.stripe.premiumPriceId,
    examsPerWeek: Infinity,
    practiceUnlimited: true,
    features: [
      'اختبارات قياسية غير محدودة',
      'تمارين غير محدودة',
      'تحليل مفصل للأداء',
      'نصائح تحسين مخصصة',
      'تتبع التقدم المتقدم',
    ],
  },
} as const

/**
 * Create a Stripe checkout session for premium subscription
 */
export async function createCheckoutSession(
  customerId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: SUBSCRIPTION_CONFIG.PREMIUM.priceId!,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
    allow_promotion_codes: true,
  })

  return session
}

/**
 * Create a Stripe customer
 */
export async function createCustomer(email: string, userId: string): Promise<Stripe.Customer> {
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  })

  return customer
}

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateCustomer(
  email: string,
  userId: string,
  existingCustomerId?: string | null
): Promise<Stripe.Customer> {
  if (existingCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(existingCustomerId)
      if (!customer.deleted) {
        return customer as Stripe.Customer
      }
    } catch {
      // Customer not found, create new one
    }
  }

  return createCustomer(email, userId)
}

/**
 * Create a billing portal session
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.cancel(subscriptionId)
  return subscription
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  return subscription
}

/**
 * Verify webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    serverEnv.stripe.webhookSecret
  )
}
