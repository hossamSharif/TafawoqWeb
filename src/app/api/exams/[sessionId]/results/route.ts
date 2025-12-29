// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
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
  type AcademicTrack,
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

    // Calculate scores using expected totals for the track
    const sectionScores = calculateSectionScores(
      answerData,
      questions,
      session.total_questions,
      session.track as AcademicTrack
    )
    const categoryBreakdown = calculateCategoryBreakdown(answerData, questions)
    const { strengths, weaknesses } = identifyStrengthsWeaknesses(categoryBreakdown)

    // Format time
    const timeSpent = session.time_spent_seconds || 0
    const timeFormatted = formatTimeArabic(timeSpent)

    // Get score tiers and colors
    const verbalTier = getScoreTier(sectionScores.verbalScore)
    const quantitativeTier = getScoreTier(sectionScores.quantitativeScore)
    const overallTier = getScoreTier(sectionScores.overallScore)

    // Build detailed question results with FULL question data for review
    const questionResults = questions.map((q, index) => {
      const answer = answers.find((a) => a.question_index === index)
      return {
        index,
        questionId: q.id,
        section: q.section,
        topic: q.topic,
        difficulty: q.difficulty,
        questionType: q.questionType || 'text-only',
        stem: q.stem, // FULL STEM - no truncation for question review
        passage: q.passage || undefined,
        diagram: q.diagram || undefined,
        choices: q.choices || ['', '', '', ''],
        isAnswered: !!answer,
        selectedAnswer: answer?.selected_answer ?? null,
        correctAnswer: q.answerIndex,
        isCorrect: answer?.is_correct ?? false,
        timeSpentSeconds: answer?.time_spent_seconds ?? 0,
        explanation: q.explanation || '',
        solvingStrategy: q.solvingStrategy || undefined,
        tip: q.tip || undefined,
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

    // Get user profile to check subscription tier
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single()

    const isPremium = profile?.subscription_tier === 'premium'

    // Premium features: historical comparison and peer percentile
    let premiumAnalytics = null
    if (isPremium) {
      // Get user's previous exam for comparison
      const { data: previousExams } = await supabase
        .from('exam_sessions')
        .select('overall_score, verbal_score, quantitative_score, created_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .neq('id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)

      // Calculate peer percentile (simplified - based on all completed exams)
      const { data: allExams } = await supabase
        .from('exam_sessions')
        .select('overall_score')
        .eq('status', 'completed')
        .not('overall_score', 'is', null)

      let peerPercentile = null
      if (allExams && allExams.length > 0) {
        const scores = allExams.map(e => e.overall_score as number).filter(s => s !== null)
        const belowCount = scores.filter(s => s < sectionScores.overallScore).length
        peerPercentile = Math.round((belowCount / scores.length) * 100)
      }

      // Get exam history for trend chart
      const { data: examHistory } = await supabase
        .from('exam_sessions')
        .select('overall_score, verbal_score, quantitative_score, created_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: true })
        .limit(10)

      premiumAnalytics = {
        previousExam: previousExams?.[0] ? {
          overallScore: previousExams[0].overall_score,
          verbalScore: previousExams[0].verbal_score,
          quantitativeScore: previousExams[0].quantitative_score,
          date: previousExams[0].created_at,
          improvement: {
            overall: sectionScores.overallScore - (previousExams[0].overall_score || 0),
            verbal: sectionScores.verbalScore - (previousExams[0].verbal_score || 0),
            quantitative: sectionScores.quantitativeScore - (previousExams[0].quantitative_score || 0),
          },
        } : null,
        peerPercentile,
        examHistory: examHistory?.map(e => ({
          date: e.created_at,
          overall: e.overall_score || 0,
          verbal: e.verbal_score || 0,
          quantitative: e.quantitative_score || 0,
        })) || [],
        totalExamsTaken: examHistory?.length || 0,
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
      isPremium,
      premiumAnalytics,
    })
  } catch (error) {
    console.error('Get results error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
