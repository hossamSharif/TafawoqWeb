// @ts-nocheck
// TODO: Regenerate Supabase types from database schema to fix type errors
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
    const { data: sessionData, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    const session = sessionData as unknown as ExamSessionRow | null

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'لم يتم العثور على جلسة الاختبار' },
        { status: 404 }
      )
    }

    // Get answered questions
    const { data: answersData } = await supabase
      .from('answers')
      .select('*')
      .eq('session_id', sessionId)
      .eq('session_type', 'exam')
      .order('question_index')

    const answers = (answersData || []) as unknown as AnswerRow[]
    const answeredIndexes = new Set(answers.map((a) => a.question_index))

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
      const typedScores = scores as {
        verbal_score?: number
        quantitative_score?: number
        overall_score?: number
        strengths?: string[]
        weaknesses?: string[]
      }

      await supabase
        .from('user_analytics')
        .upsert({
          user_id: user.id,
          last_exam_verbal_score: typedScores.verbal_score,
          last_exam_quantitative_score: typedScores.quantitative_score,
          last_exam_overall_average: typedScores.overall_score,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      // Update performance_records with exam history
      const { data: perfRecord } = await supabase
        .from('performance_records')
        .select('exam_history, weekly_exam_count, week_start_date')
        .eq('user_id', user.id)
        .single()

      // Build new exam history entry
      const newExamEntry = {
        date: endTime,
        verbal: typedScores.verbal_score || 0,
        quantitative: typedScores.quantitative_score || 0,
        overall: typedScores.overall_score || 0,
      }

      // Get existing history or create empty array
      const existingHistory = (perfRecord?.exam_history || []) as Array<{
        date: string
        verbal: number
        quantitative: number
        overall: number
      }>

      // Add new entry and keep last 10
      const updatedHistory = [...existingHistory, newExamEntry].slice(-10)

      // Check if we need to reset weekly count (if more than 7 days)
      const weekStartDate = perfRecord?.week_start_date
      const now = new Date()
      const weekStart = weekStartDate ? new Date(weekStartDate) : null
      const daysDiff = weekStart ? Math.floor((now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)) : 8

      const newWeeklyCount = daysDiff >= 7 ? 1 : (perfRecord?.weekly_exam_count || 0) + 1
      const newWeekStartDate = daysDiff >= 7 ? now.toISOString().split('T')[0] : weekStartDate

      await supabase
        .from('performance_records')
        .upsert({
          user_id: user.id,
          exam_history: updatedHistory,
          weekly_exam_count: newWeeklyCount,
          week_start_date: newWeekStartDate,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      // Update user_profiles with last exam scores
      await supabase
        .from('user_profiles')
        .update({
          last_exam_scores: {
            verbal: typedScores.verbal_score || 0,
            quantitative: typedScores.quantitative_score || 0,
            overall: typedScores.overall_score || 0,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
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
