// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  getPosts,
  createPost,
  isUserBanned,
  isFeatureEnabled,
  hasUserSharedExam,
  hasUserSharedPractice,
} from '@/lib/forum/queries'
import type {
  CreatePostRequest,
  PostListParams,
  ForumPostInsert,
} from '@/lib/forum/types'
import { FORUM_LIMITS } from '@/lib/forum/types'

/**
 * GET /api/forum/posts - List forum posts with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check if forum is enabled
    const forumEnabled = await isFeatureEnabled('forum_enabled')
    if (!forumEnabled) {
      return NextResponse.json(
        { error: 'المنتدى غير متاح حالياً' },
        { status: 503 }
      )
    }

    // Get authenticated user (optional for viewing)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const params: PostListParams = {
      cursor: searchParams.get('cursor') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      sort: (searchParams.get('sort') as PostListParams['sort']) || 'newest',
      type: (searchParams.get('type') as PostListParams['type']) || undefined,
      search: searchParams.get('search') || undefined,
    }

    // Validate limit
    if (params.limit && params.limit > FORUM_LIMITS.MAX_PAGE_SIZE) {
      params.limit = FORUM_LIMITS.MAX_PAGE_SIZE
    }

    // Fetch posts
    const result = await getPosts({
      ...params,
      userId: user?.id,
    })

    return NextResponse.json({
      posts: result.posts,
      next_cursor: result.nextCursor,
      has_more: result.hasMore,
    })
  } catch (error) {
    console.error('Forum posts list error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

/**
 * POST /api/forum/posts - Create a new forum post (text or exam share)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check if forum is enabled
    const forumEnabled = await isFeatureEnabled('forum_enabled')
    if (!forumEnabled) {
      return NextResponse.json(
        { error: 'المنتدى غير متاح حالياً' },
        { status: 503 }
      )
    }

    // Check if posting is enabled
    const postingEnabled = await isFeatureEnabled('forum_posting_enabled')
    if (!postingEnabled) {
      return NextResponse.json(
        { error: 'المشاركة في المنتدى غير متاحة حالياً' },
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
    const body: CreatePostRequest = await request.json()

    // Validate post_type
    if (!body.post_type || !['text', 'exam_share'].includes(body.post_type)) {
      return NextResponse.json(
        { error: 'نوع المنشور غير صالح' },
        { status: 400 }
      )
    }

    // Validate title
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

    // Validate body length if provided
    if (body.body && body.body.length > FORUM_LIMITS.BODY_MAX_LENGTH) {
      return NextResponse.json(
        { error: `الوصف يجب ألا يتجاوز ${FORUM_LIMITS.BODY_MAX_LENGTH} حرف` },
        { status: 400 }
      )
    }

    // Handle exam share posts
    if (body.post_type === 'exam_share') {
      // Check if sharing is enabled
      const sharingEnabled = await isFeatureEnabled('forum_sharing_enabled')
      if (!sharingEnabled) {
        return NextResponse.json(
          { error: 'مشاركة الاختبارات غير متاحة حالياً' },
          { status: 503 }
        )
      }

      // Must have either exam or practice session
      if (!body.shared_exam_id && !body.shared_practice_id) {
        return NextResponse.json(
          { error: 'يجب تحديد اختبار أو تدريب للمشاركة' },
          { status: 400 }
        )
      }

      // Can't have both
      if (body.shared_exam_id && body.shared_practice_id) {
        return NextResponse.json(
          { error: 'لا يمكن مشاركة اختبار وتدريب معاً' },
          { status: 400 }
        )
      }

      // Validate exam session if sharing exam
      if (body.shared_exam_id) {
        // Check if already shared
        const alreadyShared = await hasUserSharedExam(user.id, body.shared_exam_id)
        if (alreadyShared) {
          return NextResponse.json(
            { error: 'لقد قمت بمشاركة هذا الاختبار من قبل' },
            { status: 409 }
          )
        }

        // Verify the exam exists and belongs to user
        const { data: examSession, error: examError } = await supabase
          .from('exam_sessions')
          .select('id, user_id, status')
          .eq('id', body.shared_exam_id)
          .single()

        if (examError || !examSession) {
          return NextResponse.json(
            { error: 'الاختبار غير موجود' },
            { status: 404 }
          )
        }

        if (examSession.user_id !== user.id) {
          return NextResponse.json(
            { error: 'لا يمكنك مشاركة اختبار لا يخصك' },
            { status: 403 }
          )
        }

        if (examSession.status !== 'completed') {
          return NextResponse.json(
            { error: 'يمكنك فقط مشاركة الاختبارات المكتملة' },
            { status: 400 }
          )
        }
      }

      // Validate practice session if sharing practice
      if (body.shared_practice_id) {
        // Check if already shared
        const alreadyShared = await hasUserSharedPractice(user.id, body.shared_practice_id)
        if (alreadyShared) {
          return NextResponse.json(
            { error: 'لقد قمت بمشاركة هذا التدريب من قبل' },
            { status: 409 }
          )
        }

        // Verify the practice exists and belongs to user
        const { data: practiceSession, error: practiceError } = await supabase
          .from('practice_sessions')
          .select('id, user_id, status')
          .eq('id', body.shared_practice_id)
          .single()

        if (practiceError || !practiceSession) {
          return NextResponse.json(
            { error: 'التدريب غير موجود' },
            { status: 404 }
          )
        }

        if (practiceSession.user_id !== user.id) {
          return NextResponse.json(
            { error: 'لا يمكنك مشاركة تدريب لا يخصك' },
            { status: 403 }
          )
        }

        if (practiceSession.status !== 'completed') {
          return NextResponse.json(
            { error: 'يمكنك فقط مشاركة التدريبات المكتملة' },
            { status: 400 }
          )
        }
      }
    }

    // For text posts, body is required
    if (body.post_type === 'text' && (!body.body || body.body.trim().length === 0)) {
      return NextResponse.json(
        { error: 'محتوى المنشور مطلوب للمنشورات النصية' },
        { status: 400 }
      )
    }

    // Create the post
    const postData: ForumPostInsert = {
      author_id: user.id,
      post_type: body.post_type,
      title: body.title.trim(),
      body: body.body?.trim() || null,
      shared_exam_id: body.shared_exam_id || null,
      shared_practice_id: body.shared_practice_id || null,
    }

    const post = await createPost(postData)

    // Get author info for response
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, profile_picture_url')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json(
      {
        id: post.id,
        post_type: post.post_type,
        title: post.title,
        body: post.body,
        author: {
          id: profile?.user_id || user.id,
          display_name: profile?.display_name || 'مستخدم',
          profile_picture_url: profile?.profile_picture_url || null,
        },
        like_count: 0,
        love_count: 0,
        comment_count: 0,
        completion_count: 0,
        user_reaction: { like: false, love: false },
        is_edited: false,
        created_at: post.created_at,
        updated_at: post.updated_at,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Forum post creation error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
