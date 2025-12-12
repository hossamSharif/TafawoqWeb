import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'
import { getStripe } from '@/lib/stripe/server'

/**
 * POST /api/subscription/cancel
 * Cancel user's premium subscription (at end of billing period)
 */
export async function POST(_request: NextRequest) {
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

    // Get user's subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('stripe_subscription_id, status, tier')
      .eq('user_id', session.user.id)
      .single()

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { error: 'لم يتم العثور على اشتراك نشط' },
        { status: 404 }
      )
    }

    if (subscription.tier !== 'premium' || !['active', 'trialing'].includes(subscription.status)) {
      return NextResponse.json(
        { error: 'لا يوجد اشتراك مميز نشط للإلغاء' },
        { status: 400 }
      )
    }

    if (!subscription.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'لم يتم العثور على معرف الاشتراك' },
        { status: 400 }
      )
    }

    // Cancel subscription at end of period via Stripe
    const stripe = getStripe()
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: true }
    )

    // Update local database
    await supabase
      .from('user_subscriptions')
      .update({
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', session.user.id)

    return NextResponse.json({
      success: true,
      message: 'تم جدولة إلغاء الاشتراك بنجاح',
      cancelAt: updatedSubscription.cancel_at
        ? new Date(updatedSubscription.cancel_at * 1000).toISOString()
        : null,
      currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
    })
  } catch (error) {
    console.error('Subscription cancellation error:', error)
    return NextResponse.json(
      { error: 'فشل في إلغاء الاشتراك' },
      { status: 500 }
    )
  }
}
