import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * DELETE /api/reviews/[id] - Delete a review
 * User can delete their own review, admin can delete any
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    // Get review to check ownership
    const { data: review } = await (supabase as any)
      .from('app_reviews')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!review) {
      return NextResponse.json(
        { error: 'المراجعة غير موجودة' },
        { status: 404 }
      )
    }

    // Check if user is admin
    const { data: profile } = await (supabase as any)
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    const isAdmin = profile?.is_admin || false

    // Verify ownership or admin
    if (review.user_id !== user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'غير مصرح لك بحذف هذه المراجعة' },
        { status: 403 }
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

    return NextResponse.json({
      success: true,
      message: 'تم حذف المراجعة بنجاح',
    })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف المراجعة' },
      { status: 500 }
    )
  }
}
