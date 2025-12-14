// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  addReaction,
  removeReaction,
  getCommentLikeStatus,
  getCommentInfo,
  isUserBanned,
  isFeatureEnabled,
} from '@/lib/forum/queries'
import type { CommentLikeResponse } from '@/lib/forum/types'

/**
 * POST /api/forum/comments/[id]/like - Like a comment
 */
export async function POST(
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

    // Check if user is banned
    const banned = await isUserBanned(user.id)
    if (banned) {
      return NextResponse.json(
        { error: 'حسابك محظور من المشاركة في المنتدى' },
        { status: 403 }
      )
    }

    // Verify comment exists
    const commentInfo = await getCommentInfo(commentId)
    if (!commentInfo) {
      return NextResponse.json(
        { error: 'التعليق غير موجود' },
        { status: 404 }
      )
    }

    // Verify comment is active
    const { data: comment } = await supabase
      .from('comments')
      .select('status')
      .eq('id', commentId)
      .single()

    if (comment?.status !== 'active') {
      return NextResponse.json(
        { error: 'لا يمكن الإعجاب بتعليق محذوف' },
        { status: 400 }
      )
    }

    // Add like reaction
    await addReaction({
      user_id: user.id,
      target_type: 'comment',
      target_id: commentId,
      reaction_type: 'like',
    })

    // Get updated status
    const likeStatus = await getCommentLikeStatus(commentId, user.id)

    const response: CommentLikeResponse = {
      like_count: likeStatus.like_count,
      user_liked: likeStatus.user_liked,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Like comment error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

/**
 * DELETE /api/forum/comments/[id]/like - Unlike a comment
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

    // Verify comment exists
    const commentInfo = await getCommentInfo(commentId)
    if (!commentInfo) {
      return NextResponse.json(
        { error: 'التعليق غير موجود' },
        { status: 404 }
      )
    }

    // Remove like reaction
    await removeReaction(user.id, 'comment', commentId, 'like')

    // Get updated status
    const likeStatus = await getCommentLikeStatus(commentId, user.id)

    const response: CommentLikeResponse = {
      like_count: likeStatus.like_count,
      user_liked: likeStatus.user_liked,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Unlike comment error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
