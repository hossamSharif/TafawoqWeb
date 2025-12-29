import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { checkPauseLimits } from '@/lib/sessions/limits'
import type { Tables } from '@/lib/supabase/types'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

interface PauseRequestBody {
  remainingTimeSeconds: number
  currentTimeSpent: number
}

/**
 * POST /api/exams/[sessionId]/pause - Pause an in-progress exam
 *
 * Pauses the exam session and stores the remaining time for precise timer resume.
 * Enforces limit of 1 paused exam per user.
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
    const { remainingTimeSeconds, currentTimeSpent } = body

    if (typeof remainingTimeSeconds !== 'number' || remainingTimeSeconds < 0) {
      return NextResponse.json(
        { error: 'الوقت المتبقي غير صالح' },
        { status: 400 }
      )
    }

    // Get session
    const { data: sessionData, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    const session = sessionData as Tables<'exam_sessions'> | null

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'لم يتم العثور على جلسة الاختبار' },
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
        { error: 'يمكن إيقاف الاختبارات الجارية فقط' },
        { status: 400 }
      )
    }

    // Check pause limits - max 1 exam paused at a time
    const limits = await checkPauseLimits(supabase as any, user.id)

    if (!limits.canPauseExam) {
      return NextResponse.json(
        {
          error: 'لديك اختبار متوقف بالفعل. يرجى استئنافه أو إنهاؤه قبل إيقاف اختبار آخر',
          pausedExamId: limits.pausedExamId,
        },
        { status: 409 }
      )
    }

    // Pause the session
    const { data: updatedData, error: updateError } = await (supabase
      .from('exam_sessions') as any)
      .update({
        status: 'paused',
        paused_at: new Date().toISOString(),
        remaining_time_seconds: remainingTimeSeconds,
        time_spent_seconds: currentTimeSpent || session.time_spent_seconds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single()

    const updatedSession = updatedData as Tables<'exam_sessions'> | null

    if (updateError || !updatedSession) {
      console.error('Pause exam error:', updateError)
      return NextResponse.json(
        { error: 'فشل في إيقاف الاختبار' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      session: {
        id: updatedSession.id,
        status: updatedSession.status,
        pausedAt: updatedSession.paused_at,
        remainingTimeSeconds: updatedSession.remaining_time_seconds,
        timeSpentSeconds: updatedSession.time_spent_seconds,
        questionsAnswered: updatedSession.questions_answered,
        totalQuestions: updatedSession.total_questions,
      },
      message: 'تم إيقاف الاختبار بنجاح. يمكنك استئنافه في أي وقت.',
      invalidateLimitsCache: true, // Signal frontend to invalidate subscription limits cache
    })
  } catch (error) {
    console.error('Pause exam error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
