// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getUnreadCount } from '@/lib/notifications/service'
import type { NotificationCountResponse } from '@/lib/notifications/types'

/**
 * GET /api/notifications/count - Get unread notification count
 */
export async function GET() {
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

    const unreadCount = await getUnreadCount(user.id)

    const response: NotificationCountResponse = {
      unread_count: unreadCount,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get notification count error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
