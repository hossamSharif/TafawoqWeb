import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface NotificationPreferencesUpdate {
  rewardNotifications?: boolean
  forumNotifications?: boolean
  examCompletionNotifications?: boolean
}

/**
 * PATCH /api/profile/notifications - Update notification preferences
 */
export async function PATCH(request: NextRequest) {
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

    const body: NotificationPreferencesUpdate = await request.json()

    // Build update object with only the fields that were provided
    const updateData: Record<string, boolean> = {}

    if (typeof body.rewardNotifications === 'boolean') {
      updateData.reward_notifications_enabled = body.rewardNotifications
    }
    if (typeof body.forumNotifications === 'boolean') {
      updateData.forum_email_enabled = body.forumNotifications
    }
    if (typeof body.examCompletionNotifications === 'boolean') {
      updateData.exam_completion_notifications_enabled = body.examCompletionNotifications
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 })
    }

    // Update user profile
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', user.id)

    if (updateError) {
      console.error('Update notification preferences error:', updateError)
      return NextResponse.json({ error: 'خطأ في تحديث التفضيلات' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      updated: updateData,
    })
  } catch (error) {
    console.error('Notification preferences update error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

/**
 * GET /api/profile/notifications - Get notification preferences
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

    // Fetch user profile with notification preferences
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('reward_notifications_enabled, forum_email_enabled, exam_completion_notifications_enabled')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Fetch notification preferences error:', profileError)
      return NextResponse.json({ error: 'خطأ في استرجاع التفضيلات' }, { status: 500 })
    }

    return NextResponse.json({
      rewardNotifications: profile?.reward_notifications_enabled ?? true,
      forumNotifications: profile?.forum_email_enabled ?? true,
      examCompletionNotifications: profile?.exam_completion_notifications_enabled ?? true,
    })
  } catch (error) {
    console.error('Get notification preferences error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
