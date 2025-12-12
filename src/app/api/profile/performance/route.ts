// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Fetch performance records
    const { data: performanceRecord, error: performanceError } = await supabase
      .from('performance_records')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (performanceError && performanceError.code !== 'PGRST116') {
      console.error('Error fetching performance:', performanceError)
      return NextResponse.json({ error: 'فشل في تحميل بيانات الأداء' }, { status: 500 })
    }

    // Fetch completed exam sessions for history
    const { data: examSessions, error: examError } = await supabase
      .from('exam_sessions')
      .select('id, verbal_score, quantitative_score, overall_score, end_time, created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10)

    if (examError) {
      console.error('Error fetching exam sessions:', examError)
    }

    // Build exam history for trend chart
    interface ExamSessionRow {
      id: string
      verbal_score: number | null
      quantitative_score: number | null
      overall_score: number | null
      end_time: string | null
      created_at: string
    }
    const examHistory = (examSessions as ExamSessionRow[] || [])
      .filter((session: ExamSessionRow) => session.overall_score !== null)
      .reverse() // Oldest first for chart
      .map((session: ExamSessionRow) => ({
        date: session.end_time || session.created_at,
        verbal: session.verbal_score || 0,
        quantitative: session.quantitative_score || 0,
        overall: session.overall_score || 0,
      }))

    // Calculate strengths and weaknesses from category scores
    const categoryScores = performanceRecord?.category_scores || {}
    const practiceStats = performanceRecord?.practice_stats || {}

    const categoryPerformance = Object.entries(categoryScores).map(([category, score]) => ({
      category,
      score: score as number,
      total: (practiceStats[category]?.total || 0) as number,
    }))

    const strengths = categoryPerformance
      .filter(cat => cat.score >= 75 && cat.total >= 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(cat => cat.category)

    const weaknesses = categoryPerformance
      .filter(cat => cat.score < 50 && cat.total >= 3)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map(cat => cat.category)

    return NextResponse.json({
      examHistory,
      categoryScores,
      totalExams: examSessions?.length || 0,
      totalQuestions: performanceRecord?.total_questions_answered || 0,
      totalCorrect: performanceRecord?.total_correct_answers || 0,
      weeklyExamCount: performanceRecord?.weekly_exam_count || 0,
      strengths,
      weaknesses,
    })
  } catch (error) {
    console.error('Profile performance error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
