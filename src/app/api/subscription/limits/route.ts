// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'
import { TIER_LIMITS } from '@/types/subscription'

/**
 * GET /api/subscription/limits
 * Returns user's complete limits and usage for the subscription tier
 * Includes generation limits, sharing limits, library access, and reward credits
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

    const userId = session.user.id

    // Fetch all required data in parallel
    const [
      subscriptionResult,
      creditsResult,
      monthlyUsageResult,
      libraryAccessResult,
    ] = await Promise.all([
      // Get subscription tier
      supabase
        .from('user_subscriptions')
        .select('tier, status')
        .eq('user_id', userId)
        .single(),

      // Get user credits including share credits
      supabase
        .from('user_credits')
        .select('exam_credits, practice_credits, share_credits_exam, share_credits_practice, library_access_used')
        .eq('user_id', userId)
        .single(),

      // Get monthly exam/practice generation usage
      supabase
        .rpc('get_monthly_usage', { p_user_id: userId })
        .single(),

      // Get library access count
      supabase
        .from('library_access')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
    ])

    // Determine subscription tier
    const isPremium = subscriptionResult.data?.tier === 'premium' &&
                      ['active', 'trialing'].includes(subscriptionResult.data?.status || '')
    const tier = isPremium ? 'premium' : 'free'
    const limits = TIER_LIMITS[tier]

    // Calculate generation usage
    const examsUsed = monthlyUsageResult.data?.exams_this_month || 0
    const practicesUsed = monthlyUsageResult.data?.practices_this_month || 0

    // Calculate sharing usage
    // The share_credits columns track remaining credits, not used credits
    // Default values based on tier if not set
    const defaultExamShares = limits.examSharesPerMonth
    const defaultPracticeShares = limits.practiceSharesPerMonth

    const examSharesRemaining = creditsResult.data?.share_credits_exam ?? defaultExamShares
    const practiceSharesRemaining = creditsResult.data?.share_credits_practice ?? defaultPracticeShares

    const examSharesUsed = defaultExamShares - examSharesRemaining
    const practiceSharesUsed = defaultPracticeShares - practiceSharesRemaining

    // Library access
    const libraryAccessUsed = libraryAccessResult.count || 0
    const libraryAccessLimit = limits.libraryAccessCount

    // Reward credits (these are bonus credits, not usage limits)
    const examCredits = creditsResult.data?.exam_credits || 0
    const practiceCredits = creditsResult.data?.practice_credits || 0

    // Build response matching UserLimits type
    const response = {
      tier,
      generation: {
        exams: {
          used: examsUsed,
          limit: limits.examsPerMonth,
          remaining: Math.max(0, limits.examsPerMonth - examsUsed),
        },
        practices: {
          used: practicesUsed,
          limit: limits.practicesPerMonth,
          remaining: Math.max(0, limits.practicesPerMonth - practicesUsed),
        },
      },
      sharing: {
        examSharesPerMonth: limits.examSharesPerMonth,
        practiceSharesPerMonth: limits.practiceSharesPerMonth,
        examSharesUsed: Math.max(0, examSharesUsed),
        practiceSharesUsed: Math.max(0, practiceSharesUsed),
        canShareExam: examSharesRemaining > 0,
        canSharePractice: practiceSharesRemaining > 0,
      },
      library: {
        accessUsed: libraryAccessUsed,
        accessLimit: libraryAccessLimit,
      },
      rewards: {
        examCredits,
        practiceCredits,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Limits fetch error:', error)
    return NextResponse.json(
      { error: 'فشل في جلب بيانات الحدود' },
      { status: 500 }
    )
  }
}
