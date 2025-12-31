import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { validateReview } from '@/lib/reviews/validation'
import { sendAdminReviewNotification } from '@/lib/reviews/email'
import type { AppReviewWithUser, PublicReviewsResponse } from '@/lib/reviews/types'

// Simple in-memory rate limiting (for production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string): { allowed: boolean; resetAt: number } {
  const now = Date.now()
  const limit = rateLimitStore.get(key)

  if (!limit || now > limit.resetAt) {
    // Reset or create new limit
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + 60 * 60 * 1000, // 1 hour
    })
    return { allowed: true, resetAt: now + 60 * 60 * 1000 }
  }

  if (limit.count >= 5) {
    return { allowed: false, resetAt: limit.resetAt }
  }

  limit.count++
  return { allowed: true, resetAt: limit.resetAt }
}

/**
 * GET /api/reviews - Get all reviews (paginated)
 * Query params:
 *   - cursor: Pagination cursor
 *   - limit: Results per page (default 20, max 50)
 *   - sort: 'recent' | 'rating' | 'helpful' (default 'recent')
 *   - featured_only: 'true' | 'false' (default 'false')
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams

    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const sort = searchParams.get('sort') || 'recent'
    const featuredOnly = searchParams.get('featured_only') === 'true'

    // Get current user (if authenticated)
    const { data: { user } } = await supabase.auth.getUser()
    let userReview: AppReviewWithUser | null = null

    // Build query
    let query = (supabase as any)
      .from('app_reviews')
      .select(`
        *,
        user:user_profiles!app_reviews_user_profile_fkey(
          user_id,
          display_name,
          profile_picture_url
        )
      `)

    // Apply featured filter
    if (featuredOnly) {
      query = query.eq('is_featured', true)
    }

    // Apply sorting
    switch (sort) {
      case 'rating':
        query = query.order('rating', { ascending: false })
        query = query.order('created_at', { ascending: false })
        break
      case 'helpful':
        query = query.order('helpful_count', { ascending: false })
        query = query.order('created_at', { ascending: false })
        break
      default: // 'recent'
        query = query.order('created_at', { ascending: false })
    }

    // Apply cursor pagination
    if (cursor) {
      const { data: cursorReview } = await (supabase as any)
        .from('app_reviews')
        .select('created_at')
        .eq('id', cursor)
        .single()

      if (cursorReview) {
        query = query.lt('created_at', cursorReview.created_at)
      }
    }

    // Fetch one extra to check if there are more
    query = query.limit(limit + 1)

    const { data: reviews, error } = await query

    if (error) {
      throw error
    }

    const hasMore = reviews && reviews.length > limit
    const paginatedReviews = reviews?.slice(0, limit) || []
    const nextCursor = hasMore && paginatedReviews.length > 0
      ? paginatedReviews[paginatedReviews.length - 1].id
      : null

    // Transform reviews to match expected type
    const transformedReviews = paginatedReviews.map((review: any) => ({
      ...review,
      user: {
        id: review.user.user_id,
        display_name: review.user.display_name,
        profile_picture_url: review.user.profile_picture_url,
      },
    }))

    // Get review stats
    const { data: stats } = await supabase.rpc('get_review_stats')
    const reviewStats = stats?.[0] || {
      total_reviews: 0,
      average_rating: 0,
      rating_distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
    }

    // Get user's own review if authenticated
    if (user) {
      const { data: ownReview } = await (supabase as any)
        .from('app_reviews')
        .select(`
          *,
          user:user_profiles!app_reviews_user_profile_fkey(
            user_id,
            display_name,
            profile_picture_url
          )
        `)
        .eq('user_id', user.id)
        .single()

      if (ownReview) {
        userReview = {
          ...ownReview,
          user: {
            id: ownReview.user.user_id,
            display_name: ownReview.user.display_name,
            profile_picture_url: ownReview.user.profile_picture_url,
          },
        }
      }
    }

    const response: PublicReviewsResponse = {
      reviews: transformedReviews,
      stats: reviewStats,
      nextCursor,
      hasMore,
      userReview,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'فشل في تحميل المراجعات' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reviews - Create or update a review
 * Body: { rating: number, review_text: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول لإضافة مراجعة' },
        { status: 401 }
      )
    }

    // Rate limiting
    const rateLimitResult = checkRateLimit(`review:${user.id}`)
    if (!rateLimitResult.allowed) {
      const minutesRemaining = Math.ceil(
        (rateLimitResult.resetAt - Date.now()) / 60000
      )
      return NextResponse.json(
        {
          error: `لقد تجاوزت الحد الأقصى لإضافة المراجعات. يرجى المحاولة بعد ${minutesRemaining} دقيقة`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
          },
        }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = validateReview(body)

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0]
      return NextResponse.json(
        { error: firstError },
        { status: 400 }
      )
    }

    // Check if user already has a review
    const { data: existingReview } = await (supabase as any)
      .from('app_reviews')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingReview) {
      // Update existing review
      const { data: updatedReview, error: updateError } = await (supabase as any)
        .from('app_reviews')
        .update({
          rating: body.rating,
          review_text: body.review_text.trim(),
        })
        .eq('user_id', user.id)
        .select(`
          *,
          user:user_profiles!app_reviews_user_profile_fkey(
            user_id,
            display_name,
            profile_picture_url
          )
        `)
        .single()

      if (updateError) {
        throw updateError
      }

      const transformedReview = {
        ...updatedReview,
        user: {
          id: updatedReview.user.user_id,
          display_name: updatedReview.user.display_name,
          profile_picture_url: updatedReview.user.profile_picture_url,
        },
      }

      return NextResponse.json({
        success: true,
        message: 'تم تحديث مراجعتك بنجاح',
        review: transformedReview,
      })
    } else {
      // Create new review
      const { data: newReview, error: insertError } = await (supabase as any)
        .from('app_reviews')
        .insert({
          user_id: user.id,
          rating: body.rating,
          review_text: body.review_text.trim(),
        })
        .select(`
          *,
          user:user_profiles!app_reviews_user_profile_fkey(
            user_id,
            display_name,
            profile_picture_url,
            email
          )
        `)
        .single()

      if (insertError) {
        throw insertError
      }

      const transformedReview = {
        ...newReview,
        user: {
          id: newReview.user.user_id,
          display_name: newReview.user.display_name,
          profile_picture_url: newReview.user.profile_picture_url,
          email: newReview.user.email,
        },
      }

      // Send email notification to admin (async, non-blocking)
      sendAdminReviewNotification(transformedReview).catch((error) => {
        console.error('Failed to send email notification:', error)
      })

      return NextResponse.json({
        success: true,
        message: 'تم إضافة مراجعتك بنجاح. شكراً لتقييمك!',
        review: transformedReview,
      }, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating/updating review:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حفظ المراجعة' },
      { status: 500 }
    )
  }
}
