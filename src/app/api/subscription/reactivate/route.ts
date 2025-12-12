import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'
import { getStripe } from '@/lib/stripe/server'

/**
 * POST /api/subscription/reactivate
 * Reactivate a canceled subscription (if still within billing period)
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
      .select('stripe_subscription_id, status, tier, canceled_at')
      .eq('user_id', session.user.id)
      .single()

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { error: 'لم يتم العثور على اشتراك' },
        { status: 404 }
      )
    }

    if (!subscription.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'لم يتم العثور على معرف الاشتراك' },
        { status: 400 }
      )
    }

    // Check if subscription is scheduled for cancellation
    const stripe = getStripe()
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)

    if (!stripeSubscription.cancel_at_period_end) {
      return NextResponse.json(
        { error: 'الاشتراك غير مجدول للإلغاء' },
        { status: 400 }
      )
    }

    // Reactivate subscription by removing cancel_at_period_end
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: false }
    )

    // Update local database
    await supabase
      .from('user_subscriptions')
      .update({
        canceled_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', session.user.id)

    return NextResponse.json({
      success: true,
      message: 'تم إعادة تفعيل الاشتراك بنجاح',
      status: updatedSubscription.status,
      currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
    })
  } catch (error) {
    console.error('Subscription reactivation error:', error)
    return NextResponse.json(
      { error: 'فشل في إعادة تفعيل الاشتراك' },
      { status: 500 }
    )
  }
}
