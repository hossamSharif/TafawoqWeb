import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAdminAccess, getModerationQueue } from '@/lib/admin/queries'
import type { ReportStatus } from '@/lib/admin/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Verify admin access
    try {
      await verifyAdminAccess(user.id)
    } catch {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const cursor = searchParams.get('cursor') || undefined
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const status = (searchParams.get('status') as ReportStatus) || 'pending'

    // Get moderation queue
    const result = await getModerationQueue({
      cursor,
      limit,
      status,
    })

    return NextResponse.json({
      reports: result.reports,
      next_cursor: result.nextCursor,
      has_more: result.hasMore,
    })
  } catch (error) {
    console.error('Moderation API error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch moderation queue' } },
      { status: 500 }
    )
  }
}
