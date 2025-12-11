// @ts-nocheck
// TODO: Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

/**
 * GET /api/practice/[sessionId] - Get practice session details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Get practice session
    const { data: session, error: sessionError } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'لم يتم العثور على جلسة التمرين' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      session: {
        id: session.id,
        status: session.status,
        section: session.section,
        categories: session.categories,
        difficulty: session.difficulty,
        questionCount: session.question_count,
        startedAt: session.started_at,
        completedAt: session.completed_at,
        timeSpentSeconds: session.time_spent_seconds,
      },
    })
  } catch (error) {
    console.error('Practice session fetch error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

/**
 * PATCH /api/practice/[sessionId] - Update practice session status
 * Used for completing or abandoning a session
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params
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
    const body = await request.json()
    const { status, timeSpentSeconds } = body as {
      status?: 'completed' | 'abandoned'
      timeSpentSeconds?: number
    }

    // Validate status
    if (status && !['completed', 'abandoned'].includes(status)) {
      return NextResponse.json(
        { error: 'الحالة المحددة غير صالحة' },
        { status: 400 }
      )
    }

    // Get current session to verify ownership and status
    const { data: currentSession, error: fetchError } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !currentSession) {
      return NextResponse.json(
        { error: 'لم يتم العثور على جلسة التمرين' },
        { status: 404 }
      )
    }

    // Can only update in_progress sessions
    if (currentSession.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'لا يمكن تحديث جلسة منتهية' },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: Record<string, unknown> = {}

    if (status) {
      updateData.status = status
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }
    }

    if (typeof timeSpentSeconds === 'number') {
      updateData.time_spent_seconds = timeSpentSeconds
    }

    // Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from('practice_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Session update error:', updateError)
      return NextResponse.json(
        { error: 'فشل في تحديث جلسة التمرين' },
        { status: 500 }
      )
    }

    // If session is completed, update practice hours (T092)
    if (status === 'completed' && timeSpentSeconds) {
      const practiceHours = timeSpentSeconds / 3600 // Convert seconds to hours

      // Update user_profiles.total_practice_hours
      const { error: profileError } = await supabase.rpc(
        'calculate_practice_hours',
        { p_user_id: user.id }
      )

      if (profileError) {
        console.error('Practice hours update error:', profileError)
        // Don't fail the request, just log the error
      }

      // Also update user_analytics
      await supabase
        .from('user_analytics')
        .upsert({
          user_id: user.id,
          total_practice_hours: practiceHours,
          total_practices_completed: 1,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false,
        })
    }

    return NextResponse.json({
      session: {
        id: updatedSession.id,
        status: updatedSession.status,
        section: updatedSession.section,
        categories: updatedSession.categories,
        difficulty: updatedSession.difficulty,
        questionCount: updatedSession.question_count,
        startedAt: updatedSession.started_at,
        completedAt: updatedSession.completed_at,
        timeSpentSeconds: updatedSession.time_spent_seconds,
      },
    })
  } catch (error) {
    console.error('Practice session update error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
