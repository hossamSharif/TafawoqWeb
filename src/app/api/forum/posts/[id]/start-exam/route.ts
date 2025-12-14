// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { isUserBanned, isFeatureEnabled } from '@/lib/forum/queries'
import type { StartExamResponse } from '@/lib/forum/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/forum/posts/[id]/start-exam - Start taking a shared exam
 * Creates a new exam/practice session based on the shared content
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId } = await params
    const supabase = await createServerClient()

    // Check if forum is enabled
    const forumEnabled = await isFeatureEnabled('forum_enabled')
    if (!forumEnabled) {
      return NextResponse.json(
        { error: 'المنتدى غير متاح حالياً' },
        { status: 503 }
      )
    }

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Check if user is banned
    const banned = await isUserBanned(user.id)
    if (banned) {
      return NextResponse.json(
        { error: 'حسابك محظور من استخدام المنتدى' },
        { status: 403 }
      )
    }

    // Get the forum post
    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .select('id, author_id, post_type, shared_exam_id, shared_practice_id, title')
      .eq('id', postId)
      .eq('status', 'active')
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'المنشور غير موجود' },
        { status: 404 }
      )
    }

    // Must be an exam share post
    if (post.post_type !== 'exam_share') {
      return NextResponse.json(
        { error: 'هذا المنشور ليس اختباراً مشاركاً' },
        { status: 400 }
      )
    }

    // Cannot take own shared exam
    if (post.author_id === user.id) {
      return NextResponse.json(
        { error: 'لا يمكنك حل اختبارك المشارك' },
        { status: 403 }
      )
    }

    // Check if user already completed this shared exam
    const { data: existingCompletion } = await supabase
      .from('shared_exam_completions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single()

    if (existingCompletion) {
      return NextResponse.json(
        { error: 'لقد أكملت هذا الاختبار المشارك من قبل' },
        { status: 409 }
      )
    }

    // Determine if it's an exam or practice share
    const isExamShare = !!post.shared_exam_id
    const isPracticeShare = !!post.shared_practice_id

    if (!isExamShare && !isPracticeShare) {
      return NextResponse.json(
        { error: 'لا يوجد اختبار أو تدريب مرتبط بهذا المنشور' },
        { status: 400 }
      )
    }

    let response: StartExamResponse

    if (isExamShare) {
      // Get the original exam session
      const { data: originalExam, error: examError } = await supabase
        .from('exam_sessions')
        .select('track, questions, total_questions')
        .eq('id', post.shared_exam_id)
        .single()

      if (examError || !originalExam) {
        return NextResponse.json(
          { error: 'الاختبار الأصلي غير موجود' },
          { status: 404 }
        )
      }

      // Strip answers from questions for the new session
      const questionsWithoutAnswers = (originalExam.questions as Array<{
        id: string
        section: string
        topic: string
        difficulty: string
        questionType: string
        stem: string
        choices: string[]
        passage?: string
        answerIndex?: number
        explanation?: string
      }>).map((q) => ({
        ...q,
        answerIndex: undefined, // Remove answer
        explanation: undefined, // Remove explanation
        userAnswer: undefined,
        isCorrect: undefined,
      }))

      // Create new exam session for this user
      const { data: newSession, error: sessionError } = await supabase
        .from('exam_sessions')
        .insert({
          user_id: user.id,
          track: originalExam.track,
          status: 'in_progress',
          total_questions: originalExam.total_questions,
          questions_answered: 0,
          questions: questionsWithoutAnswers,
          start_time: new Date().toISOString(),
          time_spent_seconds: 0,
          time_paused_seconds: 0,
          generated_batches: Math.ceil(originalExam.total_questions / 10),
          generation_context: { generatedIds: [], lastBatchIndex: -1 },
          generation_in_progress: false,
          // Mark as shared exam session
          shared_from_post_id: postId,
        })
        .select('id')
        .single()

      if (sessionError || !newSession) {
        console.error('Failed to create exam session:', sessionError)
        return NextResponse.json(
          { error: 'فشل في إنشاء جلسة الاختبار' },
          { status: 500 }
        )
      }

      // Record the start of this shared exam (completion will be recorded when exam ends)
      // We'll use a pre-completion record to track that user started this exam
      // The actual completion record will be created when the exam is submitted

      response = {
        session_id: newSession.id,
        session_type: 'exam',
        redirect_url: `/exam/${newSession.id}`,
      }
    } else {
      // Practice share
      const { data: originalPractice, error: practiceError } = await supabase
        .from('practice_sessions')
        .select('section, category, difficulty, total_questions, questions')
        .eq('id', post.shared_practice_id)
        .single()

      if (practiceError || !originalPractice) {
        return NextResponse.json(
          { error: 'التدريب الأصلي غير موجود' },
          { status: 404 }
        )
      }

      // Strip answers from questions
      const questionsWithoutAnswers = (originalPractice.questions as Array<{
        id: string
        section: string
        topic: string
        difficulty: string
        questionType: string
        stem: string
        choices: string[]
        passage?: string
        answerIndex?: number
        explanation?: string
      }>).map((q) => ({
        ...q,
        answerIndex: undefined,
        explanation: undefined,
        userAnswer: undefined,
        isCorrect: undefined,
      }))

      // Create new practice session
      const { data: newSession, error: sessionError } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.id,
          section: originalPractice.section,
          category: originalPractice.category,
          difficulty: originalPractice.difficulty,
          total_questions: originalPractice.total_questions,
          questions_answered: 0,
          questions: questionsWithoutAnswers,
          status: 'in_progress',
          start_time: new Date().toISOString(),
          time_spent_seconds: 0,
          // Mark as shared practice session
          shared_from_post_id: postId,
        })
        .select('id')
        .single()

      if (sessionError || !newSession) {
        console.error('Failed to create practice session:', sessionError)
        return NextResponse.json(
          { error: 'فشل في إنشاء جلسة التدريب' },
          { status: 500 }
        )
      }

      response = {
        session_id: newSession.id,
        session_type: 'practice',
        redirect_url: `/practice/${newSession.id}`,
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Start shared exam error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
