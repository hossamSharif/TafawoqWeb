// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { markAllAsRead } from '@/lib/notifications/service'
import type { MarkAllReadResponse } from '@/lib/notifications/types'

/**
 * POST /api/notifications/read-all - Mark all notifications as read
 */
export async function POST() {
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

    // Mark all as read
    const updatedCount = await markAllAsRead(user.id)

    const response: MarkAllReadResponse = {
      updated_count: updatedCount,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Mark all notifications as read error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
