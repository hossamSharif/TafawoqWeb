import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getActiveSessions, checkPauseLimits } from '@/lib/sessions/limits'

/**
 * GET /api/sessions/active - Get user's in-progress and paused sessions
 *
 * Returns all active sessions (exam and practice) for the authenticated user.
 * Also includes pause limits information.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Get active sessions
    const { exams, practices } = await getActiveSessions(supabase as any, user.id)

    // Get pause limits
    const limits = await checkPauseLimits(supabase as any, user.id)

    // Combine and sort by creation date (most recent first)
    const allSessions = [...exams, ...practices].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Separate by status
    const inProgress = allSessions.filter(s => s.status === 'in_progress')
    const paused = allSessions.filter(s => s.status === 'paused')

    return NextResponse.json({
      success: true,
      sessions: {
        all: allSessions,
        inProgress,
        paused,
        exams,
        practices,
      },
      limits: {
        canPauseExam: limits.canPauseExam,
        canPausePractice: limits.canPausePractice,
        pausedExamCount: limits.pausedExamCount,
        pausedPracticeCount: limits.pausedPracticeCount,
        pausedExamId: limits.pausedExamId,
        pausedPracticeId: limits.pausedPracticeId,
      },
      counts: {
        total: allSessions.length,
        inProgress: inProgress.length,
        paused: paused.length,
        exams: exams.length,
        practices: practices.length,
      },
    })
  } catch (error) {
    console.error('Get active sessions error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
