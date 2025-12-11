import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { clientEnv } from '@/lib/env'

/**
 * Stripe client for browser-side usage
 * Uses the publishable key for client-side operations
 */
let stripePromise: Promise<Stripe | null> | null = null

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(clientEnv.stripe.publishableKey)
  }
  return stripePromise
}

/**
 * Redirect to Stripe Checkout for subscription
 */
export async function redirectToCheckout(sessionId: string): Promise<void> {
  const stripe = await getStripe()
  if (!stripe) {
    throw new Error('Stripe failed to load')
  }

  const { error } = await stripe.redirectToCheckout({ sessionId })
  if (error) {
    throw error
  }
}

/**
 * Redirect to Stripe Customer Portal for subscription management
 */
export async function redirectToPortal(portalUrl: string): Promise<void> {
  window.location.href = portalUrl
}
