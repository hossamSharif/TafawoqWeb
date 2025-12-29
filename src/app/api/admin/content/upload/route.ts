// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/admin/queries'
import { logAdminAction } from '@/lib/admin/audit'
import type { Question } from '@/types/question'

type ContentType = 'exam' | 'practice'

interface UploadRequestBody {
  title: string
  description?: string
  contentType: ContentType
  section: 'quantitative' | 'verbal'
  difficulty?: 'easy' | 'medium' | 'hard'
  questions: Question[]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Verify admin access
    try {
      await verifyAdminAccess(user.id)
    } catch {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const body: UploadRequestBody = await request.json()
    const { title, description, contentType = 'exam', section, difficulty, questions } = body

    // Basic validation
    if (!title || !section || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 400 }
      )
    }

    // Validate difficulty for practice content
    if (contentType === 'practice' && !difficulty) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Difficulty is required for practice content' } },
        { status: 400 }
      )
    }

    let sessionId: string
    let postType: 'exam_share' | 'practice_share'
    let sharedExamId: string | null = null
    let sharedPracticeId: string | null = null

    if (contentType === 'practice') {
      // Create a practice_session to hold the questions
      // Extract unique categories from questions
      const categories = [...new Set(questions.map(q => q.topic))]

      const { data: practiceSession, error: practiceError } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.id,
          status: 'completed',
          section: section,
          categories: categories,
          difficulty: difficulty,
          question_count: questions.length,
          questions: questions,
          created_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          time_spent_seconds: 0,
          generated_batches: 1,
        })
        .select('id')
        .single()

      if (practiceError || !practiceSession) {
        console.error('Error creating practice session:', practiceError)
        return NextResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Failed to create practice session' } },
          { status: 500 }
        )
      }

      sessionId = practiceSession.id
      postType = 'practice_share'
      sharedPracticeId = practiceSession.id
    } else {
      // Create an exam_session to hold the questions
      const { data: examSession, error: examError } = await supabase
        .from('exam_sessions')
        .insert({
          user_id: user.id,
          status: 'completed',
          track: section === 'verbal' ? 'literary' : 'scientific',
          total_questions: questions.length,
          questions: questions,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (examError || !examSession) {
        console.error('Error creating exam session:', examError)
        return NextResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Failed to create exam session' } },
          { status: 500 }
        )
      }

      sessionId = examSession.id
      postType = 'exam_share'
      sharedExamId = examSession.id
    }

    // Create the forum post with is_admin_upload = true
    const { data: forumPost, error: postError } = await supabase
      .from('forum_posts')
      .insert({
        author_id: user.id,
        title,
        body: JSON.stringify({ description, section, contentType, difficulty }),
        post_type: postType,
        shared_exam_id: sharedExamId,
        shared_practice_id: sharedPracticeId,
        is_library_visible: true,
        is_admin_upload: true,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (postError || !forumPost) {
      console.error('Error creating forum post:', postError)
      // Clean up the session if post creation fails
      if (contentType === 'practice') {
        await supabase.from('practice_sessions').delete().eq('id', sessionId)
      } else {
        await supabase.from('exam_sessions').delete().eq('id', sessionId)
      }
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to create content' } },
        { status: 500 }
      )
    }

    // Log admin action
    await logAdminAction(user.id, {
      action_type: 'content_uploaded',
      target_type: 'forum_post',
      target_id: forumPost.id,
      details: {
        title,
        contentType,
        section,
        difficulty: contentType === 'practice' ? difficulty : undefined,
        questionCount: questions.length,
        sessionId: sessionId,
      },
    })

    return NextResponse.json({
      success: true,
      contentId: forumPost.id,
      contentType,
      sessionId,
    })
  } catch (error) {
    console.error('Admin content upload error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to upload content' } },
      { status: 500 }
    )
  }
}
