// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { redeemCredit } from '@/lib/rewards/calculator'
import type { RedeemRequest, RedeemResponse } from '@/lib/rewards/types'

/**
 * POST /api/rewards/redeem - Redeem a credit for exam or practice access
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Parse request body
    const body: RedeemRequest = await request.json()

    // Validate credit_type
    if (!body.credit_type || !['exam', 'practice'].includes(body.credit_type)) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'نوع الرصيد مطلوب (exam أو practice)',
            details: { field: 'credit_type' },
          },
        },
        { status: 400 }
      )
    }

    // Attempt to redeem credit
    const result: RedeemResponse = await redeemCredit(user.id, body.credit_type)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Redeem credit error:', error)

    // Check for insufficient credits error
    if (error instanceof Error && error.message.includes('Insufficient')) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'رصيد غير كافٍ',
            details: { field: 'credit_type' },
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
