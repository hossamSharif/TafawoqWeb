// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  updateComment,
  deleteComment,
  getCommentInfo,
  isFeatureEnabled,
} from '@/lib/forum/queries'
import type { UpdateCommentRequest } from '@/lib/forum/types'
import { FORUM_LIMITS } from '@/lib/forum/types'

/**
 * PUT /api/forum/comments/[id] - Update a comment (author only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params
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

    // Get comment info
    const commentInfo = await getCommentInfo(commentId)
    if (!commentInfo) {
      return NextResponse.json(
        { error: 'التعليق غير موجود' },
        { status: 404 }
      )
    }

    // Check if user is author
    if (commentInfo.authorId !== user.id) {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single()

      if (!profile?.is_admin) {
        return NextResponse.json(
          { error: 'لا يمكنك تعديل هذا التعليق' },
          { status: 403 }
        )
      }
    }

    // Parse request body
    const body: UpdateCommentRequest = await request.json()

    // Validate content
    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json(
        { error: 'محتوى التعليق مطلوب' },
        { status: 400 }
      )
    }

    const trimmedContent = body.content.trim()
    if (trimmedContent.length === 0) {
      return NextResponse.json(
        { error: 'محتوى التعليق لا يمكن أن يكون فارغاً' },
        { status: 400 }
      )
    }

    if (trimmedContent.length > FORUM_LIMITS.COMMENT_MAX_LENGTH) {
      return NextResponse.json(
        { error: `التعليق يجب أن يكون أقل من ${FORUM_LIMITS.COMMENT_MAX_LENGTH} حرف` },
        { status: 400 }
      )
    }

    // Update comment
    const updatedComment = await updateComment(commentId, {
      content: trimmedContent,
    })

    return NextResponse.json({
      id: updatedComment.id,
      content: updatedComment.content,
      is_edited: updatedComment.is_edited,
      updated_at: updatedComment.updated_at,
    })
  } catch (error) {
    console.error('Update comment error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

/**
 * DELETE /api/forum/comments/[id] - Delete a comment (author or admin)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params
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

    // Get comment info
    const commentInfo = await getCommentInfo(commentId)
    if (!commentInfo) {
      return NextResponse.json(
        { error: 'التعليق غير موجود' },
        { status: 404 }
      )
    }

    // Check if user is author or admin
    let isAdmin = false
    if (commentInfo.authorId !== user.id) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single()

      if (!profile?.is_admin) {
        return NextResponse.json(
          { error: 'لا يمكنك حذف هذا التعليق' },
          { status: 403 }
        )
      }
      isAdmin = true
    }

    // Delete comment (soft delete)
    await deleteComment(commentId)

    // If deleted by admin, could add audit log here
    if (isAdmin) {
      // TODO: Add to admin audit log (Phase 10)
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Delete comment error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
