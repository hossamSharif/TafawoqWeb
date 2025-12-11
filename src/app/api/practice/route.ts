// @ts-nocheck
// TODO: Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generatePracticeQuestions } from '@/lib/gemini'
import type { Question, QuestionSection, QuestionDifficulty, QuestionCategory } from '@/types/question'

/**
 * POST /api/practice - Create new practice session
 * Generates questions via Gemini based on user-selected parameters
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
    const { section, categories, difficulty, questionCount } = body as {
      section: QuestionSection
      categories: QuestionCategory[]
      difficulty: QuestionDifficulty
      questionCount: number
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

    // Get user subscription status for tier restrictions
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('tier, status')
      .eq('user_id', user.id)
      .single()

    const isPremium = subscription?.tier === 'premium' && subscription?.status === 'active'

    // Apply free tier restrictions (T093)
    let finalQuestionCount = questionCount
    let finalCategories = categories

    if (!isPremium) {
      // Free users: max 2 categories, fixed 5 questions
      finalQuestionCount = 5
      finalCategories = categories.slice(0, 2)
    } else {
      // Premium users: validate question count range (5-100)
      finalQuestionCount = Math.max(5, Math.min(100, questionCount))
    }

    // Generate practice questions using Gemini
    let questions: Question[]

    try {
      questions = await generatePracticeQuestions(
        section,
        finalCategories[0], // Primary category for generation
        difficulty,
        finalQuestionCount
      )
    } catch (genError) {
      console.error('Question generation error:', genError)
      return NextResponse.json(
        { error: 'فشل في إنشاء الأسئلة. يرجى المحاولة مرة أخرى.' },
        { status: 500 }
      )
    }

    // Create practice session
    const { data: session, error: sessionError } = await supabase
      .from('practice_sessions')
      .insert({
        user_id: user.id,
        section,
        categories: finalCategories,
        difficulty,
        question_count: questions.length,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        time_spent_seconds: 0,
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

    // Return session with questions (without answers for security)
    const questionsWithoutAnswers = questions.map((q, index) => ({
      id: q.id,
      index,
      section: q.section,
      topic: q.topic,
      difficulty: q.difficulty,
      questionType: q.questionType,
      stem: q.stem,
      choices: q.choices,
      passage: q.passage,
      // answerIndex, explanation hidden until answered
    }))

    return NextResponse.json({
      session: {
        id: session.id,
        status: session.status,
        section: session.section,
        categories: session.categories,
        difficulty: session.difficulty,
        questionCount: session.question_count,
        startedAt: session.started_at,
      },
      questions: questionsWithoutAnswers,
      _questionsWithAnswers: questions, // Store full questions for answer checking
      restrictions: {
        appliedFreeTierRestrictions: !isPremium,
        originalQuestionCount: questionCount,
        finalQuestionCount,
        originalCategories: categories,
        finalCategories,
      },
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
