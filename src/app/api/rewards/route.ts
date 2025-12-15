// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getUserRewards } from '@/lib/rewards/calculator'
import type { RewardsResponse } from '@/lib/rewards/types'

/**
 * GET /api/rewards - Get user's reward balance and stats
 */
export async function GET() {
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

    // Get rewards data
    const rewards: RewardsResponse = await getUserRewards(user.id)

    return NextResponse.json(rewards)
  } catch (error) {
    console.error('Get rewards error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
