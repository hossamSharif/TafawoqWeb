// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/admin/queries'
import { logAdminAction } from '@/lib/admin/audit'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/content/[id] - Get single content details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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

    // Fetch the content
    const { data: post, error } = await supabase
      .from('forum_posts')
      .select(`
        id,
        title,
        body,
        post_type,
        created_at,
        completion_count,
        shared_exam_id,
        is_library_visible,
        is_admin_upload
      `)
      .eq('id', id)
      .eq('is_admin_upload', true)
      .single()

    if (error || !post) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Content not found' } },
        { status: 404 }
      )
    }

    // Get the exam session to retrieve questions
    let questions = []
    if (post.shared_exam_id) {
      const { data: examSession } = await supabase
        .from('exam_sessions')
        .select('questions, total_questions')
        .eq('id', post.shared_exam_id)
        .single()

      if (examSession?.questions) {
        questions = examSession.questions
      }
    }

    // Get access count
    const { count: accessCount } = await supabase
      .from('library_access')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', id)

    // Parse body for metadata
    let metadata = { description: '', section: 'quantitative' }
    try {
      if (post.body) {
        metadata = JSON.parse(post.body)
      }
    } catch {
      // Not JSON, use defaults
    }

    return NextResponse.json({
      id: post.id,
      title: post.title,
      description: metadata.description,
      section: metadata.section,
      questions,
      questionCount: questions.length,
      accessCount: accessCount || 0,
      completionCount: post.completion_count || 0,
      createdAt: post.created_at,
      isLibraryVisible: post.is_library_visible,
    })
  } catch (error) {
    console.error('Admin content get error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch content' } },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/content/[id] - Delete admin content
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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

    // First, verify this is admin-uploaded content
    const { data: post, error: fetchError } = await supabase
      .from('forum_posts')
      .select('id, title, shared_exam_id, is_admin_upload')
      .eq('id', id)
      .single()

    if (fetchError || !post) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Content not found' } },
        { status: 404 }
      )
    }

    if (!post.is_admin_upload) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Can only delete admin-uploaded content' } },
        { status: 403 }
      )
    }

    // Delete associated library_access records
    await supabase
      .from('library_access')
      .delete()
      .eq('post_id', id)

    // Delete associated shared_exam_completions
    await supabase
      .from('shared_exam_completions')
      .delete()
      .eq('post_id', id)

    // Delete the forum post
    const { error: deleteError } = await supabase
      .from('forum_posts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting forum post:', deleteError)
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete content' } },
        { status: 500 }
      )
    }

    // Delete the associated exam session if it exists
    if (post.shared_exam_id) {
      const { error: examDeleteError } = await supabase
        .from('exam_sessions')
        .delete()
        .eq('id', post.shared_exam_id)

      if (examDeleteError) {
        console.error('Error deleting exam session:', examDeleteError)
        // Don't fail the request, the main content was deleted
      }
    }

    // Log admin action
    await logAdminAction(user.id, {
      action_type: 'content_deleted',
      target_type: 'forum_post',
      target_id: id,
      details: {
        title: post.title,
        examSessionId: post.shared_exam_id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin content delete error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete content' } },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/content/[id] - Update content visibility
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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
    const { isLibraryVisible } = body

    if (typeof isLibraryVisible !== 'boolean') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'isLibraryVisible must be a boolean' } },
        { status: 400 }
      )
    }

    // Verify this is admin-uploaded content
    const { data: post, error: fetchError } = await supabase
      .from('forum_posts')
      .select('id, is_admin_upload')
      .eq('id', id)
      .single()

    if (fetchError || !post) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Content not found' } },
        { status: 404 }
      )
    }

    if (!post.is_admin_upload) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Can only update admin-uploaded content' } },
        { status: 403 }
      )
    }

    // Update visibility
    const { error: updateError } = await supabase
      .from('forum_posts')
      .update({
        is_library_visible: isLibraryVisible,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating content visibility:', updateError)
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to update content' } },
        { status: 500 }
      )
    }

    // Log admin action
    await logAdminAction(user.id, {
      action_type: 'content_visibility_changed',
      target_type: 'forum_post',
      target_id: id,
      details: {
        isLibraryVisible,
      },
    })

    return NextResponse.json({ success: true, isLibraryVisible })
  } catch (error) {
    console.error('Admin content update error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update content' } },
      { status: 500 }
    )
  }
}
