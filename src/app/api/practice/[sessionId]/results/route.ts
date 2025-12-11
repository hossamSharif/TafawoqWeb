// @ts-nocheck
// TODO: Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { CATEGORY_LABELS } from '@/types/question'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

/**
 * GET /api/practice/[sessionId]/results - Get practice session results
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

    // Check if session is completed
    if (session.status !== 'completed') {
      return NextResponse.json(
        { error: 'لم تنته جلسة التمرين بعد' },
        { status: 400 }
      )
    }

    // Check for existing results in practice_results table
    const { data: existingResult } = await supabase
      .from('practice_results')
      .select('*')
      .eq('practice_session_id', sessionId)
      .single()

    if (existingResult) {
      return NextResponse.json({
        results: {
          sessionId,
          score: existingResult.overall_score,
          totalQuestions: session.question_count,
          categoryBreakdown: existingResult.category_breakdown,
          strengths: existingResult.strengths,
          weaknesses: existingResult.weaknesses,
          improvementAdvice: existingResult.improvement_advice,
          timeSpentSeconds: session.time_spent_seconds,
          section: session.section,
          categories: session.categories,
          difficulty: session.difficulty,
          completedAt: session.completed_at,
        },
      })
    }

    // Calculate results from answers
    // Try practice_answers first, fall back to answers table
    let answers
    const { data: practiceAnswers } = await supabase
      .from('practice_answers')
      .select('*')
      .eq('session_id', sessionId)

    if (!practiceAnswers || practiceAnswers.length === 0) {
      const { data: genericAnswers, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .eq('session_id', sessionId)
        .eq('session_type', 'practice')

      if (answersError) {
        console.error('Answers fetch error:', answersError)
        return NextResponse.json(
          { error: 'فشل في جلب الإجابات' },
          { status: 500 }
        )
      }
      answers = genericAnswers
    } else {
      answers = practiceAnswers
    }

    if (!answers || answers.length === 0) {
      return NextResponse.json({
        results: {
          sessionId,
          score: 0,
          totalQuestions: session.question_count,
          correctAnswers: 0,
          categoryBreakdown: {},
          strengths: [],
          weaknesses: [],
          timeSpentSeconds: session.time_spent_seconds,
          section: session.section,
          categories: session.categories,
          difficulty: session.difficulty,
          completedAt: session.completed_at,
        },
      })
    }

    // Calculate overall score
    const correctAnswers = answers.filter((a) => a.is_correct).length
    const totalAnswered = answers.length
    const score = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0

    // Calculate category breakdown (simplified since questions aren't stored in session)
    const categoryBreakdown: Record<string, { correct: number; total: number; accuracy: number }> = {}

    // Use session categories for breakdown structure
    for (const category of session.categories) {
      categoryBreakdown[category] = {
        correct: 0,
        total: 0,
        accuracy: 0,
      }
    }

    // Since questions aren't stored with categories, distribute evenly
    const questionsPerCategory = Math.ceil(totalAnswered / session.categories.length)
    let answersIndex = 0

    for (const category of session.categories) {
      const categoryAnswers = answers.slice(answersIndex, answersIndex + questionsPerCategory)
      const categoryCorrect = categoryAnswers.filter((a) => a.is_correct).length

      categoryBreakdown[category] = {
        correct: categoryCorrect,
        total: categoryAnswers.length,
        accuracy: categoryAnswers.length > 0
          ? Math.round((categoryCorrect / categoryAnswers.length) * 100)
          : 0,
      }

      answersIndex += questionsPerCategory
    }

    // Determine strengths and weaknesses
    const categoryScores = Object.entries(categoryBreakdown).map(([cat, data]) => ({
      category: cat,
      categoryLabel: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat,
      accuracy: data.accuracy,
    }))

    const sortedCategories = [...categoryScores].sort((a, b) => b.accuracy - a.accuracy)
    const strengths = sortedCategories.filter((c) => c.accuracy >= 70).slice(0, 3)
    const weaknesses = sortedCategories.filter((c) => c.accuracy < 70).slice(-3).reverse()

    // Generate improvement advice
    const improvementAdvice = generateImprovementAdvice(score, weaknesses)

    // Store results
    const { error: resultError } = await supabase
      .from('practice_results')
      .insert({
        practice_session_id: sessionId,
        user_id: user.id,
        overall_score: score,
        category_breakdown: categoryBreakdown,
        strengths: strengths.map((s) => ({ category: s.category, label: s.categoryLabel, accuracy: s.accuracy })),
        weaknesses: weaknesses.map((w) => ({ category: w.category, label: w.categoryLabel, accuracy: w.accuracy })),
        improvement_advice: improvementAdvice,
      })

    if (resultError) {
      console.error('Result storage error:', resultError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      results: {
        sessionId,
        score,
        totalQuestions: session.question_count,
        correctAnswers,
        answeredQuestions: totalAnswered,
        categoryBreakdown: Object.entries(categoryBreakdown).map(([cat, data]) => ({
          category: cat,
          categoryLabel: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat,
          ...data,
        })),
        strengths: strengths.map((s) => ({ category: s.category, label: s.categoryLabel, accuracy: s.accuracy })),
        weaknesses: weaknesses.map((w) => ({ category: w.category, label: w.categoryLabel, accuracy: w.accuracy })),
        improvementAdvice,
        timeSpentSeconds: session.time_spent_seconds,
        section: session.section,
        sectionLabel: session.section === 'quantitative' ? 'القسم الكمي' : 'القسم اللفظي',
        categories: session.categories.map((cat: string) => ({
          id: cat,
          label: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat,
        })),
        difficulty: session.difficulty,
        difficultyLabel: getDifficultyLabel(session.difficulty),
        completedAt: session.completed_at,
      },
    })
  } catch (error) {
    console.error('Results fetch error:', error)
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
 * Generate improvement advice based on score and weaknesses
 */
function generateImprovementAdvice(
  score: number,
  weaknesses: Array<{ category: string; categoryLabel: string; accuracy: number }>
): string {
  if (score >= 90) {
    return 'أداء ممتاز! استمر في المراجعة للحفاظ على هذا المستوى.'
  }

  if (score >= 70) {
    if (weaknesses.length > 0) {
      const weakCats = weaknesses.map((w) => w.categoryLabel).join('، ')
      return `أداء جيد! ركز على تحسين: ${weakCats}`
    }
    return 'أداء جيد! استمر في التدريب لتحسين نتائجك.'
  }

  if (score >= 50) {
    if (weaknesses.length > 0) {
      const weakCats = weaknesses.map((w) => w.categoryLabel).join('، ')
      return `تحتاج إلى مزيد من التدريب خاصة في: ${weakCats}. راجع المفاهيم الأساسية.`
    }
    return 'تحتاج إلى مزيد من التدريب. راجع المفاهيم الأساسية وحاول مرة أخرى.'
  }

  if (weaknesses.length > 0) {
    const weakCats = weaknesses.map((w) => w.categoryLabel).join('، ')
    return `ابدأ بمراجعة الأساسيات في: ${weakCats}. خذ وقتك في فهم المفاهيم قبل التدريب.`
  }

  return 'ابدأ بمراجعة الأساسيات وخذ وقتك في فهم المفاهيم.'
}
