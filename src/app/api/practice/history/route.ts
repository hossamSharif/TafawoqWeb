// @ts-nocheck
// TODO: Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { CATEGORY_LABELS } from '@/types/question'

/**
 * GET /api/practice/history - Get user's practice history with analytics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const section = searchParams.get('section') // Optional filter by section
    const category = searchParams.get('category') // Optional filter by category

    // Build query for practice sessions with results
    let query = supabase
      .from('practice_sessions')
      .select(`
        id,
        section,
        categories,
        difficulty,
        question_count,
        status,
        started_at,
        completed_at,
        time_spent_seconds,
        practice_results (
          overall_score,
          category_breakdown,
          strengths,
          weaknesses
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (section) {
      query = query.eq('section', section)
    }

    if (category) {
      query = query.contains('categories', [category])
    }

    const { data: sessions, error: sessionsError, count } = await query

    if (sessionsError) {
      console.error('Practice history fetch error:', sessionsError)
      return NextResponse.json(
        { error: 'فشل في جلب سجل التمرينات' },
        { status: 500 }
      )
    }

    // Get aggregate statistics
    const { data: stats, error: statsError } = await supabase
      .from('user_analytics')
      .select('total_practices_completed, total_practice_hours')
      .eq('user_id', user.id)
      .single()

    // Get category performance
    const { data: categoryPerformance, error: perfError } = await supabase.rpc(
      'get_category_performance',
      { p_user_id: user.id }
    )

    // Format sessions for response
    const formattedSessions = sessions?.map((session) => ({
      id: session.id,
      section: session.section,
      sectionLabel: session.section === 'quantitative' ? 'القسم الكمي' : 'القسم اللفظي',
      categories: session.categories,
      categoryLabels: session.categories.map((cat: string) => CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat),
      difficulty: session.difficulty,
      difficultyLabel: getDifficultyLabel(session.difficulty),
      questionCount: session.question_count,
      status: session.status,
      startedAt: session.started_at,
      completedAt: session.completed_at,
      timeSpentSeconds: session.time_spent_seconds,
      timeSpentFormatted: formatTime(session.time_spent_seconds || 0),
      result: session.practice_results?.[0] ? {
        score: session.practice_results[0].overall_score,
        categoryBreakdown: session.practice_results[0].category_breakdown,
        strengths: session.practice_results[0].strengths,
        weaknesses: session.practice_results[0].weaknesses,
      } : null,
    }))

    // Format category performance for response
    const formattedCategoryPerformance = categoryPerformance?.map((perf: {
      category: string
      accuracy: number
      total_questions: number
      correct_answers: number
    }) => ({
      category: perf.category,
      categoryLabel: CATEGORY_LABELS[perf.category as keyof typeof CATEGORY_LABELS] || perf.category,
      accuracy: perf.accuracy,
      totalQuestions: perf.total_questions,
      correctAnswers: perf.correct_answers,
    }))

    return NextResponse.json({
      sessions: formattedSessions || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
        hasMore: (offset + limit) < (count || 0),
      },
      statistics: {
        totalPracticesCompleted: stats?.total_practices_completed || 0,
        totalPracticeHours: stats?.total_practice_hours || 0,
        categoryPerformance: formattedCategoryPerformance || [],
      },
    })
  } catch (error) {
    console.error('Practice history error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

/**
 * Get Arabic label for difficulty level
 */
function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب',
  }
  return labels[difficulty] || difficulty
}

/**
 * Format seconds to human-readable time string in Arabic
 */
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} ثانية`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes} دقيقة و ${remainingSeconds} ثانية`
      : `${minutes} دقيقة`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0
    ? `${hours} ساعة و ${remainingMinutes} دقيقة`
    : `${hours} ساعة`
}
