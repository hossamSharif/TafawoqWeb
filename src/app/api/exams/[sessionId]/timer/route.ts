import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

/**
 * PATCH /api/exams/[sessionId]/timer - Pause/resume exam timer
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const body = await request.json()
    const { action, currentTimeSpent, pauseDuration } = body

    if (!['pause', 'resume', 'sync'].includes(action)) {
      return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 })
    }

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'لم يتم العثور على جلسة الاختبار' },
        { status: 404 }
      )
    }

    if (session.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'الاختبار ليس قيد التقدم' },
        { status: 400 }
      )
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (action === 'sync' && typeof currentTimeSpent === 'number') {
      // Just sync the current time spent
      updates.time_spent_seconds = currentTimeSpent
    } else if (action === 'pause') {
      // Record pause - no specific field for pause state, we track cumulative pause time
      // Client should track pause start time
      updates.time_spent_seconds = currentTimeSpent || session.time_spent_seconds
    } else if (action === 'resume' && typeof pauseDuration === 'number') {
      // Add pause duration to cumulative paused time
      updates.time_paused_seconds =
        (session.time_paused_seconds || 0) + pauseDuration
      updates.time_spent_seconds = currentTimeSpent || session.time_spent_seconds
    }

    const { data: updatedSession, error: updateError } = await supabase
      .from('exam_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select('id, time_spent_seconds, time_paused_seconds, updated_at')
      .single()

    if (updateError) {
      console.error('Timer update error:', updateError)
      return NextResponse.json(
        { error: 'فشل في تحديث المؤقت' },
        { status: 500 }
      )
    }

    // Calculate remaining time (120 minutes = 7200 seconds)
    const EXAM_DURATION_SECONDS = 7200
    const effectiveTimeSpent = updatedSession.time_spent_seconds || 0
    const remainingSeconds = Math.max(0, EXAM_DURATION_SECONDS - effectiveTimeSpent)

    return NextResponse.json({
      timeSpentSeconds: updatedSession.time_spent_seconds,
      timePausedSeconds: updatedSession.time_paused_seconds,
      remainingSeconds,
      isExpired: remainingSeconds <= 0,
    })
  } catch (error) {
    console.error('Timer update error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

/**
 * GET /api/exams/[sessionId]/timer - Get current timer state
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select(
        'id, status, start_time, time_spent_seconds, time_paused_seconds'
      )
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'لم يتم العثور على جلسة الاختبار' },
        { status: 404 }
      )
    }

    // Calculate remaining time
    const EXAM_DURATION_SECONDS = 7200
    const effectiveTimeSpent = session.time_spent_seconds || 0
    const remainingSeconds = Math.max(0, EXAM_DURATION_SECONDS - effectiveTimeSpent)

    return NextResponse.json({
      sessionId: session.id,
      status: session.status,
      startTime: session.start_time,
      timeSpentSeconds: session.time_spent_seconds,
      timePausedSeconds: session.time_paused_seconds,
      remainingSeconds,
      totalDurationSeconds: EXAM_DURATION_SECONDS,
      isExpired: remainingSeconds <= 0,
    })
  } catch (error) {
    console.error('Get timer error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
