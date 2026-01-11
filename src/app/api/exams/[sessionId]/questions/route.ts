// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { QuduratGenerator } from '@/services/generation/QuduratGenerator'
import type { QuestionGenerationParams } from '@/services/generation/PromptBuilder'
import type { Question } from '@/types/question'

type AcademicTrack = 'scientific' | 'literary'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

/**
 * Determine which section to generate for a given batch index based on track distribution
 * Scientific: 6 quant batches (0-5) + 4 verbal batches (6-9)
 * Literary: 3 quant batches (0-2) + 7 verbal batches (3-9)
 */
function getSectionForBatch(
  batchIndex: number,
  track: AcademicTrack
): 'quantitative' | 'verbal' {
  if (track === 'scientific') {
    return batchIndex < 6 ? 'quantitative' : 'verbal'
  } else {
    return batchIndex < 3 ? 'quantitative' : 'verbal'
  }
}

/**
 * Get batch size - most batches are 10, but final batches may be smaller
 * Scientific: 57 quant (batches 0-5: 10,10,10,10,10,7) + 39 verbal (batches 6-9: 10,10,10,9)
 * Literary: 29 quant (batches 0-2: 10,10,9) + 67 verbal (batches 3-9: 10,10,10,10,10,10,7)
 */
function getBatchSize(batchIndex: number, track: AcademicTrack): number {
  if (track === 'scientific') {
    if (batchIndex === 5) return 7 // Last quant batch
    if (batchIndex === 9) return 9 // Last verbal batch
  } else {
    if (batchIndex === 2) return 9 // Last quant batch
    if (batchIndex === 9) return 7 // Last verbal batch
  }
  return 10
}

/**
 * POST /api/exams/[sessionId]/questions - Generate next batch of questions
 *
 * Validates batch index matches expected next batch,
 * blocks concurrent requests (returns 409),
 * and returns questions with answers redacted.
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

    // Validate batchIndex is a number
    if (typeof batchIndex !== 'number' || batchIndex < 0 || batchIndex > 9) {
      return NextResponse.json(
        { error: 'رقم الدفعة غير صالح' },
        { status: 400 }
      )
    }

    // Get session and verify ownership
    const { data: sessionData, error: sessionError } = await supabase
      .from('exam_sessions')
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

    const session = sessionData as {
      id: string
      user_id: string
      track: AcademicTrack
      status: string
      questions: Question[]
      generated_batches: number
      generation_context: GenerationContext
      generation_in_progress: boolean
      total_questions: number
    }

    // Validate session is in progress
    if (session.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'الاختبار ليس قيد التقدم' },
        { status: 400 }
      )
    }

    // T023: Validate batch index is sequential
    if (batchIndex !== session.generated_batches) {
      return NextResponse.json(
        {
          error: `رقم الدفعة غير متسلسل. الدفعة المتوقعة: ${session.generated_batches}`,
          expectedBatchIndex: session.generated_batches,
          requestedBatchIndex: batchIndex,
        },
        { status: 400 }
      )
    }

    // T024: Check generation lock - prevent concurrent generation
    if (session.generation_in_progress) {
      return NextResponse.json(
        { error: 'جاري توليد الأسئلة بالفعل' },
        { status: 409 }
      )
    }

    // T024: Acquire generation lock
    const { error: lockError } = await supabase
      .from('exam_sessions')
      .update({ generation_in_progress: true })
      .eq('id', sessionId)
      .eq('generation_in_progress', false) // Optimistic lock

    if (lockError) {
      console.error('Failed to acquire lock:', lockError)
      return NextResponse.json(
        { error: 'جاري توليد الأسئلة بالفعل' },
        { status: 409 }
      )
    }

    // Determine section and batch size
    const track = session.track as AcademicTrack
    const section = getSectionForBatch(batchIndex, track)
    const batchSize = getBatchSize(batchIndex, track)

    // T025: Generate questions using QuduratGenerator (with section-specific skills)
    let newQuestions
    try {
      const generator = new QuduratGenerator({
        enableCaching: true,
        maxRetries: 3,
      })

      // Build generation params for each question in the batch
      const paramsArray: QuestionGenerationParams[] = []
      for (let i = 0; i < batchSize; i++) {
        paramsArray.push({
          section,
          track,
          topic: null, // Let generator choose from topic distribution
          subtopic: null,
          difficulty: null, // Let generator choose from difficulty distribution
        })
      }

      const result = await generator.generateBatch(paramsArray)

      if (!result.success || result.questions.length === 0) {
        throw new Error('Failed to generate questions')
      }

      newQuestions = result.questions
    } catch (genError) {
      console.error('Batch generation error:', genError)

      // T026: Release lock on failure
      await supabase
        .from('exam_sessions')
        .update({ generation_in_progress: false })
        .eq('id', sessionId)

      // T041: Handle generation unavailable
      const errorMessage = genError instanceof Error
        ? genError.message
        : 'خدمة التوليد غير متاحة حالياً'

      return NextResponse.json(
        { error: errorMessage },
        { status: 503 }
      )
    }

    // Append new questions to existing ones
    const existingQuestions = (session.questions || []) as Question[]
    const allQuestions = [...existingQuestions, ...newQuestions]

    // Build updated context with all generated IDs
    const updatedContext = {
      generatedIds: allQuestions.map((q) => q.id),
      lastBatchIndex: batchIndex,
    }

    // T026: Update session with new questions and release lock
    const { error: updateError } = await supabase
      .from('exam_sessions')
      .update({
        questions: allQuestions as unknown as Record<string, unknown>[],
        generated_batches: batchIndex + 1,
        generation_context: updatedContext,
        generation_in_progress: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Session update error:', updateError)
      // Release lock on failure
      await supabase
        .from('exam_sessions')
        .update({ generation_in_progress: false })
        .eq('id', sessionId)

      return NextResponse.json(
        { error: 'فشل في حفظ الأسئلة' },
        { status: 500 }
      )
    }

    // Log generation metrics
    console.log(`[Exam ${sessionId}] Batch ${batchIndex} generated using QuduratGenerator:`, {
      questionCount: newQuestions.length,
      section,
      batchSize,
      totalQuestions: allQuestions.length,
    })

    // Return questions without answers for security
    // Map v3.0 QuestionData format to frontend format
    const questionsWithoutAnswers = newQuestions.map((q, index) => ({
      id: q.id,
      index: existingQuestions.length + index,
      section: q.section,
      track: q.track,
      topic: q.topic,
      subtopic: q.subtopic,
      difficulty: q.difficulty,
      questionType: q.question_type,
      stem: q.question_text, // Map question_text to stem for frontend compatibility
      choices: q.choices,
      passage: null, // v3.0 doesn't have passage field
      diagram: q.diagram_config, // Map diagram_config to diagram for frontend
      // correct_answer and explanation hidden until answered
    }))

    return NextResponse.json({
      questions: questionsWithoutAnswers,
      meta: {
        batchIndex,
        totalLoaded: allQuestions.length,
        cacheHit: false, // QuduratGenerator doesn't expose this in same way
      },
    })
  } catch (error) {
    console.error('Batch generation route error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
