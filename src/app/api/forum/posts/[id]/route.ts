// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  getPostById,
  updatePost,
  deletePost,
  getPostAuthorId,
  isUserBanned,
  isFeatureEnabled,
} from '@/lib/forum/queries'
import type { UpdatePostRequest } from '@/lib/forum/types'
import { FORUM_LIMITS } from '@/lib/forum/types'

/**
 * GET /api/forum/posts/[id] - Get single post with full details
 */
export async function GET(
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

    // Get authenticated user (optional)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Fetch post
    const post = await getPostById(postId, user?.id)

    if (!post) {
      return NextResponse.json(
        { error: 'المنشور غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Get post error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

/**
 * PUT /api/forum/posts/[id] - Update a post (author only)
 */
export async function PUT(
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

    // Verify ownership
    const authorId = await getPostAuthorId(postId)
    if (!authorId) {
      return NextResponse.json(
        { error: 'المنشور غير موجود' },
        { status: 404 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    const isAdmin = profile?.is_admin || false

    if (authorId !== user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية تعديل هذا المنشور' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: UpdatePostRequest = await request.json()

    // Validate title if provided
    if (body.title !== undefined) {
      if (!body.title || body.title.trim().length === 0) {
        return NextResponse.json(
          { error: 'العنوان مطلوب' },
          { status: 400 }
        )
      }
      if (body.title.length > FORUM_LIMITS.TITLE_MAX_LENGTH) {
        return NextResponse.json(
          { error: `العنوان يجب ألا يتجاوز ${FORUM_LIMITS.TITLE_MAX_LENGTH} حرف` },
          { status: 400 }
        )
      }
    }

    // Validate body if provided
    if (body.body !== undefined && body.body && body.body.length > FORUM_LIMITS.BODY_MAX_LENGTH) {
      return NextResponse.json(
        { error: `الوصف يجب ألا يتجاوز ${FORUM_LIMITS.BODY_MAX_LENGTH} حرف` },
        { status: 400 }
      )
    }

    // Update post
    await updatePost(postId, {
      title: body.title?.trim(),
      body: body.body?.trim(),
    })

    // Get full post details for response
    const post = await getPostById(postId, user.id)

    return NextResponse.json(post)
  } catch (error) {
    console.error('Update post error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

/**
 * DELETE /api/forum/posts/[id] - Delete a post (author or admin)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Verify ownership
    const authorId = await getPostAuthorId(postId)
    if (!authorId) {
      return NextResponse.json(
        { error: 'المنشور غير موجود' },
        { status: 404 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    const isAdmin = profile?.is_admin || false

    if (authorId !== user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية حذف هذا المنشور' },
        { status: 403 }
      )
    }

    // Soft delete post
    await deletePost(postId)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
