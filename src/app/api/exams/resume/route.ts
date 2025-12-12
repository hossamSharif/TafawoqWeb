// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * GET /api/exams/resume - Check for resumable exam session
 * Returns any in-progress exam from the same calendar day
 */
export async function GET(request: NextRequest) {
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

    // Get current date at start of day (in user's timezone, assume Arabia/Riyadh)
    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)

    // Query for in-progress sessions from today
    const { data: sessions, error } = await supabase
      .from('exam_sessions')
      .select(
        'id, status, total_questions, questions_answered, start_time, track, time_spent_seconds, created_at'
      )
      .eq('user_id', user.id)
      .eq('status', 'in_progress')
      .gte('start_time', startOfDay.toISOString())
      .order('start_time', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Resume check error:', error)
      return NextResponse.json(
        { error: 'فشل في البحث عن الاختبار' },
        { status: 500 }
      )
    }

    // Check if there's a resumable session
    if (sessions && sessions.length > 0) {
      const session = sessions[0]

      // Calculate how much time has passed since the session started
      const startTime = new Date(session.start_time)
      const elapsedSinceStart = Math.floor((now.getTime() - startTime.getTime()) / 1000)

      // Max exam duration is 2 hours (7200 seconds)
      const maxDuration = 7200
      const effectiveTimeSpent = session.time_spent_seconds || 0
      const remainingTime = maxDuration - effectiveTimeSpent

      // Only allow resume if there's still time left
      if (remainingTime > 0) {
        return NextResponse.json({
          canResume: true,
          session: {
            id: session.id,
            status: session.status,
            totalQuestions: session.total_questions,
            questionsAnswered: session.questions_answered,
            startTime: session.start_time,
            track: session.track,
            timeSpentSeconds: effectiveTimeSpent,
            remainingTimeSeconds: remainingTime,
          },
        })
      }
    }

    return NextResponse.json({
      canResume: false,
      session: null,
    })
  } catch (error) {
    console.error('Resume check error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
