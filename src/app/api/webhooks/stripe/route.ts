// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import type Stripe from 'stripe'
import { constructWebhookEvent, getStripe } from '@/lib/stripe/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import {
  startGracePeriod,
  clearGracePeriod,
  createPaymentFailureNotification,
  GRACE_PERIOD_DAYS,
} from '@/lib/subscription'

/**
 * Get admin Supabase client - lazy initialization
 */
function getSupabaseAdmin(): SupabaseClient<Database> {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = constructWebhookEvent(body, signature)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const stripe = getStripe()

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabaseAdmin, stripe)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabaseAdmin)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabaseAdmin)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, supabaseAdmin, stripe)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabaseAdmin)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabaseAdmin: SupabaseClient<Database>,
  stripe: Stripe
) {
  const userId = session.metadata?.userId
  if (!userId) {
    console.error('No userId in checkout session metadata')
    return
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

  // Update user subscription in database
  await supabaseAdmin.from('user_subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    tier: 'premium',
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    trial_end_at: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  }, {
    onConflict: 'user_id',
  })
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabaseAdmin: SupabaseClient<Database>
) {
  const userId = subscription.metadata?.userId
  if (!userId) {
    // Try to find user by customer ID
    const { data: existingSub } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (!existingSub) {
      console.error('No userId found for subscription:', subscription.id)
      return
    }

    await updateSubscriptionInDb(existingSub.user_id, subscription, supabaseAdmin)
    return
  }

  await updateSubscriptionInDb(userId, subscription, supabaseAdmin)
}

async function updateSubscriptionInDb(
  userId: string,
  subscription: Stripe.Subscription,
  supabaseAdmin: SupabaseClient<Database>
) {
  const tier = subscription.status === 'active' ? 'premium' : 'free'

  await supabaseAdmin.from('user_subscriptions').upsert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    tier,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    trial_end_at: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  }, {
    onConflict: 'user_id',
  })
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabaseAdmin: SupabaseClient<Database>
) {
  const { data: existingSub } = await supabaseAdmin
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!existingSub) {
    console.error('No subscription found to delete:', subscription.id)
    return
  }

  await supabaseAdmin.from('user_subscriptions').update({
    status: 'canceled',
    tier: 'free',
    canceled_at: new Date().toISOString(),
  }).eq('user_id', existingSub.user_id)
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabaseAdmin: SupabaseClient<Database>,
  stripe: Stripe
) {
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)

    // Get user from subscription
    const { data: existingSub } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id, grace_period_end')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (existingSub) {
      // If user was in grace period, clear it
      if (existingSub.grace_period_end) {
        await clearGracePeriod(supabaseAdmin, existingSub.user_id)
        console.log(`[Stripe Webhook] Cleared grace period for user ${existingSub.user_id} after successful payment`)
      }
    }

    await handleSubscriptionUpdated(subscription, supabaseAdmin)
  }
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabaseAdmin: SupabaseClient<Database>
) {
  const { data: existingSub } = await supabaseAdmin
    .from('user_subscriptions')
    .select('user_id, grace_period_end')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single()

  if (!existingSub) {
    console.error('[Stripe Webhook] No subscription found for invoice:', invoice.id)
    return
  }

  const userId = existingSub.user_id

  // Check if already in grace period
  if (existingSub.grace_period_end) {
    console.log(`[Stripe Webhook] User ${userId} already in grace period, skipping duplicate handling`)
    return
  }

  // Start grace period
  const { success, gracePeriodEnd } = await startGracePeriod(supabaseAdmin, userId)

  if (success) {
    // Create payment failure notification
    await createPaymentFailureNotification(supabaseAdmin, userId, GRACE_PERIOD_DAYS)

    console.log(`[Stripe Webhook] Started grace period for user ${userId}, ends at ${gracePeriodEnd}`)
  } else {
    // Fallback: just update status to past_due if grace period fails
    await supabaseAdmin.from('user_subscriptions').update({
      status: 'past_due',
    }).eq('user_id', userId)

    console.error(`[Stripe Webhook] Failed to start grace period for user ${userId}`)
  }
}
