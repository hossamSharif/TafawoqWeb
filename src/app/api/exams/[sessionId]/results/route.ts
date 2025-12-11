import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  calculateSectionScores,
  calculateCategoryBreakdown,
  identifyStrengthsWeaknesses,
  getScoreTier,
  getScoreColor,
  getScoreLabel,
  formatTimeArabic,
} from '@/lib/utils/scoring'
import type { Question } from '@/types/question'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

/**
 * GET /api/exams/[sessionId]/results - Get comprehensive exam results
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

    if (session.status !== 'completed') {
      return NextResponse.json(
        { error: 'لم يتم إكمال الاختبار بعد' },
        { status: 400 }
      )
    }

    // Get all answers
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('*')
      .eq('session_id', sessionId)
      .eq('session_type', 'exam')
      .order('question_index')

    if (answersError) {
      console.error('Answers fetch error:', answersError)
      return NextResponse.json(
        { error: 'فشل في جلب الإجابات' },
        { status: 500 }
      )
    }

    const questions = session.questions as unknown as Question[]

    // Build answer data for scoring
    const answerData = answers.map((a) => ({
      questionId: a.question_id,
      questionIndex: a.question_index,
      selectedAnswer: a.selected_answer,
      isCorrect: a.is_correct,
      section: questions[a.question_index]?.section || 'quantitative',
      category: questions[a.question_index]?.topic,
    }))

    // Calculate scores
    const sectionScores = calculateSectionScores(answerData, questions)
    const categoryBreakdown = calculateCategoryBreakdown(answerData, questions)
    const { strengths, weaknesses } = identifyStrengthsWeaknesses(categoryBreakdown)

    // Format time
    const timeSpent = session.time_spent_seconds || 0
    const timeFormatted = formatTimeArabic(timeSpent)

    // Get score tiers and colors
    const verbalTier = getScoreTier(sectionScores.verbalScore)
    const quantitativeTier = getScoreTier(sectionScores.quantitativeScore)
    const overallTier = getScoreTier(sectionScores.overallScore)

    // Build detailed question results
    const questionResults = questions.map((q, index) => {
      const answer = answers.find((a) => a.question_index === index)
      return {
        index,
        questionId: q.id,
        section: q.section,
        topic: q.topic,
        difficulty: q.difficulty,
        stem: q.stem.substring(0, 100) + (q.stem.length > 100 ? '...' : ''),
        isAnswered: !!answer,
        selectedAnswer: answer?.selected_answer ?? null,
        correctAnswer: q.answerIndex,
        isCorrect: answer?.is_correct ?? false,
        timeSpentSeconds: answer?.time_spent_seconds ?? 0,
      }
    })

    // Count by difficulty
    const difficultyBreakdown = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 },
    }

    for (const qr of questionResults) {
      const difficulty = qr.difficulty as keyof typeof difficultyBreakdown
      if (difficultyBreakdown[difficulty]) {
        difficultyBreakdown[difficulty].total++
        if (qr.isCorrect) {
          difficultyBreakdown[difficulty].correct++
        }
      }
    }

    return NextResponse.json({
      session: {
        id: session.id,
        track: session.track,
        startTime: session.start_time,
        endTime: session.end_time,
        totalQuestions: session.total_questions,
        questionsAnswered: answers.length,
        timeSpentSeconds: timeSpent,
        timeFormatted,
      },
      scores: {
        verbal: {
          score: sectionScores.verbalScore,
          correct: sectionScores.verbalCorrect,
          total: sectionScores.verbalTotal,
          tier: verbalTier,
          color: getScoreColor(sectionScores.verbalScore),
          label: getScoreLabel(sectionScores.verbalScore),
        },
        quantitative: {
          score: sectionScores.quantitativeScore,
          correct: sectionScores.quantitativeCorrect,
          total: sectionScores.quantitativeTotal,
          tier: quantitativeTier,
          color: getScoreColor(sectionScores.quantitativeScore),
          label: getScoreLabel(sectionScores.quantitativeScore),
        },
        overall: {
          score: sectionScores.overallScore,
          correct: sectionScores.verbalCorrect + sectionScores.quantitativeCorrect,
          total: sectionScores.verbalTotal + sectionScores.quantitativeTotal,
          tier: overallTier,
          color: getScoreColor(sectionScores.overallScore),
          label: getScoreLabel(sectionScores.overallScore),
        },
      },
      analysis: {
        strengths,
        weaknesses,
        categoryBreakdown: categoryBreakdown.map((cat) => ({
          category: cat.category,
          correct: cat.correct,
          total: cat.total,
          percentage: cat.percentage,
          tier: getScoreTier(cat.percentage),
          color: getScoreColor(cat.percentage),
        })),
        difficultyBreakdown: Object.entries(difficultyBreakdown).map(
          ([difficulty, stats]) => ({
            difficulty,
            correct: stats.correct,
            total: stats.total,
            percentage:
              stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
          })
        ),
      },
      questions: questionResults,
    })
  } catch (error) {
    console.error('Get results error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
