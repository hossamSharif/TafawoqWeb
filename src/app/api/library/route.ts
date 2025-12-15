import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getLibraryExams, getUserLibraryAccess } from '@/lib/library/queries'
import type { LibraryFilters } from '@/types/library'

/**
 * GET /api/library - List library exams with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const filters: LibraryFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 50),
      sort: (searchParams.get('sort') as 'popular' | 'recent') || 'popular',
      section: searchParams.get('section') as 'verbal' | 'quantitative' | undefined,
    }

    // Fetch library exams
    const result = await getLibraryExams(user.id, filters)

    return NextResponse.json({
      exams: result.exams,
      pagination: result.pagination,
      userAccess: result.userAccess,
    })
  } catch (error) {
    console.error('Library list error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
