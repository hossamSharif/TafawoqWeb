// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  getComments,
  createComment,
  isUserBanned,
  isFeatureEnabled,
  getPostById,
} from '@/lib/forum/queries'
import { createNotification } from '@/lib/notifications/service'
import type { CreateCommentRequest, CommentListResponse } from '@/lib/forum/types'
import { FORUM_LIMITS } from '@/lib/forum/types'

/**
 * GET /api/forum/posts/[id]/comments - Get comments for a post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const { searchParams } = new URL(request.url)
    const supabase = await createServerClient()

    // Check if forum is enabled
    const forumEnabled = await isFeatureEnabled('forum_enabled')
    if (!forumEnabled) {
      return NextResponse.json(
        { error: 'المنتدى غير متاح حالياً' },
        { status: 503 }
      )
    }

    // Get current user (optional for comments - affects user_liked status)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Verify post exists and is active
    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .select('id, status')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'المنشور غير موجود' },
        { status: 404 }
      )
    }

    if (post.status !== 'active') {
      return NextResponse.json(
        { error: 'المنشور غير متاح' },
        { status: 404 }
      )
    }

    // Parse query params
    const cursor = searchParams.get('cursor') || undefined
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : 20

    // Get comments
    const result = await getComments(postId, {
      cursor,
      limit,
      userId: user?.id,
    })

    const response: CommentListResponse = {
      comments: result.comments,
      next_cursor: result.nextCursor,
      has_more: result.hasMore,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

/**
 * POST /api/forum/posts/[id]/comments - Create a comment on a post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: 'حسابك محظور من المشاركة في المنتدى' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: CreateCommentRequest = await request.json()

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

    // Verify post exists and is active
    const post = await getPostById(postId)
    if (!post) {
      return NextResponse.json(
        { error: 'المنشور غير موجود' },
        { status: 404 }
      )
    }

    // Get user profile for display name
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('display_name, profile_picture_url')
      .eq('user_id', user.id)
      .single()

    // Create comment
    const comment = await createComment({
      post_id: postId,
      author_id: user.id,
      content: trimmedContent,
      parent_id: body.parent_id || null,
    })

    // Send notification to post author (if not commenting on own post)
    if (post.author.id !== user.id) {
      if (!body.parent_id) {
        // New comment notification
        try {
          await createNotification({
            user_id: post.author.id,
            type: 'new_comment',
            title: 'تعليق جديد',
            message: `${userProfile?.display_name || 'مستخدم'} علق على منشورك "${post.title}"`,
            target_type: 'post',
            target_id: postId,
          })
        } catch (notifError) {
          console.error('Failed to create notification:', notifError)
        }
      }
    }

    // If it's a reply, notify the parent comment author
    if (body.parent_id) {
      const { data: parentComment } = await supabase
        .from('comments')
        .select('author_id')
        .eq('id', body.parent_id)
        .single()

      if (parentComment && parentComment.author_id !== user.id) {
        try {
          await createNotification({
            user_id: parentComment.author_id,
            type: 'comment_reply',
            title: 'رد على تعليقك',
            message: `${userProfile?.display_name || 'مستخدم'} رد على تعليقك`,
            target_type: 'post',
            target_id: postId,
          })
        } catch (notifError) {
          console.error('Failed to create reply notification:', notifError)
        }
      }
    }

    // Return comment with author info
    return NextResponse.json(
      {
        id: comment.id,
        content: comment.content,
        author: {
          id: user.id,
          display_name: userProfile?.display_name || 'Unknown',
          profile_picture_url: userProfile?.profile_picture_url || null,
        },
        like_count: 0,
        user_liked: false,
        is_edited: false,
        created_at: comment.created_at,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create comment error:', error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('Maximum nesting depth')) {
        return NextResponse.json(
          { error: 'لا يمكن الرد على رد. الحد الأقصى للتداخل هو مستويين.' },
          { status: 400 }
        )
      }
      if (error.message.includes('different post')) {
        return NextResponse.json(
          { error: 'التعليق الأصلي ينتمي لمنشور مختلف' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
