// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { calculateSectionScores, calculateCategoryBreakdown, identifyStrengthsWeaknesses, type AcademicTrack } from '@/lib/utils/scoring'
import { notifyExamCompleted } from '@/lib/notifications/service'
import type { Question } from '@/types/question'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

interface ExamSessionRow {
  id: string
  user_id: string
  track: 'scientific' | 'literary'
  status: 'in_progress' | 'completed' | 'abandoned' | 'paused'
  questions: Question[]
  total_questions: number
  questions_answered: number
  start_time: string
  end_time?: string
  time_spent_seconds?: number
  time_paused_seconds?: number
  paused_at?: string
  remaining_time_seconds?: number
  verbal_score?: number
  quantitative_score?: number
  overall_score?: number
  generated_batches?: number
  generation_context?: { generatedIds: string[]; lastBatchIndex: number }
}

interface AnswerRow {
  question_id: string
  question_index: number
  selected_answer: number
  is_correct: boolean
  time_spent_seconds?: number
}

/**
 * GET /api/exams/[sessionId] - Get exam session details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Get session with questions
    const { data: sessionData, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    const session = sessionData as unknown as ExamSessionRow | null

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'لم يتم العثور على جلسة الاختبار' },
        { status: 404 }
      )
    }

    // Get answered questions
    const { data: answersData } = await supabase
      .from('answers')
      .select('*')
      .eq('session_id', sessionId)
      .eq('session_type', 'exam')
      .order('question_index')

    const answers = (answersData || []) as unknown as AnswerRow[]
    const answeredIndexes = new Set(answers.map((a) => a.question_index))

    // Format questions - hide answers for unanswered questions
    // Note: Questions are stored in v3.0 format (question_text, question_type, diagram)
    // but frontend expects (stem, questionType, diagram) - map accordingly
    const questions = (session.questions as unknown as any[]).map(
      (q, index) => {
        const isAnswered = answeredIndexes.has(index)
        const answer = answers?.find((a) => a.question_index === index)

        // Calculate answerIndex from correct_answer string by finding it in choices
        let answerIndex = q.answerIndex
        if (answerIndex === undefined && q.correct_answer && q.choices) {
          answerIndex = q.choices.findIndex((c: string) => c === q.correct_answer)
          if (answerIndex === -1) answerIndex = 0 // fallback
        }

        return {
          id: q.id || `exam_${sessionId}_q${index}`, // Ensure ID exists for frontend
          index,
          section: q.section,
          topic: q.topic,
          difficulty: q.difficulty,
          // Map v3.0 format to frontend format
          questionType: q.question_type || q.questionType,
          stem: q.question_text || q.stem, // v3.0 uses question_text
          choices: q.choices,
          passage: q.passage,
          diagram: q.diagram, // v3.0 uses diagram field
          // Only show answer info if already answered
          ...(isAnswered && {
            answerIndex,
            selectedAnswer: answer?.selected_answer,
            isCorrect: answer?.is_correct,
          }),
        }
      }
    )

    // T032-T033: Return all generated questions for session resume
    return NextResponse.json({
      session: {
        id: session.id,
        status: session.status,
        totalQuestions: session.total_questions,
        questionsAnswered: session.questions_answered,
        startTime: session.start_time,
        endTime: session.end_time,
        track: session.track,
        timeSpentSeconds: session.time_spent_seconds,
        timePausedSeconds: session.time_paused_seconds,
        // Include pause info for resumed sessions
        pausedAt: session.paused_at,
        remainingTimeSeconds: session.remaining_time_seconds,
        verbalScore: session.verbal_score,
        quantitativeScore: session.quantitative_score,
        overallScore: session.overall_score,
        // Include batch generation info for session resume
        generatedBatches: session.generated_batches || Math.ceil(questions.length / 10),
        generationContext: session.generation_context || { generatedIds: [], lastBatchIndex: -1 },
      },
      questions,
      answers: answers?.map((a) => ({
        questionIndex: a.question_index,
        selectedAnswer: a.selected_answer,
        isCorrect: a.is_correct,
        timeSpentSeconds: a.time_spent_seconds,
      })),
    })
  } catch (error) {
    console.error('Get exam session error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

/**
 * PATCH /api/exams/[sessionId] - Update exam session (complete/abandon)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const body = await request.json()
    const { action, timeSpentSeconds } = body

    if (!['complete', 'abandon'].includes(action)) {
      return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 })
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

    // Allow completing/abandoning from both 'in_progress' and 'paused' status
    if (session.status !== 'in_progress' && session.status !== 'paused') {
      return NextResponse.json(
        { error: 'الاختبار ليس قيد التقدم أو متوقف' },
        { status: 400 }
      )
    }

    const newStatus = action === 'complete' ? 'completed' : 'abandoned'
    const endTime = new Date().toISOString()

    // Calculate scores if completing
    let scores = {}
    if (action === 'complete') {
      // Get all answers
      const { data: answers } = await supabase
        .from('answers')
        .select('*')
        .eq('session_id', sessionId)
        .eq('session_type', 'exam')

      const questions = session.questions as unknown as Question[]

      if (answers && answers.length > 0) {
        const answerData = answers.map((a) => ({
          questionId: a.question_id,
          questionIndex: a.question_index,
          selectedAnswer: a.selected_answer,
          isCorrect: a.is_correct,
          section: questions[a.question_index]?.section || 'quantitative',
          category: questions[a.question_index]?.topic,
        }))

        const sectionScores = calculateSectionScores(
          answerData,
          questions,
          session.total_questions,
          session.track as AcademicTrack
        )
        const categoryBreakdown = calculateCategoryBreakdown(answerData, questions)
        const { strengths, weaknesses } = identifyStrengthsWeaknesses(categoryBreakdown)

        scores = {
          verbal_score: sectionScores.verbalScore,
          quantitative_score: sectionScores.quantitativeScore,
          overall_score: sectionScores.overallScore,
          strengths,
          weaknesses,
        }
      }
    }

    // Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from('exam_sessions')
      .update({
        status: newStatus,
        end_time: endTime,
        time_spent_seconds: timeSpentSeconds || session.time_spent_seconds,
        updated_at: new Date().toISOString(),
        ...scores,
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (updateError) {
      console.error('Session update error:', updateError)
      return NextResponse.json(
        { error: 'فشل في تحديث جلسة الاختبار' },
        { status: 500 }
      )
    }

    // If completing, also create exam_results record
    if (action === 'complete' && Object.keys(scores).length > 0) {
      await supabase.from('exam_results').insert({
        user_id: user.id,
        exam_session_id: sessionId,
        verbal_score: (scores as { verbal_score?: number }).verbal_score || 0,
        quantitative_score: (scores as { quantitative_score?: number }).quantitative_score || 0,
        overall_average: (scores as { overall_score?: number }).overall_score || 0,
        strengths: (scores as { strengths?: string[] }).strengths,
        weaknesses: (scores as { weaknesses?: string[] }).weaknesses,
      })

      // Update user analytics
      const typedScores = scores as {
        verbal_score?: number
        quantitative_score?: number
        overall_score?: number
        strengths?: string[]
        weaknesses?: string[]
      }

      await supabase
        .from('user_analytics')
        .upsert({
          user_id: user.id,
          last_exam_verbal_score: typedScores.verbal_score,
          last_exam_quantitative_score: typedScores.quantitative_score,
          last_exam_overall_average: typedScores.overall_score,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      // Update performance_records with exam history
      const { data: perfRecord } = await supabase
        .from('performance_records')
        .select('exam_history, weekly_exam_count, week_start_date')
        .eq('user_id', user.id)
        .single()

      // Build new exam history entry
      const newExamEntry = {
        date: endTime,
        verbal: typedScores.verbal_score || 0,
        quantitative: typedScores.quantitative_score || 0,
        overall: typedScores.overall_score || 0,
      }

      // Get existing history or create empty array
      const existingHistory = (perfRecord?.exam_history || []) as Array<{
        date: string
        verbal: number
        quantitative: number
        overall: number
      }>

      // Add new entry and keep last 10
      const updatedHistory = [...existingHistory, newExamEntry].slice(-10)

      // Check if we need to reset weekly count (if more than 7 days)
      const weekStartDate = perfRecord?.week_start_date
      const now = new Date()
      const weekStart = weekStartDate ? new Date(weekStartDate) : null
      const daysDiff = weekStart ? Math.floor((now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)) : 8

      const newWeeklyCount = daysDiff >= 7 ? 1 : (perfRecord?.weekly_exam_count || 0) + 1
      const newWeekStartDate = daysDiff >= 7 ? now.toISOString().split('T')[0] : weekStartDate

      await supabase
        .from('performance_records')
        .upsert({
          user_id: user.id,
          exam_history: updatedHistory,
          weekly_exam_count: newWeeklyCount,
          week_start_date: newWeekStartDate,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      // Update user_profiles with last exam scores
      await supabase
        .from('user_profiles')
        .update({
          last_exam_scores: {
            verbal: typedScores.verbal_score || 0,
            quantitative: typedScores.quantitative_score || 0,
            overall: typedScores.overall_score || 0,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      // Handle shared exam completion - record completion and notify post author
      if (session.shared_from_post_id) {
        try {
          // Get the forum post and author info
          const { data: post } = await supabase
            .from('forum_posts')
            .select('id, title, author_id, completion_count')
            .eq('id', session.shared_from_post_id)
            .single()

          if (post && post.author_id !== user.id) {
            // Get completing user's display name
            const { data: userProfile } = await supabase
              .from('user_profiles')
              .select('display_name')
              .eq('user_id', user.id)
              .single()

            // Record the completion
            // Note: shared_exam_completions table does NOT have a score column
            // The trigger grant_reward_on_completion() will handle reward crediting
            // BUG-006 FIX APPLIED: Migration fix_bug006_notification_target_type deployed
            const { error: completionError } = await supabase
              .from('shared_exam_completions')
              .insert({
                post_id: post.id,
                user_id: user.id,
                exam_session_id: sessionId,
              })
            if (completionError) {
              console.error('shared_exam_completions insert error:', completionError.message)
            }

            // Update completion count on the post using direct update
            // (RPC increment_completion_count may have additional logic)
            await supabase
              .from('forum_posts')
              .update({ completion_count: post.completion_count ? post.completion_count + 1 : 1 })
              .eq('id', post.id)

            // Notify the post author
            await notifyExamCompleted(post.author_id, {
              postId: post.id,
              postTitle: post.title,
              completedByName: userProfile?.display_name || 'مستخدم',
            })
          }

          // T034: Handle library exam completion - update library_access record
          // This marks the library access as completed, which prevents re-sharing
          if (session.is_library_exam) {
            await supabase
              .from('library_access')
              .update({ exam_completed: true })
              .eq('user_id', user.id)
              .eq('post_id', session.shared_from_post_id)
          }
        } catch (sharedExamError) {
          // Log but don't fail the main operation
          console.error('Failed to record shared exam completion:', sharedExamError)
        }
      }
    }

    return NextResponse.json({
      session: {
        id: updatedSession.id,
        status: updatedSession.status,
        endTime: updatedSession.end_time,
        verbalScore: updatedSession.verbal_score,
        quantitativeScore: updatedSession.quantitative_score,
        overallScore: updatedSession.overall_score,
      },
    })
  } catch (error) {
    console.error('Update exam session error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
