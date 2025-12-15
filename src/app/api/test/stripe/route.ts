import { NextResponse } from 'next/server'
import { serverEnv } from '@/lib/env'
import Stripe from 'stripe'

/**
 * GET /api/test/stripe - Test Stripe API connection
 * TEMPORARY: For debugging - DELETE AFTER TESTING
 */
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  try {
    const secretKey = serverEnv.stripe.secretKey
    const priceId = serverEnv.stripe.premiumPriceId

    if (!secretKey) {
      return NextResponse.json({
        error: 'STRIPE_SECRET_KEY not configured',
        hasKey: false
      }, { status: 500 })
    }

    // Test Stripe connection
    const stripe = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })

    // Try to retrieve the price to verify it exists
    let priceInfo = null
    if (priceId) {
      try {
        priceInfo = await stripe.prices.retrieve(priceId)
      } catch (priceError) {
        return NextResponse.json({
          error: 'Price not found',
          priceId,
          priceError: priceError instanceof Error ? priceError.message : 'Unknown error',
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      hasKey: true,
      keyPrefix: secretKey.substring(0, 12) + '...',
      priceId,
      priceExists: !!priceInfo,
      priceDetails: priceInfo ? {
        id: priceInfo.id,
        active: priceInfo.active,
        currency: priceInfo.currency,
        unit_amount: priceInfo.unit_amount,
        product: priceInfo.product,
      } : null,
    })
  } catch (error) {
    console.error('Stripe test error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }
}
