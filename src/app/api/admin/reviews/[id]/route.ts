import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/admin/queries'
import { logAdminAction } from '@/lib/admin/audit'
import type { AppReview } from '@/lib/reviews/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/admin/reviews/[id] - Toggle featured status
 * Body: { is_featured: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
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

    const body = await request.json()
    const { is_featured } = body

    if (typeof is_featured !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Get current review state
    const { data: currentReview } = await (supabase as any)
      .from('app_reviews')
      .select('is_featured')
      .eq('id', id)
      .single()

    if (!currentReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Update featured status
    const { data: updatedReview, error: updateError } = await (supabase as any)
      .from('app_reviews')
      .update({ is_featured })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Log admin action
    await logAdminAction(user.id, {
      action_type: is_featured ? 'review_featured' : 'review_unfeatured',
      target_type: 'review',
      target_id: id,
      details: {
        previous_featured: currentReview.is_featured,
        new_featured: is_featured,
      },
    })

    return NextResponse.json({
      success: true,
      message: is_featured ? 'Review featured successfully' : 'Review unfeatured successfully',
      review: updatedReview,
    })
  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/reviews/[id] - Delete a review (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
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

    // Get review before deletion for logging
    const { data: review } = await (supabase as any)
      .from('app_reviews')
      .select('user_id, rating, review_text')
      .eq('id', id)
      .single()

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Delete review
    const { error: deleteError } = await (supabase as any)
      .from('app_reviews')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    // Log admin action
    await logAdminAction(user.id, {
      action_type: 'review_deleted',
      target_type: 'review',
      target_id: id,
      details: {
        review_user_id: review.user_id,
        rating: review.rating,
        review_text: review.review_text.substring(0, 100),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}
