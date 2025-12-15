// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/admin/queries'
import { logAdminAction } from '@/lib/admin/audit'
import type { Question } from '@/types/question'

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

    const body = await request.json()
    const { title, description, section, questions } = body as {
      title: string
      description?: string
      section: 'quantitative' | 'verbal'
      questions: Question[]
    }

    // Basic validation
    if (!title || !section || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 400 }
      )
    }

    // First, create an exam_session to hold the questions
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

    // Create the forum post with is_admin_upload = true
    const { data: forumPost, error: postError } = await supabase
      .from('forum_posts')
      .insert({
        author_id: user.id,
        title,
        body: JSON.stringify({ description, section }),
        post_type: 'exam_share',
        shared_exam_id: examSession.id,
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
      // Clean up the exam session if post creation fails
      await supabase.from('exam_sessions').delete().eq('id', examSession.id)
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
        section,
        questionCount: questions.length,
        examSessionId: examSession.id,
      },
    })

    return NextResponse.json({
      success: true,
      contentId: forumPost.id,
      examSessionId: examSession.id,
    })
  } catch (error) {
    console.error('Admin content upload error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to upload content' } },
      { status: 500 }
    )
  }
}
