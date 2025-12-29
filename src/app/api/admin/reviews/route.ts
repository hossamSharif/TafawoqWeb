import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/admin/queries'
import type { AdminReviewsResponse } from '@/lib/reviews/types'

/**
 * GET /api/admin/reviews - Get all reviews for admin dashboard
 * Query params:
 *   - cursor: Pagination cursor
 *   - limit: Results per page (default 20, max 50)
 *   - sort: 'recent' | 'rating' | 'helpful' (default 'recent')
 *   - filter: 'all' | 'featured' | 'not_featured' (default 'all')
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await verifyAdminAccess(user.id)

    const searchParams = request.nextUrl.searchParams
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const sort = searchParams.get('sort') || 'recent'
    const filter = searchParams.get('filter') || 'all'

    // Build query
    let query = supabase
      .from('app_reviews')
      .select(`
        *,
        user:user_profiles!app_reviews_user_profile_fkey(
          user_id,
          display_name,
          profile_picture_url,
          email
        )
      `)

    // Apply filter
    if (filter === 'featured') {
      query = query.eq('is_featured', true)
    } else if (filter === 'not_featured') {
      query = query.eq('is_featured', false)
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
      const { data: cursorReview } = await supabase
        .from('app_reviews')
        .select('created_at')
        .eq('id', cursor)
        .single()

      if (cursorReview) {
        query = query.lt('created_at', cursorReview.created_at)
      }
    }

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
        email: review.user.email,
      },
    }))

    // Get review stats
    const { data: stats } = await supabase.rpc('get_review_stats')
    const reviewStats = stats?.[0] || {
      total_reviews: 0,
      average_rating: 0,
      rating_distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
    }

    const response: AdminReviewsResponse = {
      reviews: transformedReviews,
      stats: reviewStats,
      nextCursor,
      hasMore,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching admin reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
