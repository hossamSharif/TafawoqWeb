import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAdminAccess, getAnalytics } from '@/lib/admin/queries'

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

    // Parse time range
    const searchParams = request.nextUrl.searchParams
    const range = searchParams.get('range') as 'week' | 'month' | 'year' || 'week'

    // Get analytics data
    const analytics = await getAnalytics(range)

    // Get summary totals
    const [usersCount, examsCount, postsCount, commentsCount] = await Promise.all([
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('exam_sessions').select('*', { count: 'exact', head: true }),
      supabase.from('forum_posts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    ])

    return NextResponse.json({
      userGrowth: analytics.userGrowth,
      examActivity: analytics.examActivity,
      forumActivity: analytics.forumActivity,
      summary: {
        totalUsers: usersCount.count || 0,
        totalExams: examsCount.count || 0,
        totalPosts: postsCount.count || 0,
        totalComments: commentsCount.count || 0,
      },
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch analytics' } },
      { status: 500 }
    )
  }
}
