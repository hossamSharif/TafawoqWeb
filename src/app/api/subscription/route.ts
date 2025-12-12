// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'
import { SUBSCRIPTION_CONFIG } from '@/lib/stripe/server'

/**
 * GET /api/subscription
 * Get current user's subscription details
 */
export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'غير مصرح. يرجى تسجيل الدخول.' },
        { status: 401 }
      )
    }

    // Fetch subscription from database
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('Subscription fetch error:', subscriptionError)
      return NextResponse.json(
        { error: 'فشل في جلب بيانات الاشتراك' },
        { status: 500 }
      )
    }

    // Calculate subscription details
    const tier = subscription?.tier || 'free'
    const status = subscription?.status || 'active'
    const isPremium = tier === 'premium' && ['active', 'trialing'].includes(status)

    // Calculate days remaining in trial/period
    let daysRemaining: number | null = null
    let isTrialing = false

    if (subscription?.trial_end_at) {
      const trialEnd = new Date(subscription.trial_end_at)
      const now = new Date()
      if (trialEnd > now) {
        isTrialing = true
        daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      }
    } else if (subscription?.current_period_end) {
      const periodEnd = new Date(subscription.current_period_end)
      const now = new Date()
      if (periodEnd > now) {
        daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      }
    }

    // Get feature configuration
    const features = isPremium ? SUBSCRIPTION_CONFIG.PREMIUM : SUBSCRIPTION_CONFIG.FREE

    return NextResponse.json({
      success: true,
      subscription: {
        tier,
        status,
        isPremium,
        isTrialing,
        daysRemaining,
        currentPeriodStart: subscription?.current_period_start || null,
        currentPeriodEnd: subscription?.current_period_end || null,
        trialEndAt: subscription?.trial_end_at || null,
        canceledAt: subscription?.canceled_at || null,
        stripeCustomerId: subscription?.stripe_customer_id || null,
        stripeSubscriptionId: subscription?.stripe_subscription_id || null,
      },
      features: {
        name: features.name,
        examsPerWeek: features.examsPerWeek === Infinity ? 'غير محدود' : features.examsPerWeek,
        practiceUnlimited: features.practiceUnlimited,
        featureList: features.features,
      },
    })
  } catch (error) {
    console.error('Unexpected subscription error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
