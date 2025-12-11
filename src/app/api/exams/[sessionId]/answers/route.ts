// @ts-nocheck
// TODO: Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { Question } from '@/types/question'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

/**
 * POST /api/exams/[sessionId]/answers - Submit answer for a question
 * Returns immediate feedback (correct/incorrect)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const { questionIndex, selectedAnswer, timeSpentSeconds } = body

    // Validate input
    if (
      typeof questionIndex !== 'number' ||
      questionIndex < 0 ||
      typeof selectedAnswer !== 'number' ||
      selectedAnswer < 0 ||
      selectedAnswer > 3
    ) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
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

    // Get question from session
    const questions = session.questions as unknown as Question[]
    if (questionIndex >= questions.length) {
      return NextResponse.json(
        { error: 'رقم السؤال غير صالح' },
        { status: 400 }
      )
    }

    const question = questions[questionIndex]
    const isCorrect = selectedAnswer === question.answerIndex

    // Check if already answered
    const { data: existingAnswer } = await supabase
      .from('answers')
      .select('id')
      .eq('session_id', sessionId)
      .eq('question_index', questionIndex)
      .eq('session_type', 'exam')
      .single()

    if (existingAnswer) {
      // Update existing answer
      const { error: updateError } = await supabase
        .from('answers')
        .update({
          selected_answer: selectedAnswer,
          is_correct: isCorrect,
          time_spent_seconds: timeSpentSeconds || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAnswer.id)

      if (updateError) {
        console.error('Answer update error:', updateError)
        return NextResponse.json(
          { error: 'فشل في تحديث الإجابة' },
          { status: 500 }
        )
      }
    } else {
      // Create new answer
      const { error: insertError } = await supabase.from('answers').insert({
        user_id: user.id,
        session_id: sessionId,
        session_type: 'exam',
        question_id: question.id,
        question_index: questionIndex,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        time_spent_seconds: timeSpentSeconds || 0,
      })

      if (insertError) {
        console.error('Answer insert error:', insertError)
        return NextResponse.json(
          { error: 'فشل في حفظ الإجابة' },
          { status: 500 }
        )
      }

      // Update questions_answered count
      await supabase
        .from('exam_sessions')
        .update({
          questions_answered: (session.questions_answered || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
    }

    // Return immediate feedback
    return NextResponse.json({
      questionIndex,
      selectedAnswer,
      isCorrect,
      correctAnswer: question.answerIndex,
      // Explanation available immediately after answering
      explanation: question.explanation,
      tip: question.tip,
      solvingStrategy: question.solvingStrategy,
    })
  } catch (error) {
    console.error('Submit answer error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

/**
 * GET /api/exams/[sessionId]/answers - Get all answers for session
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

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'لم يتم العثور على جلسة الاختبار' },
        { status: 404 }
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

    return NextResponse.json({
      answers: answers.map((a) => ({
        questionIndex: a.question_index,
        questionId: a.question_id,
        selectedAnswer: a.selected_answer,
        isCorrect: a.is_correct,
        timeSpentSeconds: a.time_spent_seconds,
        explanationViewed: a.explanation_viewed,
      })),
    })
  } catch (error) {
    console.error('Get answers error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
