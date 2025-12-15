import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getLibraryExamById, getUserLibraryAccess } from '@/lib/library/queries'

interface RouteParams {
  params: Promise<{ postId: string }>
}

/**
 * GET /api/library/[postId] - Get library exam details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Fetch exam details
    const exam = await getLibraryExamById(postId, user.id)

    if (!exam) {
      return NextResponse.json(
        { error: 'الاختبار غير موجود في المكتبة' },
        { status: 404 }
      )
    }

    // Get user access info
    const userAccess = await getUserLibraryAccess(user.id)

    return NextResponse.json({
      exam,
      userAccess,
    })
  } catch (error) {
    console.error('Library exam detail error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
