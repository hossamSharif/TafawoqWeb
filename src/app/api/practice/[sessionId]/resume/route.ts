import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { Question } from '@/types/question'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

interface PracticeSessionRow {
  id: string
  user_id: string
  status: string
  section: string
  categories: string[]
  difficulty: string
  question_count: number
  questions: Question[]
  paused_at: string | null
  time_spent_seconds: number | null
  started_at: string | null
  created_at: string | null
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
 * POST /api/practice/[sessionId]/resume - Resume a paused practice session
 *
 * Resumes the practice session from where it was paused.
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
      .from('practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    const session = sessionData as unknown as PracticeSessionRow | null

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'لم يتم العثور على جلسة التمرين' },
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

    console.log(`[Resume ${requestId}] Practice session ${sessionId} - Current status: ${session.status}, paused_at: ${session.paused_at}`)

    // IDEMPOTENT CHECK: Handle already-resumed sessions gracefully
    if (session.status === 'in_progress' && session.paused_at === null) {
      // Session was already resumed (likely by concurrent request or race condition)
      // Return success with current state instead of error
      console.log(`[Resume ${requestId}] Practice session already in progress (paused_at is null), treating as successful resume`)

      // Get answered questions
      const { data: answersData } = await supabase
        .from('answers')
        .select('*')
        .eq('session_id', sessionId)
        .eq('session_type', 'practice')
        .order('question_index')

      const answers = (answersData || []) as unknown as AnswerRow[]
      const answeredIndexes = new Set(answers.map((a) => a.question_index))

      // Format questions - hide answers for unanswered questions
      // Map v3.0 format to frontend format
      const questions = (session.questions || []).map((q: any, index: number) => {
        const isAnswered = answeredIndexes.has(index)
        const answer = answers?.find((a) => a.question_index === index)

        // Calculate answerIndex from correct_answer string
        let answerIndex = q.answerIndex
        if (answerIndex === undefined && q.correct_answer && q.choices) {
          answerIndex = q.choices.findIndex((c: string) => c === q.correct_answer)
          if (answerIndex === -1) answerIndex = 0
        }

        return {
          id: q.id,
          index,
          section: q.section,
          topic: q.topic,
          difficulty: q.difficulty,
          questionType: q.question_type || q.questionType,
          stem: q.question_text || q.stem,
          choices: q.choices,
          passage: q.passage,
          diagram: q.diagram,
          // Only show answer info if already answered
          ...(isAnswered && {
            answerIndex,
            selectedAnswer: answer?.selected_answer,
            isCorrect: answer?.is_correct,
          }),
        }
      })

      // Check if more questions need to be generated (batch size is 5 for practice)
      const PRACTICE_BATCH_SIZE = 5
      const currentBatches = session.generated_batches || Math.ceil(questions.length / PRACTICE_BATCH_SIZE)
      const totalBatchesNeeded = Math.ceil(session.question_count / PRACTICE_BATCH_SIZE)
      const needsMoreQuestions = currentBatches < totalBatchesNeeded

      // Include full questions with answers for client-side verification
      // Map v3.0 format to frontend format
      const _questionsWithAnswers = (session.questions || []).map((q: any, index: number) => {
        let answerIndex = q.answerIndex
        if (answerIndex === undefined && q.correct_answer && q.choices) {
          answerIndex = q.choices.findIndex((c: string) => c === q.correct_answer)
          if (answerIndex === -1) answerIndex = 0
        }

        return {
          id: q.id,
          index,
          section: q.section,
          topic: q.topic,
          difficulty: q.difficulty,
          questionType: q.question_type || q.questionType,
          stem: q.question_text || q.stem,
          choices: q.choices,
          passage: q.passage,
          diagram: q.diagram,
          answerIndex,
          explanation: q.explanation,
          solvingStrategy: q.solving_strategy || q.solvingStrategy,
          tip: q.solving_tip || q.tip,
        }
      })

      return NextResponse.json({
        success: true,
        session: {
          id: session.id,
          status: session.status,
          section: session.section,
          categories: session.categories,
          difficulty: session.difficulty,
          questionCount: session.question_count,
          questionsAnswered: answers.length,
          startedAt: session.started_at,
          timeSpentSeconds: session.time_spent_seconds,
          generatedBatches: session.generated_batches || currentBatches,
          generationContext: session.generation_context || { generatedIds: [], lastBatchIndex: -1 },
          needsMoreQuestions,
        },
        questions,
        _questionsWithAnswers, // Include full questions with answers for verification
        answers: answers?.map((a) => ({
          questionIndex: a.question_index,
          selectedAnswer: a.selected_answer,
          isCorrect: a.is_correct,
          timeSpentSeconds: a.time_spent_seconds,
        })),
        message: 'التمرين قيد التقدم بالفعل.',
        alreadyResumed: true, // Flag to indicate this was an idempotent operation
      })
    }

    // Check if session is paused
    if (session.status !== 'paused') {
      console.log(`[Resume ${requestId}] Practice session status is ${session.status}, not paused`)
      return NextResponse.json(
        { error: 'هذه الجلسة ليست متوقفة' },
        { status: 400 }
      )
    }

    // Resume the session
    const { data: updatedData, error: updateError } = await (supabase
      .from('practice_sessions') as any)
      .update({
        status: 'in_progress',
        paused_at: null,
      })
      .eq('id', sessionId)
      .select()
      .single()

    const updatedSession = updatedData as PracticeSessionRow | null

    if (updateError || !updatedSession) {
      console.error('Resume practice error:', updateError)
      return NextResponse.json(
        { error: 'فشل في استئناف التمرين' },
        { status: 500 }
      )
    }

    // Get answered questions
    const { data: answersData } = await supabase
      .from('answers')
      .select('*')
      .eq('session_id', sessionId)
      .eq('session_type', 'practice')
      .order('question_index')

    const answers = (answersData || []) as unknown as AnswerRow[]
    const answeredIndexes = new Set(answers.map((a) => a.question_index))

    // Format questions - hide answers for unanswered questions
    // Map v3.0 format to frontend format
    const questions = (session.questions || []).map((q: any, index: number) => {
      const isAnswered = answeredIndexes.has(index)
      const answer = answers?.find((a) => a.question_index === index)

      // Calculate answerIndex from correct_answer string
      let answerIndex = q.answerIndex
      if (answerIndex === undefined && q.correct_answer && q.choices) {
        answerIndex = q.choices.findIndex((c: string) => c === q.correct_answer)
        if (answerIndex === -1) answerIndex = 0
      }

      return {
        id: q.id,
        index,
        section: q.section,
        topic: q.topic,
        difficulty: q.difficulty,
        questionType: q.question_type || q.questionType,
        stem: q.question_text || q.stem,
        choices: q.choices,
        passage: q.passage,
        diagram: q.diagram,
        // Only show answer info if already answered
        ...(isAnswered && {
          answerIndex,
          selectedAnswer: answer?.selected_answer,
          isCorrect: answer?.is_correct,
        }),
      }
    })

    // Check if more questions need to be generated (batch size is 5 for practice)
    const PRACTICE_BATCH_SIZE = 5
    const currentBatches = session.generated_batches || Math.ceil(questions.length / PRACTICE_BATCH_SIZE)
    const totalBatchesNeeded = Math.ceil(session.question_count / PRACTICE_BATCH_SIZE)
    const needsMoreQuestions = currentBatches < totalBatchesNeeded

    // Include full questions with answers for client-side verification
    // Map v3.0 format to frontend format
    const _questionsWithAnswers = (session.questions || []).map((q: any, index: number) => {
      let answerIndex = q.answerIndex
      if (answerIndex === undefined && q.correct_answer && q.choices) {
        answerIndex = q.choices.findIndex((c: string) => c === q.correct_answer)
        if (answerIndex === -1) answerIndex = 0
      }

      return {
        id: q.id,
        index,
        section: q.section,
        topic: q.topic,
        difficulty: q.difficulty,
        questionType: q.question_type || q.questionType,
        stem: q.question_text || q.stem,
        choices: q.choices,
        passage: q.passage,
        diagram: q.diagram,
        answerIndex,
        explanation: q.explanation,
        solvingStrategy: q.solving_strategy || q.solvingStrategy,
        tip: q.solving_tip || q.tip,
      }
    })

    return NextResponse.json({
      success: true,
      session: {
        id: updatedSession.id,
        status: updatedSession.status,
        section: updatedSession.section,
        categories: updatedSession.categories,
        difficulty: updatedSession.difficulty,
        questionCount: updatedSession.question_count,
        questionsAnswered: answers.length,
        startedAt: session.started_at,
        timeSpentSeconds: updatedSession.time_spent_seconds,
        generatedBatches: updatedSession.generated_batches || currentBatches,
        generationContext: session.generation_context || { generatedIds: [], lastBatchIndex: -1 },
        needsMoreQuestions,
      },
      questions,
      _questionsWithAnswers, // Include full questions with answers for verification
      answers: answers?.map((a) => ({
        questionIndex: a.question_index,
        selectedAnswer: a.selected_answer,
        isCorrect: a.is_correct,
        timeSpentSeconds: a.time_spent_seconds,
      })),
      message: 'تم استئناف التمرين بنجاح.',
      invalidateLimitsCache: true, // Signal frontend to invalidate subscription limits cache
    })
  } catch (error) {
    console.error('Resume practice error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
