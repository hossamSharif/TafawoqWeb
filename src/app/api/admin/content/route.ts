// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/admin/queries'
import { logAdminAction } from '@/lib/admin/audit'
import type { Question } from '@/types/question'

// GET /api/admin/content - List admin-uploaded content
export async function GET() {
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

    // Fetch admin-uploaded content from forum_posts with is_admin_upload = true
    const { data: posts, error } = await supabase
      .from('forum_posts')
      .select(`
        id,
        title,
        body,
        post_type,
        created_at,
        completion_count,
        shared_exam_id,
        shared_practice_id
      `)
      .eq('is_admin_upload', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching admin content:', error)
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch content' } },
        { status: 500 }
      )
    }

    // Get library access counts for each post
    const postIds = posts?.map(p => p.id) || []
    let accessCounts: Record<string, number> = {}

    if (postIds.length > 0) {
      const { data: accessData } = await supabase
        .from('library_access')
        .select('post_id')
        .in('post_id', postIds)

      if (accessData) {
        accessCounts = accessData.reduce((acc: Record<string, number>, item) => {
          acc[item.post_id] = (acc[item.post_id] || 0) + 1
          return acc
        }, {})
      }
    }

    // Get question counts from exam_sessions for each post
    const sharedExamIds = posts?.filter(p => p.shared_exam_id).map(p => p.shared_exam_id) || []
    let examQuestionCounts: Record<string, number> = {}

    if (sharedExamIds.length > 0) {
      const { data: examData } = await supabase
        .from('exam_sessions')
        .select('id, total_questions')
        .in('id', sharedExamIds)

      if (examData) {
        examQuestionCounts = examData.reduce((acc: Record<string, number>, exam) => {
          acc[exam.id] = exam.total_questions || 0
          return acc
        }, {})
      }
    }

    // Transform to response format
    const contents = (posts || []).map(post => {
      // Try to get section from body if it's JSON
      let section: 'quantitative' | 'verbal' = 'quantitative'
      try {
        if (post.body) {
          const bodyData = JSON.parse(post.body)
          if (bodyData.section) {
            section = bodyData.section
          }
        }
      } catch {
        // Not JSON body, use default
      }

      return {
        id: post.id,
        title: post.title,
        section,
        questionCount: post.shared_exam_id ? (examQuestionCounts[post.shared_exam_id] || 0) : 0,
        accessCount: accessCounts[post.id] || 0,
        completionCount: post.completion_count || 0,
        createdAt: post.created_at,
        isLibraryVisible: true, // Admin uploads are always visible
      }
    })

    return NextResponse.json({ contents })
  } catch (error) {
    console.error('Admin content list error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch content' } },
      { status: 500 }
    )
  }
}

// POST /api/admin/content - Upload new admin content (alias for /api/admin/content/upload)
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
