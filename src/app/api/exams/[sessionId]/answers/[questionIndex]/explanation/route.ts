import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { Question } from '@/types/question'

interface RouteParams {
  params: Promise<{ sessionId: string; questionIndex: string }>
}

/**
 * GET /api/exams/[sessionId]/answers/[questionIndex]/explanation
 * Get explanation for a specific question
 * Free users: 24-hour delay after exam completion
 * Premium users: Immediate access
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId, questionIndex: questionIndexStr } = await params
    const questionIndex = parseInt(questionIndexStr)

    if (isNaN(questionIndex) || questionIndex < 0) {
      return NextResponse.json(
        { error: 'رقم السؤال غير صالح' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'لم يتم العثور على جلسة الاختبار' },
        { status: 404 }
      )
    }

    // Get question from session
    const questions = session.questions as unknown as Question[]
    if (questionIndex >= questions.length) {
      return NextResponse.json(
        { error: 'رقم السؤال غير صالح' },
        { status: 400 }
      )
    }

    const question = questions[questionIndex]

    // Check if question has been answered
    const { data: answer, error: answerError } = await supabase
      .from('answers')
      .select('*')
      .eq('session_id', sessionId)
      .eq('question_index', questionIndex)
      .eq('session_type', 'exam')
      .single()

    // If exam is still in progress and question is answered, allow explanation
    if (session.status === 'in_progress') {
      if (!answer) {
        return NextResponse.json(
          { error: 'يجب الإجابة على السؤال أولاً' },
          { status: 403 }
        )
      }

      // Mark explanation as viewed
      if (!answer.explanation_viewed) {
        await supabase
          .from('answers')
          .update({
            explanation_viewed: true,
            explanation_viewed_at: new Date().toISOString(),
          })
          .eq('id', answer.id)
      }

      return NextResponse.json({
        questionIndex,
        explanation: question.explanation,
        correctAnswer: question.answerIndex,
        solvingStrategy: question.solvingStrategy,
        tip: question.tip,
      })
    }

    // Exam is completed - check for premium or 24-hour delay
    if (session.status === 'completed') {
      // Check premium status
      const { data: hasPremium } = await supabase.rpc('has_premium_access', {
        check_user_id: user.id,
      })

      if (hasPremium) {
        // Premium users get immediate access
        return NextResponse.json({
          questionIndex,
          explanation: question.explanation,
          correctAnswer: question.answerIndex,
          solvingStrategy: question.solvingStrategy,
          tip: question.tip,
        })
      }

      // Free users - check 24-hour delay
      const endTime = new Date(session.end_time)
      const now = new Date()
      const hoursSinceCompletion =
        (now.getTime() - endTime.getTime()) / (1000 * 60 * 60)

      if (hoursSinceCompletion < 24) {
        const hoursRemaining = Math.ceil(24 - hoursSinceCompletion)
        return NextResponse.json(
          {
            error: 'الشرح متاح بعد 24 ساعة من إكمال الاختبار',
            hoursRemaining,
            availableAt: new Date(
              endTime.getTime() + 24 * 60 * 60 * 1000
            ).toISOString(),
            premiumRequired: true,
          },
          { status: 403 }
        )
      }

      // 24 hours passed - allow access
      return NextResponse.json({
        questionIndex,
        explanation: question.explanation,
        correctAnswer: question.answerIndex,
        solvingStrategy: question.solvingStrategy,
        tip: question.tip,
      })
    }

    // Exam abandoned or other status
    return NextResponse.json(
      { error: 'لا يمكن الوصول إلى الشرح لهذا الاختبار' },
      { status: 403 }
    )
  } catch (error) {
    console.error('Get explanation error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
