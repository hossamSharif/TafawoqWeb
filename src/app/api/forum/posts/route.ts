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
import { TIER_LIMITS } from '@/types/subscription'
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'
import { validatePracticeSessionCompleteness } from '@/lib/forum/validation'

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

    // Parse request body to determine post type for rate limiting
    const body: CreatePostRequest = await request.json()

    // Rate limiting based on post type
    const rateLimitConfig =
      body.post_type === 'exam_share'
        ? RATE_LIMIT_CONFIGS.FORUM_SHARE_CREATE
        : RATE_LIMIT_CONFIGS.FORUM_POST_CREATE

    const rateLimitResult = checkRateLimit(`forum_post:${user.id}`, rateLimitConfig)

    if (!rateLimitResult.allowed) {
      const minutesRemaining = Math.ceil(
        (rateLimitResult.resetAt - Date.now()) / 60000
      )

      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: rateLimitConfig.message,
          retry_after_minutes: minutesRemaining,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(
              Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
            ),
            'X-RateLimit-Limit': String(rateLimitConfig.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.floor(rateLimitResult.resetAt / 1000)),
          },
        }
      )
    }

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

      // Validate exam session if sharing exam (parallelized)
      if (body.shared_exam_id) {
        // Parallel validation: check if already shared + verify exam exists
        const [alreadyShared, examResult] = await Promise.all([
          hasUserSharedExam(user.id, body.shared_exam_id),
          supabase
            .from('exam_sessions')
            .select('id, user_id, status, shared_from_post_id, is_library_exam')
            .eq('id', body.shared_exam_id)
            .single()
        ])

        if (alreadyShared) {
          return NextResponse.json(
            { error: 'لقد قمت بمشاركة هذا الاختبار من قبل' },
            { status: 409 }
          )
        }

        const { data: examSession, error: examError } = examResult

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

        // Validate that this is a self-generated exam (not from library or forum)
        if (examSession.shared_from_post_id !== null) {
          return NextResponse.json(
            {
              error: 'لا يمكنك مشاركة اختبارات المكتبة أو المنتدى. يمكنك فقط مشاركة الاختبارات التي أنشأتها بنفسك',
              code: 'CANNOT_SHARE_LIBRARY_OR_FORUM_EXAM'
            },
            { status: 403 }
          )
        }
      }

      // Validate practice session if sharing practice (parallelized)
      if (body.shared_practice_id) {
        // Parallel validation: check if already shared + verify practice exists
        const [alreadyShared, practiceResult] = await Promise.all([
          hasUserSharedPractice(user.id, body.shared_practice_id),
          supabase
            .from('practice_sessions')
            .select('id, user_id, status, questions, shared_from_post_id')
            .eq('id', body.shared_practice_id)
            .single()
        ])

        if (alreadyShared) {
          return NextResponse.json(
            { error: 'لقد قمت بمشاركة هذا التدريب من قبل' },
            { status: 409 }
          )
        }

        const { data: practiceSession, error: practiceError } = practiceResult

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

        // Validate that this is a self-generated practice (not from forum)
        if (practiceSession.shared_from_post_id !== null) {
          return NextResponse.json(
            {
              error: 'لا يمكنك مشاركة تدريبات المنتدى. يمكنك فقط مشاركة التدريبات التي أنشأتها بنفسك',
              code: 'CANNOT_SHARE_FORUM_PRACTICE'
            },
            { status: 403 }
          )
        }

        // Validate practice completeness (minimum answered questions)
        const validationResult = validatePracticeSessionCompleteness(practiceSession)
        if (!validationResult.isValid) {
          return NextResponse.json(
            {
              error: 'INSUFFICIENT_PRACTICE_COMPLETION',
              message: 'يجب الإجابة على 3 أسئلة على الأقل قبل المشاركة',
              details: validationResult.reason,
              answered_count: validationResult.answeredCount,
              total_questions: validationResult.totalQuestions,
            },
            { status: 400 }
          )
        }
      }

      // Check and reset monthly credits if needed
      const { data: resetResult } = await supabase.rpc('check_and_reset_monthly_credits', {
        p_user_id: user.id
      })

      if (resetResult?.reset_performed) {
        console.log('Monthly credits reset for user:', user.id, {
          tier: resetResult.tier,
          exam_credits: resetResult.exam_credits,
          practice_credits: resetResult.practice_credits
        })
      }

      // Check share credits based on subscription tier
      // Get user's subscription tier and share credits
      const [subscriptionResult, creditsResult] = await Promise.all([
        supabase
          .from('user_subscriptions')
          .select('tier, status')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('user_credits')
          .select('share_credits_exam, share_credits_practice')
          .eq('user_id', user.id)
          .single(),
      ])

      const isPremium = subscriptionResult.data?.tier === 'premium' &&
                        ['active', 'trialing'].includes(subscriptionResult.data?.status || '')
      const tier = isPremium ? 'premium' : 'free'
      const limits = TIER_LIMITS[tier]

      // Get remaining share credits (default to tier limits if not set)
      const examSharesRemaining = creditsResult.data?.share_credits_exam ?? limits.examSharesPerMonth
      const practiceSharesRemaining = creditsResult.data?.share_credits_practice ?? limits.practiceSharesPerMonth

      // Check if user has share credits for exam
      if (body.shared_exam_id && examSharesRemaining <= 0) {
        return NextResponse.json(
          {
            error: 'لقد وصلت للحد الأقصى من مشاركات الاختبارات هذا الشهر',
            code: 'SHARE_LIMIT_REACHED',
            tier,
          },
          { status: 403 }
        )
      }

      // Check if user has share credits for practice
      if (body.shared_practice_id && practiceSharesRemaining <= 0) {
        return NextResponse.json(
          {
            error: 'لقد وصلت للحد الأقصى من مشاركات التدريبات هذا الشهر',
            code: 'SHARE_LIMIT_REACHED',
            tier,
          },
          { status: 403 }
        )
      }
    }

    // For text posts, body is required
    if (body.post_type === 'text' && (!body.body || body.body.trim().length === 0)) {
      return NextResponse.json(
        { error: 'محتوى المنشور مطلوب للمنشورات النصية' },
        { status: 400 }
      )
    }

    // For exam/practice shares: Decrement credits BEFORE creating post (transaction safety)
    let creditResult: any = null
    if (body.post_type === 'exam_share') {
      const creditType = body.shared_exam_id ? 'exam' : 'practice'

      // FIRST: Attempt to decrement credit atomically
      const { data, error: creditError } = await supabase.rpc('decrement_share_credit', {
        p_user_id: user.id,
        p_credit_type: creditType,
      })

      if (creditError) {
        console.error('Credit deduction error:', creditError)
        return NextResponse.json(
          {
            error: creditError.message.includes('Insufficient')
              ? 'SHARE_LIMIT_REACHED'
              : 'CREDIT_DEDUCTION_FAILED',
            message: creditError.message.includes('Insufficient')
              ? 'لقد استنفدت رصيد المشاركات الشهري'
              : 'فشل في خصم الرصيد',
            code: creditError.code,
          },
          { status: creditError.message.includes('Insufficient') ? 403 : 500 }
        )
      }

      creditResult = data
    }

    // SECOND: Credits successfully deducted (or not needed for text posts), now create post
    let post: any
    try {
      const postData: ForumPostInsert = {
        author_id: user.id,
        post_type: body.post_type,
        title: body.title.trim(),
        body: body.body?.trim() || null,
        shared_exam_id: body.shared_exam_id || null,
        shared_practice_id: body.shared_practice_id || null,
      }

      post = await createPost(postData)
    } catch (postError) {
      console.error('Post creation error after credit deduction:', postError)

      // ROLLBACK: Credit was deducted but post creation failed
      // Restore the credit (best effort)
      if (body.post_type === 'exam_share') {
        const creditType = body.shared_exam_id ? 'exam' : 'practice'
        await supabase
          .rpc('increment_share_credit', {
            p_user_id: user.id,
            p_credit_type: creditType,
          })
          .then(({ error }) => {
            if (error) {
              console.error('CRITICAL: Failed to rollback credit', {
                user_id: user.id,
                credit_type: creditType,
                error,
              })
            } else {
              console.log('Credit rollback successful for user:', user.id)
            }
          })
      }

      return NextResponse.json({ error: 'خطأ في إنشاء المنشور' }, { status: 500 })
    }

    // THIRD: Set library visibility if needed (non-critical, errors logged but don't fail)
    if (body.shared_exam_id && body.is_library_visible) {
      await supabase
        .from('forum_posts')
        .update({ is_library_visible: true })
        .eq('id', post.id)
        .then(({ error }) => {
          if (error) {
            console.error('Library visibility update failed:', error)
          }
        })
    }

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
        shared_exam_id: post.shared_exam_id,
        shared_practice_id: post.shared_practice_id,
        is_library_visible: post.is_library_visible,
        like_count: 0,
        love_count: 0,
        comment_count: 0,
        completion_count: 0,
        user_reaction: { like: false, love: false },
        is_edited: false,
        created_at: post.created_at,
        updated_at: post.updated_at,
        // Include remaining credits if this was a share
        ...(creditResult && { credits_remaining: creditResult.remaining_credits }),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Forum post creation error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
