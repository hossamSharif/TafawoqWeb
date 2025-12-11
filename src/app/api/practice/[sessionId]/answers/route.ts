// @ts-nocheck
// TODO: Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

/**
 * POST /api/practice/[sessionId]/answers - Submit answer for a practice question
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Parse request body
    const body = await request.json()
    const { questionId, questionIndex, selectedAnswer, timeSpentSeconds, questions } = body as {
      questionId: string
      questionIndex: number
      selectedAnswer: number | null
      timeSpentSeconds: number
      questions?: Array<{
        id: string
        answerIndex: number
        explanation: string
        solvingStrategy?: string
        tip?: string
      }>
    }

    // Validate required fields
    if (!questionId || typeof questionIndex !== 'number') {
      return NextResponse.json(
        { error: 'يرجى تحديد جميع الحقول المطلوبة' },
        { status: 400 }
      )
    }

    // Verify session ownership and status
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

    if (session.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'لا يمكن الإجابة على جلسة منتهية' },
        { status: 400 }
      )
    }

    // Find the correct answer from the provided questions array
    // (The frontend sends the questions array with answers for verification)
    const question = questions?.find((q) => q.id === questionId)
    const correctAnswerIndex = question?.answerIndex
    const isCorrect = selectedAnswer !== null && selectedAnswer === correctAnswerIndex

    // Check if answer already exists (update) or new (insert)
    const { data: existingAnswer } = await supabase
      .from('practice_answers')
      .select('id')
      .eq('session_id', sessionId)
      .eq('question_id', questionId)
      .single()

    let answerData
    if (existingAnswer) {
      // Update existing answer
      const { data, error } = await supabase
        .from('practice_answers')
        .update({
          selected_answer: selectedAnswer,
          is_correct: isCorrect,
          time_spent_seconds: timeSpentSeconds,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAnswer.id)
        .select()
        .single()

      if (error) {
        console.error('Answer update error:', error)
        return NextResponse.json(
          { error: 'فشل في تحديث الإجابة' },
          { status: 500 }
        )
      }
      answerData = data
    } else {
      // Insert new answer
      const { data, error } = await supabase
        .from('practice_answers')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          question_id: questionId,
          question_index: questionIndex,
          selected_answer: selectedAnswer,
          is_correct: isCorrect,
          time_spent_seconds: timeSpentSeconds,
        })
        .select()
        .single()

      if (error) {
        // If practice_answers table doesn't exist, use generic answers table
        const { data: genericData, error: genericError } = await supabase
          .from('answers')
          .insert({
            user_id: user.id,
            session_id: sessionId,
            session_type: 'practice',
            question_id: questionId,
            question_index: questionIndex,
            selected_answer: selectedAnswer,
            is_correct: isCorrect,
            time_spent_seconds: timeSpentSeconds,
          })
          .select()
          .single()

        if (genericError) {
          console.error('Answer insert error:', genericError)
          return NextResponse.json(
            { error: 'فشل في حفظ الإجابة' },
            { status: 500 }
          )
        }
        answerData = genericData
      } else {
        answerData = data
      }
    }

    // Return answer with feedback
    return NextResponse.json({
      answer: {
        id: answerData?.id,
        questionId,
        questionIndex,
        selectedAnswer,
        isCorrect,
        timeSpentSeconds,
      },
      feedback: {
        isCorrect,
        correctAnswerIndex,
        explanation: question?.explanation || '',
        solvingStrategy: question?.solvingStrategy,
        tip: question?.tip,
      },
    })
  } catch (error) {
    console.error('Answer submission error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

/**
 * GET /api/practice/[sessionId]/answers - Get all answers for a practice session
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

    // Verify session ownership
    const { data: session, error: sessionError } = await supabase
      .from('practice_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'لم يتم العثور على جلسة التمرين' },
        { status: 404 }
      )
    }

    // Try practice_answers table first, fall back to answers table
    let answers
    const { data: practiceAnswers, error: practiceError } = await supabase
      .from('practice_answers')
      .select('*')
      .eq('session_id', sessionId)
      .order('question_index', { ascending: true })

    if (practiceError || !practiceAnswers) {
      // Fall back to generic answers table
      const { data: genericAnswers, error: genericError } = await supabase
        .from('answers')
        .select('*')
        .eq('session_id', sessionId)
        .eq('session_type', 'practice')
        .order('question_index', { ascending: true })

      if (genericError) {
        console.error('Answers fetch error:', genericError)
        return NextResponse.json(
          { error: 'فشل في جلب الإجابات' },
          { status: 500 }
        )
      }
      answers = genericAnswers
    } else {
      answers = practiceAnswers
    }

    return NextResponse.json({
      answers: answers?.map((a) => ({
        id: a.id,
        questionId: a.question_id,
        questionIndex: a.question_index,
        selectedAnswer: a.selected_answer,
        isCorrect: a.is_correct,
        timeSpentSeconds: a.time_spent_seconds,
      })) || [],
    })
  } catch (error) {
    console.error('Answers fetch error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
