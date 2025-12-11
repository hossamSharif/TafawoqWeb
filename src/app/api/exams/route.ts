// @ts-nocheck
// TODO: Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateFullExam, type AcademicTrack } from '@/lib/gemini'
import type { Question } from '@/types/question'

/**
 * POST /api/exams - Create new exam session
 * Generates 96 questions via Gemini and creates session record
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

    // Get user profile for track
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('academic_track')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'لم يتم العثور على ملف المستخدم' },
        { status: 404 }
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
    if (!eligibilityResult?.is_eligible) {
      return NextResponse.json(
        {
          error: 'لقد تجاوزت الحد الأسبوعي للاختبارات',
          exams_taken: eligibilityResult?.exams_taken_this_week || 0,
          max_exams: eligibilityResult?.max_exams_per_week || 3,
          next_eligible_at: eligibilityResult?.next_eligible_at,
          reason: eligibilityResult?.reason,
        },
        { status: 429 }
      )
    }

    // Generate exam questions using Gemini
    const track = profile.academic_track as AcademicTrack
    let questions: Question[]

    try {
      questions = await generateFullExam({ track, totalQuestions: 96 })
    } catch (genError) {
      console.error('Question generation error:', genError)
      return NextResponse.json(
        { error: 'فشل في إنشاء الأسئلة. يرجى المحاولة مرة أخرى.' },
        { status: 500 }
      )
    }

    // Create exam session
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .insert({
        user_id: user.id,
        track,
        status: 'in_progress',
        total_questions: questions.length,
        questions_answered: 0,
        questions: questions as unknown as Record<string, unknown>[],
        start_time: new Date().toISOString(),
        time_spent_seconds: 0,
        time_paused_seconds: 0,
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
        totalQuestions: session.total_questions,
        questionsAnswered: session.questions_answered,
        startTime: session.start_time,
        track: session.track,
      },
      questions: questionsWithoutAnswers,
    })
  } catch (error) {
    console.error('Exam creation error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

/**
 * GET /api/exams - List user's exam sessions
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
      .from('exam_sessions')
      .select(
        'id, status, total_questions, questions_answered, start_time, end_time, track, verbal_score, quantitative_score, overall_score, time_spent_seconds'
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
        { error: 'فشل في جلب الاختبارات' },
        { status: 500 }
      )
    }

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Exams list error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
