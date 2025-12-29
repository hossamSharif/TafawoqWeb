import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { Question } from '@/types/question'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

interface ExamSessionRow {
  id: string
  user_id: string
  track: 'scientific' | 'literary'
  status: string
  questions: Question[]
  total_questions: number
  questions_answered: number
  start_time: string
  paused_at: string | null
  remaining_time_seconds: number | null
  time_spent_seconds: number | null
  time_paused_seconds: number | null
  generated_batches: number | null
  generation_context: { generatedIds: string[]; lastBatchIndex: number } | null
}

interface AnswerRow {
  question_id: string
  question_index: number
  selected_answer: number
  is_correct: boolean
  time_spent_seconds?: number
}

/**
 * POST /api/exams/[sessionId]/resume - Resume a paused exam
 *
 * Resumes the exam session from where it was paused.
 * Timer continues from the saved remaining time.
 * Tracks total pause duration.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params
    const supabase = await createServerClient()

    // Generate request ID for debugging race conditions
    const requestId = crypto.randomUUID().slice(0, 8)

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Get session with all details
    const { data: sessionData, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    const session = sessionData as unknown as ExamSessionRow | null

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'لم يتم العثور على جلسة الاختبار' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (session.user_id !== user.id) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول لهذه الجلسة' },
        { status: 403 }
      )
    }

    console.log(`[Resume ${requestId}] Session ${sessionId} - Current status: ${session.status}, paused_at: ${session.paused_at}`)

    // IDEMPOTENT CHECK: Handle already-resumed sessions gracefully
    if (session.status === 'in_progress' && session.paused_at === null) {
      // Session was already resumed (likely by concurrent request or race condition)
      // Return success with current state instead of error
      console.log(`[Resume ${requestId}] Session already in progress (paused_at is null), treating as successful resume`)

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
      const questions = (session.questions || []).map((q, index) => {
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
          diagram: q.diagram,
          // Only show answer info if already answered
          ...(isAnswered && {
            answerIndex: q.answerIndex,
            selectedAnswer: answer?.selected_answer,
            isCorrect: answer?.is_correct,
          }),
        }
      })

      // Check if more questions need to be generated
      const currentBatches = session.generated_batches || Math.ceil(questions.length / 10)
      const totalBatchesNeeded = Math.ceil(session.total_questions / 10)
      const needsMoreQuestions = currentBatches < totalBatchesNeeded

      return NextResponse.json({
        success: true,
        session: {
          id: session.id,
          status: session.status,
          totalQuestions: session.total_questions,
          questionsAnswered: session.questions_answered,
          startTime: session.start_time,
          track: session.track,
          remainingTimeSeconds: session.remaining_time_seconds,
          timeSpentSeconds: session.time_spent_seconds,
          timePausedSeconds: session.time_paused_seconds,
          generatedBatches: session.generated_batches || currentBatches,
          generationContext: session.generation_context || { generatedIds: [], lastBatchIndex: -1 },
          needsMoreQuestions,
        },
        questions,
        answers: answers?.map((a) => ({
          questionIndex: a.question_index,
          selectedAnswer: a.selected_answer,
          isCorrect: a.is_correct,
          timeSpentSeconds: a.time_spent_seconds,
        })),
        message: 'الاختبار قيد التقدم بالفعل.',
        alreadyResumed: true, // Flag to indicate this was an idempotent operation
      })
    }

    // Check if session is paused
    if (session.status !== 'paused') {
      console.log(`[Resume ${requestId}] Session status is ${session.status}, not paused`)
      return NextResponse.json(
        { error: 'هذه الجلسة ليست متوقفة' },
        { status: 400 }
      )
    }

    // Calculate pause duration
    const pausedAt = session.paused_at ? new Date(session.paused_at) : new Date()
    const now = new Date()
    const pauseDurationSeconds = Math.floor((now.getTime() - pausedAt.getTime()) / 1000)

    // Accumulate total pause time
    const newTimePausedSeconds = (session.time_paused_seconds || 0) + pauseDurationSeconds

    // Resume the session
    const { data: updatedData, error: updateError } = await (supabase
      .from('exam_sessions') as any)
      .update({
        status: 'in_progress',
        paused_at: null,
        time_paused_seconds: newTimePausedSeconds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single()

    const updatedSession = updatedData as ExamSessionRow | null

    if (updateError || !updatedSession) {
      console.error('Resume exam error:', updateError)
      return NextResponse.json(
        { error: 'فشل في استئناف الاختبار' },
        { status: 500 }
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
    const questions = (session.questions || []).map((q, index) => {
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
        diagram: q.diagram,
        // Only show answer info if already answered
        ...(isAnswered && {
          answerIndex: q.answerIndex,
          selectedAnswer: answer?.selected_answer,
          isCorrect: answer?.is_correct,
        }),
      }
    })

    // Check if more questions need to be generated
    const currentBatches = session.generated_batches || Math.ceil(questions.length / 10)
    const totalBatchesNeeded = Math.ceil(session.total_questions / 10)
    const needsMoreQuestions = currentBatches < totalBatchesNeeded

    return NextResponse.json({
      success: true,
      session: {
        id: updatedSession.id,
        status: updatedSession.status,
        totalQuestions: updatedSession.total_questions,
        questionsAnswered: updatedSession.questions_answered,
        startTime: session.start_time,
        track: session.track,
        remainingTimeSeconds: session.remaining_time_seconds,
        timeSpentSeconds: updatedSession.time_spent_seconds,
        timePausedSeconds: updatedSession.time_paused_seconds,
        generatedBatches: updatedSession.generated_batches || currentBatches,
        generationContext: session.generation_context || { generatedIds: [], lastBatchIndex: -1 },
        needsMoreQuestions,
      },
      questions,
      answers: answers?.map((a) => ({
        questionIndex: a.question_index,
        selectedAnswer: a.selected_answer,
        isCorrect: a.is_correct,
        timeSpentSeconds: a.time_spent_seconds,
      })),
      message: 'تم استئناف الاختبار بنجاح.',
      invalidateLimitsCache: true, // Signal frontend to invalidate subscription limits cache
    })
  } catch (error) {
    console.error('Resume exam error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
