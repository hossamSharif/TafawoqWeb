// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { QuduratGenerator } from '@/services/generation/QuduratGenerator'
import type { QuestionGenerationParams } from '@/services/generation/PromptBuilder'
import type { Question, QuestionCategory, QuestionSection, QuestionDifficulty } from '@/types/question'

/**
 * Helper: Get question type based on section and category
 * Maps practice categories to valid question types for generation
 */
function getQuestionTypeForCategory(
  section: QuestionSection,
  category: QuestionCategory
): QuestionGenerationParams['questionType'] {
  if (section === 'quantitative') {
    // Geometry questions use diagram type, everything else is MCQ
    return category === 'geometry' ? 'diagram' : 'mcq'
  } else {
    // Verbal section - map category to question type
    const verbalTypeMap: Record<string, QuestionGenerationParams['questionType']> = {
      reading: 'reading',
      analogy: 'analogy',
      completion: 'completion',
      error: 'error',
      'odd-word': 'odd-word',
    }
    return verbalTypeMap[category] || 'reading'
  }
}

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
  generation_context?: any
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

    // Generate questions using QuduratGenerator (with section-specific skills)
    let newQuestions
    try {
      const generator = new QuduratGenerator({
        enableCaching: true,
        maxRetries: 3,
      })

      // Get user's academic track for accurate question generation
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('academic_track')
        .eq('user_id', session.user_id)
        .single()

      const userTrack = (profile?.academic_track as 'scientific' | 'literary') || 'scientific'

      // Build generation params for each question
      const paramsArray: QuestionGenerationParams[] = []
      for (let i = 0; i < PRACTICE_BATCH_SIZE; i++) {
        // Distribute across categories evenly
        const category = session.categories[i % session.categories.length]
        paramsArray.push({
          section: session.section,
          track: userTrack,
          topic: category,
          subtopic: undefined,
          difficulty: session.difficulty,
          questionType: getQuestionTypeForCategory(session.section, category),
        })
      }

      const result = await generator.generateBatch(paramsArray)

      if (!result.success || result.questions.length === 0) {
        throw new Error('Failed to generate questions')
      }

      newQuestions = result.questions
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

    // Append new questions to existing ones
    const existingQuestions = (session.questions || []) as Question[]
    const allQuestions = [...existingQuestions, ...newQuestions]

    // Update session with new questions and release lock
    const { error: updateError } = await supabase
      .from('practice_sessions')
      .update({
        questions: allQuestions as unknown as Record<string, unknown>[],
        generated_batches: batchIndex + 1,
        generation_context: {},
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
      section: session.section,
      categories: session.categories,
    })

    // Return questions without answers (hide correct_answer and explanation for security)
    // Map v3.0 format to frontend format
    const questionsWithoutAnswers = newQuestions.map((q, index) => ({
      id: q.id || `practice_${batchIndex}_${index}`,
      index: existingQuestions.length + index,
      section: q.section,
      track: q.track,
      questionType: q.question_type, // Map to frontend format
      topic: q.topic,
      subtopic: q.subtopic,
      difficulty: q.difficulty,
      stem: q.question_text, // Map question_text to stem for frontend
      choices: q.choices,
      diagram: q.diagram, // v3.0 uses diagram field
      // Hide correct_answer and explanation until user submits
    }))

    return NextResponse.json({
      questions: questionsWithoutAnswers,
      meta: {
        batchIndex,
        totalLoaded: allQuestions.length,
      },
    })
  } catch (error) {
    console.error('Practice batch generation route error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
