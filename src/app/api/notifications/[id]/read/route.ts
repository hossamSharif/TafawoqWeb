// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { markAsRead } from '@/lib/notifications/service'
import type { MarkReadResponse } from '@/lib/notifications/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/notifications/[id]/read - Mark a notification as read
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: notificationId } = await params
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Mark notification as read
    const notification = await markAsRead(notificationId, user.id)

    const response: MarkReadResponse = {
      id: notification.id,
      is_read: notification.is_read,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Mark notification as read error:', error)

    if (error instanceof Error && error.message.includes('Failed to mark')) {
      return NextResponse.json(
        { error: 'الإشعار غير موجود أو لا تملك صلاحية الوصول إليه' },
        { status: 404 }
      )
    }

    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
