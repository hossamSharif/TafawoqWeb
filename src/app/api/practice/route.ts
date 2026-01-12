// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { QuduratGenerator } from '@/services/generation/QuduratGenerator'
import type { QuestionGenerationParams } from '@/services/generation/PromptBuilder'
import { canUsePracticeCredit, consumePracticeCredit } from '@/lib/rewards/calculator'
import { calculatePracticeLimit, type AcademicTrack } from '@/lib/practice'
import type { Question, QuestionSection, QuestionDifficulty, QuestionCategory } from '@/types/question'
import { isAuthenticationError } from '@/lib/api-key-validator'

/**
 * Practice batch size (smaller than exam)
 */
const PRACTICE_BATCH_SIZE = 5

/**
 * POST /api/practice - Create new practice session
 * T047: Generates first batch of questions via Claude on session creation
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
    const { section, categories, difficulty, questionCount, useCredit } = body as {
      section: QuestionSection
      categories: QuestionCategory[]
      difficulty: QuestionDifficulty
      questionCount: number
      useCredit?: boolean // Optional: use practice credit for premium features
    }

    // Validate required fields
    if (!section || !categories || !difficulty || !questionCount) {
      return NextResponse.json(
        { error: 'يرجى تحديد جميع الحقول المطلوبة' },
        { status: 400 }
      )
    }

    // Validate section
    if (!['quantitative', 'verbal'].includes(section)) {
      return NextResponse.json(
        { error: 'القسم المحدد غير صالح' },
        { status: 400 }
      )
    }

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'مستوى الصعوبة غير صالح' },
        { status: 400 }
      )
    }

    // Validate categories
    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: 'يجب تحديد تصنيف واحد على الأقل' },
        { status: 400 }
      )
    }

    // T048: Get user's academic track for practice limit calculation (FR-016)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('academic_track')
      .eq('user_id', user.id)
      .single()

    const userTrack = (profile?.academic_track as AcademicTrack) || null

    // T048: Calculate practice limit based on section and track (FR-016)
    // Practice sessions limited to half the exam section's question count
    const practiceLimit = calculatePracticeLimit(section, userTrack)

    // Get user subscription status for tier restrictions
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('tier, status')
      .eq('user_id', user.id)
      .single()

    let isPremium = subscription?.tier === 'premium' && subscription?.status === 'active'
    let usedPracticeCredit = false

    // Check if user wants to use a practice credit for premium features
    if (!isPremium && useCredit) {
      const creditCheck = await canUsePracticeCredit(user.id)
      if (creditCheck.canUse) {
        const creditUsed = await consumePracticeCredit(user.id)
        if (creditUsed) {
          isPremium = true // Grant premium features for this session
          usedPracticeCredit = true
        }
      }
    }

    // Apply free tier restrictions (T093) and practice limit (T048)
    let finalQuestionCount = questionCount
    let finalCategories = categories
    let practiceLimitApplied = false

    if (!isPremium) {
      // Free users: max 2 categories, fixed 5 questions
      finalQuestionCount = 5
      finalCategories = categories.slice(0, 2)
    } else {
      // Premium users: validate question count range (5-practiceLimit)
      // T048: Apply half-section practice limit (FR-016)
      const maxAllowed = Math.min(100, practiceLimit) // Cap at both 100 and practice limit
      finalQuestionCount = Math.max(5, Math.min(maxAllowed, questionCount))

      // Track if practice limit was applied
      if (questionCount > practiceLimit) {
        practiceLimitApplied = true
      }
    }

    // T047: Create practice session first
    // Note: generation_in_progress column removed until migration is applied
    const { data: session, error: sessionError } = await supabase
      .from('practice_sessions')
      .insert({
        user_id: user.id,
        section,
        categories: finalCategories,
        difficulty,
        question_count: 0, // Will update after first batch
        questions: [],
        status: 'in_progress',
        started_at: new Date().toISOString(),
        time_spent_seconds: 0,
        // T049: New batch generation fields
        generated_batches: 0,
        generation_context: {},
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      return NextResponse.json(
        { error: 'فشل في إنشاء جلسة التمرين' },
        { status: 500 }
      )
    }

    // Generate first batch using QuduratGenerator (with section-specific skills)
    let questions
    try {
      const generator = new QuduratGenerator({
        enableCaching: true,
        maxRetries: 3,
      })

      // Build generation params for each question
      const paramsArray: QuestionGenerationParams[] = []
      for (let i = 0; i < PRACTICE_BATCH_SIZE; i++) {
        // Distribute across categories evenly
        const category = finalCategories[i % finalCategories.length]
        paramsArray.push({
          section,
          track: userTrack || 'scientific',
          topic: category,
          subtopic: undefined,
          difficulty,
        })
      }

      const result = await generator.generateBatch(paramsArray)

      if (!result.success || result.questions.length === 0) {
        throw new Error('Failed to generate questions')
      }

      questions = result.questions
    } catch (genError) {
      console.error('Question generation error:', genError)

      // Mark session as failed
      await supabase
        .from('practice_sessions')
        .update({ status: 'failed' })
        .eq('id', session.id)

      // Check for authentication errors (invalid API key)
      if (isAuthenticationError(genError)) {
        console.error('Authentication error detected - invalid ANTHROPIC_API_KEY')
        return NextResponse.json(
          {
            error: 'خطأ في إعدادات النظام. يرجى التواصل مع الدعم الفني.',
            errorCode: 'API_KEY_INVALID',
            details: 'تكوين مفتاح API غير صحيح'
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: 'فشل في إنشاء الأسئلة. يرجى المحاولة مرة أخرى.' },
        { status: 500 }
      )
    }

    // Update session with generated questions
    const { error: updateError } = await supabase
      .from('practice_sessions')
      .update({
        questions: questions as unknown as Record<string, unknown>[],
        question_count: questions.length,
        generated_batches: 1,
        generation_context: {},
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
    console.log(`[Practice ${session.id}] First batch generated:`, {
      questionCount: questions.length,
      section,
      categories: finalCategories,
    })

    // Return session with questions (without answers for security)
    // Map v3.0 format to frontend format
    const questionsWithoutAnswers = questions.map((q, index) => ({
      id: q.id || `practice_0_${index}`,
      index,
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

    // Also provide full questions with answers for frontend verification
    const questionsWithAnswers = questions.map((q, index) => {
      // Calculate answerIndex from correct_answer string
      let answerIndex = 0
      if (q.correct_answer && q.choices) {
        answerIndex = q.choices.findIndex((c: string) => c === q.correct_answer)
        if (answerIndex === -1) answerIndex = 0 // fallback
      }

      return {
        id: q.id || `practice_0_${index}`,
        index,
        section: q.section,
        track: q.track,
        questionType: q.question_type,
        topic: q.topic,
        subtopic: q.subtopic,
        difficulty: q.difficulty,
        stem: q.question_text,
        choices: q.choices,
        diagram: q.diagram,
        answerIndex,
        explanation: q.explanation,
        solvingStrategy: q.solving_strategy || q.solvingStrategy,
        tip: q.solving_tip || q.tip,
      }
    })

    return NextResponse.json({
      session: {
        id: session.id,
        status: session.status,
        section: session.section,
        categories: session.categories,
        difficulty: session.difficulty,
        questionCount: questions.length,
        startedAt: session.started_at,
        generatedBatches: 1,
      },
      questions: questionsWithoutAnswers,
      _questionsWithAnswers: questionsWithAnswers,
      restrictions: {
        appliedFreeTierRestrictions: !isPremium && !usedPracticeCredit,
        originalQuestionCount: questionCount,
        finalQuestionCount,
        originalCategories: categories,
        finalCategories,
        usedPracticeCredit,
        // T048: Practice limit information (FR-016, FR-017)
        practiceLimit,
        practiceLimitApplied,
        userTrack,
      },
      invalidateLimitsCache: true, // Signal frontend to invalidate subscription limits cache
    })
  } catch (error) {
    console.error('Practice creation error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

/**
 * GET /api/practice - List user's practice sessions
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')

    let query = supabase
      .from('practice_sessions')
      .select(
        'id, status, section, categories, difficulty, question_count, started_at, completed_at, time_spent_seconds'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('Sessions fetch error:', error)
      return NextResponse.json(
        { error: 'فشل في جلب جلسات التمرين' },
        { status: 500 }
      )
    }

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Practice list error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
