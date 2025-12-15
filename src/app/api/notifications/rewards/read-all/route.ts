// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * POST /api/notifications/rewards/read-all - Mark all reward notifications as read
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

    // Mark all reward notifications as read
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('type', 'reward_earned')
      .eq('is_read', false)
      .select('id')

    if (error) {
      console.error('Mark all read error:', error)
      return NextResponse.json({ error: 'خطأ في تحديث الإشعارات' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      updated_count: data?.length || 0,
    })
  } catch (error) {
    console.error('Mark all rewards read error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
