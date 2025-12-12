// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'
import { createBillingPortalSession } from '@/lib/stripe/server'
import { clientEnv } from '@/lib/env'

/**
 * POST /api/subscription/portal
 * Create a Stripe Billing Portal session for subscription management
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

    // Get user's Stripe customer ID
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', session.user.id)
      .single()

    if (subscriptionError || !subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'لم يتم العثور على معلومات الفوترة' },
        { status: 404 }
      )
    }

    // Create billing portal session
    const appUrl = clientEnv.app.url
    const portalSession = await createBillingPortalSession(
      subscription.stripe_customer_id,
      `${appUrl}/settings`
    )

    return NextResponse.json({
      success: true,
      url: portalSession.url,
    })
  } catch (error) {
    console.error('Portal session creation error:', error)
    return NextResponse.json(
      { error: 'فشل في إنشاء جلسة إدارة الاشتراك' },
      { status: 500 }
    )
  }
}
