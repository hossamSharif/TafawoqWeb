import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * GET /api/profile/export
 * Export all user data (premium only) - PDPL data portability compliance
 *
 * Returns a JSON file containing:
 * - Profile information
 * - Exam history and results
 * - Practice session history
 * - Performance analytics
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
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

    // Check if user has premium subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier, status')
      .eq('user_id', session.user.id)
      .single()

    const hasPremium = subscription?.tier === 'premium' &&
      ['active', 'trialing'].includes(subscription?.status || '')

    if (!hasPremium) {
      return NextResponse.json(
        {
          error: 'تصدير البيانات متاح فقط للمشتركين المميزين',
          upgradeRequired: true
        },
        { status: 403 }
      )
    }

    // Fetch all user data in parallel
    const [
      profileResult,
      examSessionsResult,
      examResultsResult,
      practiceSessionsResult,
      practiceResultsResult,
      answersResult,
      analyticsResult,
    ] = await Promise.all([
      // Profile
      supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single(),

      // Exam sessions
      supabase
        .from('exam_sessions')
        .select('id, track, status, questions_answered, total_questions, verbal_score, quantitative_score, overall_score, started_at, completed_at, time_spent_seconds, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false }),

      // Exam results
      supabase
        .from('exam_results')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false }),

      // Practice sessions
      supabase
        .from('practice_sessions')
        .select('id, section, categories, difficulty, question_count, status, started_at, completed_at, time_spent_seconds, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false }),

      // Practice results
      supabase
        .from('practice_results')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false }),

      // Answers (limited to last 1000 for performance)
      supabase
        .from('answers')
        .select('session_id, session_type, question_index, selected_answer, is_correct, time_spent_seconds, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1000),

      // Analytics
      supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', session.user.id)
        .single(),
    ])

    // Compile export data
    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: '1.0',
      user: {
        id: session.user.id,
        email: session.user.email,
        createdAt: session.user.created_at,
      },
      profile: profileResult.data ? {
        academicTrack: profileResult.data.academic_track,
        onboardingCompleted: profileResult.data.onboarding_completed,
        totalPracticeHours: profileResult.data.total_practice_hours,
        createdAt: profileResult.data.created_at,
        lastActiveAt: profileResult.data.last_active_at,
      } : null,
      subscription: subscription ? {
        tier: subscription.tier,
        status: subscription.status,
      } : null,
      examHistory: {
        totalExams: examSessionsResult.data?.length || 0,
        sessions: examSessionsResult.data?.map(exam => ({
          id: exam.id,
          track: exam.track,
          status: exam.status,
          questionsAnswered: exam.questions_answered,
          totalQuestions: exam.total_questions,
          scores: {
            verbal: exam.verbal_score,
            quantitative: exam.quantitative_score,
            overall: exam.overall_score,
          },
          startedAt: exam.started_at,
          completedAt: exam.completed_at,
          timeSpentSeconds: exam.time_spent_seconds,
          createdAt: exam.created_at,
        })) || [],
        results: examResultsResult.data?.map(result => ({
          examSessionId: result.exam_session_id,
          verbalScore: result.verbal_score,
          quantitativeScore: result.quantitative_score,
          overallAverage: result.overall_average,
          strengths: result.strengths,
          weaknesses: result.weaknesses,
          improvementAdvice: result.improvement_advice,
          createdAt: result.created_at,
        })) || [],
      },
      practiceHistory: {
        totalPracticeSessions: practiceSessionsResult.data?.length || 0,
        sessions: practiceSessionsResult.data?.map(practice => ({
          id: practice.id,
          section: practice.section,
          categories: practice.categories,
          difficulty: practice.difficulty,
          questionCount: practice.question_count,
          status: practice.status,
          startedAt: practice.started_at,
          completedAt: practice.completed_at,
          timeSpentSeconds: practice.time_spent_seconds,
          createdAt: practice.created_at,
        })) || [],
        results: practiceResultsResult.data?.map(result => ({
          practiceSessionId: result.practice_session_id,
          overallScore: result.overall_score,
          categoryBreakdown: result.category_breakdown,
          strengths: result.strengths,
          weaknesses: result.weaknesses,
          improvementAdvice: result.improvement_advice,
          createdAt: result.created_at,
        })) || [],
      },
      answerHistory: {
        totalAnswers: answersResult.data?.length || 0,
        note: 'Limited to most recent 1000 answers',
        answers: answersResult.data?.map(answer => ({
          sessionId: answer.session_id,
          sessionType: answer.session_type,
          questionIndex: answer.question_index,
          selectedAnswer: answer.selected_answer,
          isCorrect: answer.is_correct,
          timeSpentSeconds: answer.time_spent_seconds,
          createdAt: answer.created_at,
        })) || [],
      },
      analytics: analyticsResult.data ? {
        lastExamScores: {
          verbal: analyticsResult.data.last_exam_verbal_score,
          quantitative: analyticsResult.data.last_exam_quantitative_score,
          overall: analyticsResult.data.last_exam_overall_average,
        },
        totalExamsCompleted: analyticsResult.data.total_exams_completed,
        totalPracticesCompleted: analyticsResult.data.total_practices_completed,
        totalPracticeHours: analyticsResult.data.total_practice_hours,
        strongestCategory: analyticsResult.data.strongest_category,
        weakestCategory: analyticsResult.data.weakest_category,
        lastActivityAt: analyticsResult.data.last_activity_at,
        updatedAt: analyticsResult.data.updated_at,
      } : null,
    }

    // Return as downloadable JSON file
    const filename = `tafawoq-export-${session.user.id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.json`

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Unexpected export error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع أثناء تصدير البيانات' },
      { status: 500 }
    )
  }
}
