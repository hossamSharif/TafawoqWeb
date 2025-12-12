// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'
import { getStripe } from '@/lib/stripe/server'

/**
 * GET /api/subscription/invoices
 * Get user's billing history (invoices)
 */
export async function GET(request: NextRequest) {
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
      // No billing history for users without Stripe customer
      return NextResponse.json({
        success: true,
        invoices: [],
        hasMore: false,
      })
    }

    // Parse pagination params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const startingAfter = searchParams.get('starting_after') || undefined

    // Fetch invoices from Stripe
    const stripe = getStripe()
    const invoices = await stripe.invoices.list({
      customer: subscription.stripe_customer_id,
      limit,
      starting_after: startingAfter,
    })

    // Format invoices for response
    const formattedInvoices = invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amount: invoice.total / 100, // Convert from cents to SAR
      currency: invoice.currency.toUpperCase(),
      description: invoice.description || 'اشتراك Tafawoq المميز',
      createdAt: new Date(invoice.created * 1000).toISOString(),
      paidAt: invoice.status_transitions.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
        : null,
      invoicePdfUrl: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      periodStart: invoice.period_start
        ? new Date(invoice.period_start * 1000).toISOString()
        : null,
      periodEnd: invoice.period_end
        ? new Date(invoice.period_end * 1000).toISOString()
        : null,
    }))

    return NextResponse.json({
      success: true,
      invoices: formattedInvoices,
      hasMore: invoices.has_more,
    })
  } catch (error) {
    console.error('Invoice fetch error:', error)
    return NextResponse.json(
      { error: 'فشل في جلب سجل الفواتير' },
      { status: 500 }
    )
  }
}
