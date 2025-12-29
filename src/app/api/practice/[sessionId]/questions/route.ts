// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateQuestionBatch } from '@/lib/anthropic'
import type { GenerationContext } from '@/lib/anthropic/types'
import type { Question, QuestionCategory, QuestionSection, QuestionDifficulty } from '@/types/question'

/**
 * Practice batch size (smaller than exam)
 */
const PRACTICE_BATCH_SIZE = 5

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

interface PracticeSessionRow {
  id: string
  user_id: string
  section: QuestionSection
  categories: QuestionCategory[]
  difficulty: QuestionDifficulty
  status: 'in_progress' | 'completed' | 'abandoned'
  questions: Question[]
  question_count: number
  generated_batches?: number
  generation_context?: GenerationContext
  generation_in_progress?: boolean
}

/**
 * POST /api/practice/[sessionId]/questions - Generate next batch of practice questions
 *
 * T044-T046: Practice batch generation with same lock pattern as exams
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params
    const supabase = await createServerClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { batchIndex } = body as { batchIndex: number }

    // Validate batchIndex
    if (typeof batchIndex !== 'number' || batchIndex < 0) {
      return NextResponse.json(
        { error: 'رقم الدفعة غير صالح' },
        { status: 400 }
      )
    }

    // Get session and verify ownership
    const { data: sessionData, error: sessionError } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !sessionData) {
      return NextResponse.json(
        { error: 'الجلسة غير موجودة' },
        { status: 404 }
      )
    }

    const session = sessionData as unknown as PracticeSessionRow

    // Validate session is in progress
    if (session.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'جلسة التمرين ليست قيد التقدم' },
        { status: 400 }
      )
    }

    // Validate batch index is sequential
    const currentBatches = session.generated_batches || 0
    if (batchIndex !== currentBatches) {
      return NextResponse.json(
        {
          error: `رقم الدفعة غير متسلسل. الدفعة المتوقعة: ${currentBatches}`,
          expectedBatchIndex: currentBatches,
          requestedBatchIndex: batchIndex,
        },
        { status: 400 }
      )
    }

    // T046: Check generation lock
    if (session.generation_in_progress) {
      return NextResponse.json(
        { error: 'جاري توليد الأسئلة بالفعل' },
        { status: 409 }
      )
    }

    // Acquire generation lock
    const { error: lockError } = await supabase
      .from('practice_sessions')
      .update({ generation_in_progress: true })
      .eq('id', sessionId)
      .eq('generation_in_progress', false)

    if (lockError) {
      console.error('Failed to acquire practice lock:', lockError)
      return NextResponse.json(
        { error: 'جاري توليد الأسئلة بالفعل' },
        { status: 409 }
      )
    }

    // Get generation context
    const context: GenerationContext = session.generation_context || {
      generatedIds: [],
      lastBatchIndex: -1,
    }

    // Generate questions using the practice session's settings
    let batchResponse
    try {
      batchResponse = await generateQuestionBatch(
        {
          sessionId,
          batchIndex,
          batchSize: PRACTICE_BATCH_SIZE, // T045: Use smaller batch size for practice
          section: session.section,
          track: 'scientific', // Practice mode doesn't use track, default to scientific
          categories: session.categories,
        },
        context
      )
    } catch (genError) {
      console.error('Practice batch generation error:', genError)

      // Release lock on failure
      await supabase
        .from('practice_sessions')
        .update({ generation_in_progress: false })
        .eq('id', sessionId)

      const errorMessage = genError instanceof Error
        ? genError.message
        : 'خدمة التوليد غير متاحة حالياً'

      return NextResponse.json(
        { error: errorMessage },
        { status: 503 }
      )
    }

    const { questions: newQuestions, updatedContext, usage, meta } = batchResponse

    // Append new questions to existing ones
    const existingQuestions = (session.questions || []) as Question[]
    const allQuestions = [...existingQuestions, ...newQuestions]

    // Update session with new questions and release lock
    const { error: updateError } = await supabase
      .from('practice_sessions')
      .update({
        questions: allQuestions as unknown as Record<string, unknown>[],
        generated_batches: batchIndex + 1,
        generation_context: updatedContext,
        generation_in_progress: false,
        question_count: allQuestions.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Practice session update error:', updateError)
      // Release lock on failure
      await supabase
        .from('practice_sessions')
        .update({ generation_in_progress: false })
        .eq('id', sessionId)

      return NextResponse.json(
        { error: 'فشل في حفظ الأسئلة' },
        { status: 500 }
      )
    }

    // Log generation metrics
    console.log(`[Practice ${sessionId}] Batch ${batchIndex} generated:`, {
      questionCount: newQuestions.length,
      provider: meta.provider,
      cacheHit: meta.cacheHit,
      durationMs: meta.durationMs,
    })

    // Return questions without answers
    const questionsWithoutAnswers = newQuestions.map((q, index) => ({
      id: q.id,
      index: existingQuestions.length + index,
      section: q.section,
      topic: q.topic,
      difficulty: q.difficulty,
      questionType: q.questionType,
      stem: q.stem,
      choices: q.choices,
      passage: q.passage,
      diagram: q.diagram, // Include diagram data for rendering geometric shapes and charts
    }))

    return NextResponse.json({
      questions: questionsWithoutAnswers,
      meta: {
        batchIndex,
        totalLoaded: allQuestions.length,
        cacheHit: meta.cacheHit,
      },
    })
  } catch (error) {
    console.error('Practice batch generation route error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
