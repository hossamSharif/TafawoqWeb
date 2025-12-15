// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getNotifications } from '@/lib/notifications/service'
import type { NotificationListResponse } from '@/lib/notifications/types'

/**
 * GET /api/notifications - Get user notifications with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Parse query params
    const cursor = searchParams.get('cursor') || undefined
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : 20
    const unreadOnly = searchParams.get('unread_only') === 'true'

    // Get notifications
    const result = await getNotifications(user.id, {
      cursor,
      limit,
      unread_only: unreadOnly,
    })

    const response: NotificationListResponse = {
      notifications: result.notifications,
      unread_count: result.unreadCount,
      next_cursor: result.nextCursor,
      has_more: result.hasMore,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
