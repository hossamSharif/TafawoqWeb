import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { checkPauseLimits } from '@/lib/sessions/limits'
import type { Tables } from '@/lib/supabase/types'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

interface PauseRequestBody {
  currentTimeSpent: number
}

/**
 * POST /api/practice/[sessionId]/pause - Pause an in-progress practice session
 *
 * Pauses the practice session. Practice sessions don't have countdown timers,
 * so only time spent is tracked.
 * Enforces limit of 1 paused practice per user.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params
    const supabase = await createServerClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Parse request body
    const body: PauseRequestBody = await request.json()
    const { currentTimeSpent } = body

    // Get session
    const { data: sessionData, error: sessionError } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    const session = sessionData as Tables<'practice_sessions'> | null

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'لم يتم العثور على جلسة التمرين' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (session.user_id !== user.id) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول لهذه الجلسة' },
        { status: 403 }
      )
    }

    // Check if session is in_progress
    if (session.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'يمكن إيقاف التمارين الجارية فقط' },
        { status: 400 }
      )
    }

    // Check pause limits - max 1 practice paused at a time
    const limits = await checkPauseLimits(supabase as any, user.id)

    if (!limits.canPausePractice) {
      return NextResponse.json(
        {
          error: 'لديك تمرين متوقف بالفعل. يرجى استئنافه أو إنهاؤه قبل إيقاف تمرين آخر',
          pausedPracticeId: limits.pausedPracticeId,
        },
        { status: 409 }
      )
    }

    // Pause the session
    const { data: updatedData, error: updateError } = await (supabase
      .from('practice_sessions') as any)
      .update({
        status: 'paused',
        paused_at: new Date().toISOString(),
        time_spent_seconds: currentTimeSpent || session.time_spent_seconds,
      })
      .eq('id', sessionId)
      .select()
      .single()

    const updatedSession = updatedData as Tables<'practice_sessions'> | null

    if (updateError || !updatedSession) {
      console.error('Pause practice error:', updateError)
      return NextResponse.json(
        { error: 'فشل في إيقاف التمرين' },
        { status: 500 }
      )
    }

    // Get answered questions count
    const { count: answeredCount } = await supabase
      .from('answers')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('session_type', 'practice')

    return NextResponse.json({
      success: true,
      session: {
        id: updatedSession.id,
        status: updatedSession.status,
        pausedAt: updatedSession.paused_at,
        timeSpentSeconds: updatedSession.time_spent_seconds,
        questionCount: updatedSession.question_count,
        questionsAnswered: answeredCount || 0,
        section: updatedSession.section,
        categories: updatedSession.categories,
        difficulty: updatedSession.difficulty,
      },
      message: 'تم إيقاف التمرين بنجاح. يمكنك استئنافه في أي وقت.',
      invalidateLimitsCache: true, // Signal frontend to invalidate subscription limits cache
    })
  } catch (error) {
    console.error('Pause practice error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
