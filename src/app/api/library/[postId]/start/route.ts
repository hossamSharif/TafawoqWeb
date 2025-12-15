// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { startLibraryExam } from '@/lib/library/actions'

interface RouteParams {
  params: Promise<{ postId: string }>
}

/**
 * POST /api/library/[postId]/start - Start a library exam (requires prior access)
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

    // Verify user has access to this library exam
    const { data: access, error: accessError } = await supabase
      .from('library_access')
      .select('id, exam_completed')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .maybeSingle()

    if (accessError || !access) {
      return NextResponse.json(
        { error: 'ليس لديك وصول لهذا الاختبار' },
        { status: 403 }
      )
    }

    // Check if already completed
    if (access.exam_completed) {
      return NextResponse.json(
        { error: 'لقد أكملت هذا الاختبار من قبل' },
        { status: 409 }
      )
    }

    // Start the exam
    const result = await startLibraryExam(user.id, postId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Library exam start error:', error)

    if (error instanceof Error && error.message === 'No access to this library exam') {
      return NextResponse.json(
        { error: 'ليس لديك وصول لهذا الاختبار' },
        { status: 403 }
      )
    }

    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
