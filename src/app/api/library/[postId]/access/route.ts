// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { grantLibraryAccess } from '@/lib/library/actions'

interface RouteParams {
  params: Promise<{ postId: string }>
}

/**
 * POST /api/library/[postId]/access - Request access to a library exam
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerClient()
    const { postId } = await params

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Verify the post exists and is library visible
    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .select('id, is_library_visible, post_type')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'الاختبار غير موجود' },
        { status: 404 }
      )
    }

    if (!post.is_library_visible || post.post_type !== 'exam_share') {
      return NextResponse.json(
        { error: 'هذا المحتوى غير متاح في المكتبة' },
        { status: 404 }
      )
    }

    // Grant access
    const result = await grantLibraryAccess(user.id, postId)

    // Check if access was denied
    if ('error' in result) {
      return NextResponse.json(result, { status: 403 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Library access error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
