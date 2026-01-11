// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { QuduratGenerator } from '@/services/generation/QuduratGenerator'
import type { QuestionGenerationParams } from '@/services/generation/PromptBuilder'
import { canUseExamCredit, consumeExamCredit } from '@/lib/rewards/calculator'
import { getExamConfigForRetake, canRetakeExam } from '@/lib/exams/retake'
import type { AcademicTrack } from '@/types/exam'

/**
 * Determine starting section for first batch based on track
 */
function getFirstBatchSection(track: AcademicTrack): 'quantitative' | 'verbal' {
  return track === 'scientific' ? 'quantitative' : 'verbal'
}

/**
 * POST /api/exams/retake - Create new exam with same configuration as source exam
 * Body: { sourceExamId: string }
 * Returns: { sessionId: string, track: string }
 */
export async function POST(request: NextRequest) {
  try {
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
    const { sourceExamId } = body

    if (!sourceExamId) {
      return NextResponse.json(
        { error: 'معرف الاختبار المصدر مطلوب' },
        { status: 400 }
      )
    }

    // Validate that user can retake this exam
    const retakeCheck = await canRetakeExam(supabase, sourceExamId, user.id)
    if (!retakeCheck.canRetake) {
      return NextResponse.json(
        { error: retakeCheck.reason || 'لا يمكن إعادة هذا الاختبار' },
        { status: 403 }
      )
    }

    // Get exam configuration from source exam
    const examConfig = await getExamConfigForRetake(supabase, sourceExamId, user.id)
    if (!examConfig) {
      return NextResponse.json(
        { error: 'فشل في الحصول على تكوين الاختبار' },
        { status: 500 }
      )
    }

    // Check exam eligibility (weekly limit for free users)
    const { data: eligibility, error: eligibilityError } = await supabase.rpc(
      'check_exam_eligibility',
      { p_user_id: user.id }
    )

    if (eligibilityError) {
      console.error('Eligibility check error:', eligibilityError)
      return NextResponse.json(
        { error: 'فشل في التحقق من الأهلية' },
        { status: 500 }
      )
    }

    const eligibilityResult = eligibility?.[0]
    let usedExamCredit = false

    if (!eligibilityResult?.is_eligible) {
      // Check if user has exam credits to use as fallback
      const creditCheck = await canUseExamCredit(user.id)

      if (creditCheck.canUse) {
        // Try to use exam credit
        const creditUsed = await consumeExamCredit(user.id)
        if (creditUsed) {
          usedExamCredit = true
          // Continue with exam creation using credit
        } else {
          return NextResponse.json(
            {
              error: 'فشل في استخدام رصيد الاختبار',
              exams_taken: eligibilityResult?.exams_taken_this_week || 0,
              max_exams: eligibilityResult?.max_exams_per_week || 3,
              next_eligible_at: eligibilityResult?.next_eligible_at,
              reason: eligibilityResult?.reason,
              creditsAvailable: creditCheck.creditsAvailable,
            },
            { status: 429 }
          )
        }
      } else {
        return NextResponse.json(
          {
            error: 'لقد تجاوزت الحد الأسبوعي للاختبارات',
            exams_taken: eligibilityResult?.exams_taken_this_week || 0,
            max_exams: eligibilityResult?.max_exams_per_week || 3,
            next_eligible_at: eligibilityResult?.next_eligible_at,
            reason: eligibilityResult?.reason,
            creditsAvailable: 0,
          },
          { status: 429 }
        )
      }
    }

    const track = examConfig.track

    // Create exam session (with generation_in_progress = true to prevent concurrent generation)
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .insert({
        user_id: user.id,
        track,
        status: 'in_progress',
        total_questions: examConfig.totalQuestions,
        questions_answered: 0,
        questions: [],
        start_time: new Date().toISOString(),
        time_spent_seconds: 0,
        time_paused_seconds: 0,
        generated_batches: 0,
        generation_context: { generatedIds: [], lastBatchIndex: -1 },
        generation_in_progress: true,
        // Store exam config for future retakes
        exam_config: {
          ...examConfig,
          generatedAt: new Date().toISOString(),
          sourceExamId, // Track that this is a retake
        },
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      return NextResponse.json(
        { error: 'فشل في إنشاء جلسة الاختبار' },
        { status: 500 }
      )
    }

    // Generate first batch of 10 questions using QuduratGenerator (with section-specific skills)
    const firstSection = getFirstBatchSection(track)

    let questions
    try {
      const generator = new QuduratGenerator({
        enableCaching: true,
        maxRetries: 3,
      })

      // Build generation params for each question in the batch
      const paramsArray: QuestionGenerationParams[] = []
      for (let i = 0; i < 10; i++) {
        paramsArray.push({
          section: firstSection,
          track,
          topic: undefined, // Let generator choose from topic distribution
          subtopic: undefined,
          difficulty: undefined, // Let generator choose from difficulty distribution
        })
      }

      const result = await generator.generateBatch(paramsArray)

      if (!result.success || result.questions.length === 0) {
        throw new Error('Failed to generate questions')
      }

      questions = result.questions
    } catch (genError) {
      console.error('Question generation error:', genError)

      // Release lock on failure
      await supabase
        .from('exam_sessions')
        .update({ generation_in_progress: false })
        .eq('id', session.id)

      return NextResponse.json(
        { error: 'فشل في إنشاء الأسئلة. يرجى المحاولة مرة أخرى.' },
        { status: 500 }
      )
    }

    // Update session with generated questions and release lock
    const { error: updateError } = await supabase
      .from('exam_sessions')
      .update({
        questions: questions as unknown as Record<string, unknown>[],
        generated_batches: 1,
        generation_context: { generatedIds: questions.map((q) => q.id), lastBatchIndex: 0 },
        generation_in_progress: false,
      })
      .eq('id', session.id)

    if (updateError) {
      console.error('Session update error:', updateError)
      return NextResponse.json(
        { error: 'فشل في حفظ الأسئلة' },
        { status: 500 }
      )
    }

    // Log generation metrics
    console.log(`[Retake Exam ${session.id}] First batch generated using QuduratGenerator:`, {
      sourceExamId,
      questionCount: questions.length,
      section: firstSection,
      track,
    })

    // Return session ID for redirect
    return NextResponse.json({
      sessionId: session.id,
      track: session.track,
      totalQuestions: examConfig.totalQuestions,
      usedCredit: usedExamCredit,
    })
  } catch (error) {
    console.error('Retake exam error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
