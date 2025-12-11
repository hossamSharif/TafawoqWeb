import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { calculateSectionScores, calculateCategoryBreakdown, identifyStrengthsWeaknesses } from '@/lib/utils/scoring'
import type { Question } from '@/types/question'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

/**
 * GET /api/exams/[sessionId] - Get exam session details
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

    // Get session with questions
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

    // Get answered questions
    const { data: answers } = await supabase
      .from('answers')
      .select('*')
      .eq('session_id', sessionId)
      .eq('session_type', 'exam')
      .order('question_index')

    const answeredIndexes = new Set(answers?.map((a) => a.question_index) || [])

    // Format questions - hide answers for unanswered questions
    const questions = (session.questions as unknown as Question[]).map(
      (q, index) => {
        const isAnswered = answeredIndexes.has(index)
        const answer = answers?.find((a) => a.question_index === index)

        return {
          id: q.id,
          index,
          section: q.section,
          topic: q.topic,
          difficulty: q.difficulty,
          questionType: q.questionType,
          stem: q.stem,
          choices: q.choices,
          passage: q.passage,
          // Only show answer info if already answered
          ...(isAnswered && {
            answerIndex: q.answerIndex,
            selectedAnswer: answer?.selected_answer,
            isCorrect: answer?.is_correct,
          }),
        }
      }
    )

    return NextResponse.json({
      session: {
        id: session.id,
        status: session.status,
        totalQuestions: session.total_questions,
        questionsAnswered: session.questions_answered,
        startTime: session.start_time,
        endTime: session.end_time,
        track: session.track,
        timeSpentSeconds: session.time_spent_seconds,
        timePausedSeconds: session.time_paused_seconds,
        verbalScore: session.verbal_score,
        quantitativeScore: session.quantitative_score,
        overallScore: session.overall_score,
      },
      questions,
      answers: answers?.map((a) => ({
        questionIndex: a.question_index,
        selectedAnswer: a.selected_answer,
        isCorrect: a.is_correct,
        timeSpentSeconds: a.time_spent_seconds,
      })),
    })
  } catch (error) {
    console.error('Get exam session error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

/**
 * PATCH /api/exams/[sessionId] - Update exam session (complete/abandon)
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
    const { action, timeSpentSeconds } = body

    if (!['complete', 'abandon'].includes(action)) {
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

    const newStatus = action === 'complete' ? 'completed' : 'abandoned'
    const endTime = new Date().toISOString()

    // Calculate scores if completing
    let scores = {}
    if (action === 'complete') {
      // Get all answers
      const { data: answers } = await supabase
        .from('answers')
        .select('*')
        .eq('session_id', sessionId)
        .eq('session_type', 'exam')

      const questions = session.questions as unknown as Question[]

      if (answers && answers.length > 0) {
        const answerData = answers.map((a) => ({
          questionId: a.question_id,
          questionIndex: a.question_index,
          selectedAnswer: a.selected_answer,
          isCorrect: a.is_correct,
          section: questions[a.question_index]?.section || 'quantitative',
          category: questions[a.question_index]?.topic,
        }))

        const sectionScores = calculateSectionScores(answerData, questions)
        const categoryBreakdown = calculateCategoryBreakdown(answerData, questions)
        const { strengths, weaknesses } = identifyStrengthsWeaknesses(categoryBreakdown)

        scores = {
          verbal_score: sectionScores.verbalScore,
          quantitative_score: sectionScores.quantitativeScore,
          overall_score: sectionScores.overallScore,
          strengths,
          weaknesses,
        }
      }
    }

    // Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from('exam_sessions')
      .update({
        status: newStatus,
        end_time: endTime,
        time_spent_seconds: timeSpentSeconds || session.time_spent_seconds,
        updated_at: new Date().toISOString(),
        ...scores,
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (updateError) {
      console.error('Session update error:', updateError)
      return NextResponse.json(
        { error: 'فشل في تحديث جلسة الاختبار' },
        { status: 500 }
      )
    }

    // If completing, also create exam_results record
    if (action === 'complete' && Object.keys(scores).length > 0) {
      await supabase.from('exam_results').insert({
        user_id: user.id,
        exam_session_id: sessionId,
        verbal_score: (scores as { verbal_score?: number }).verbal_score || 0,
        quantitative_score: (scores as { quantitative_score?: number }).quantitative_score || 0,
        overall_average: (scores as { overall_score?: number }).overall_score || 0,
        strengths: (scores as { strengths?: string[] }).strengths,
        weaknesses: (scores as { weaknesses?: string[] }).weaknesses,
      })

      // Update user analytics
      await supabase
        .from('user_analytics')
        .upsert({
          user_id: user.id,
          last_exam_verbal_score: (scores as { verbal_score?: number }).verbal_score,
          last_exam_quantitative_score: (scores as { quantitative_score?: number }).quantitative_score,
          last_exam_overall_average: (scores as { overall_score?: number }).overall_score,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
    }

    return NextResponse.json({
      session: {
        id: updatedSession.id,
        status: updatedSession.status,
        endTime: updatedSession.end_time,
        verbalScore: updatedSession.verbal_score,
        quantitativeScore: updatedSession.quantitative_score,
        overallScore: updatedSession.overall_score,
      },
    })
  } catch (error) {
    console.error('Update exam session error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
