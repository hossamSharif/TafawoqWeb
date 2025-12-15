// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { RewardNotification } from '@/types/rewards'

interface RewardNotificationRow {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  target_type: string | null
  target_id: string | null
  is_read: boolean
  created_at: string
  metadata?: {
    credit_type?: string
    amount?: number
    source_content_type?: string
    completer_id?: string
    content_type?: string
  }
}

interface RewardSummaryResponse {
  unreadCount: number
  totalCreditsEarned: number
  latestRewardTitle: string | null
}

interface RewardNotificationsResponse {
  notifications: RewardNotification[]
  unreadCount: number
  nextCursor: string | null
  hasMore: boolean
}

/**
 * GET /api/notifications/rewards - Get reward notifications
 *
 * Query params:
 * - summary=true: Return only summary stats (unread count, total credits)
 * - cursor: Pagination cursor
 * - limit: Number of notifications to return (default 20, max 50)
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

    // Check if requesting summary only
    const summaryOnly = searchParams.get('summary') === 'true'

    if (summaryOnly) {
      return await getRewardSummary(supabase, user.id)
    }

    // Parse pagination params
    const cursor = searchParams.get('cursor') || undefined
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : 20

    return await getRewardNotifications(supabase, user.id, { cursor, limit })
  } catch (error) {
    console.error('Get reward notifications error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

async function getRewardSummary(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string
): Promise<NextResponse<RewardSummaryResponse>> {
  // Get unread reward notification count
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', 'reward_earned')
    .eq('is_read', false)

  // Get latest unread reward notification
  const { data: latestReward } = await supabase
    .from('notifications')
    .select('title')
    .eq('user_id', userId)
    .eq('type', 'reward_earned')
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Calculate total credits earned from rewards (this is an estimate based on notifications)
  // In production, you'd want to query user_credits directly
  const { data: rewardNotifications } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'reward_earned')

  const totalCreditsEarned = rewardNotifications?.length || 0

  const response: RewardSummaryResponse = {
    unreadCount: unreadCount || 0,
    totalCreditsEarned,
    latestRewardTitle: latestReward?.title || null,
  }

  return NextResponse.json(response)
}

async function getRewardNotifications(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
  options: { cursor?: string; limit: number }
): Promise<NextResponse<RewardNotificationsResponse>> {
  const { cursor, limit } = options

  // Get unread count first
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', 'reward_earned')
    .eq('is_read', false)

  // Build query for reward notifications
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'reward_earned')
    .order('created_at', { ascending: false })

  // Apply cursor pagination
  if (cursor) {
    const { data: cursorNotification } = await supabase
      .from('notifications')
      .select('created_at')
      .eq('id', cursor)
      .single()

    if (cursorNotification) {
      query = query.lt('created_at', cursorNotification.created_at)
    }
  }

  query = query.limit(limit + 1)

  const { data: notificationsData, error } = await query

  if (error) {
    console.error('Query error:', error)
    return NextResponse.json({ error: 'خطأ في استرجاع الإشعارات' }, { status: 500 })
  }

  const hasMore = notificationsData && notificationsData.length > limit
  const notifications = notificationsData?.slice(0, limit) || []
  const nextCursor = hasMore && notifications.length > 0
    ? notifications[notifications.length - 1].id
    : null

  // Transform to RewardNotification type
  const transformedNotifications: RewardNotification[] = notifications.map((row: RewardNotificationRow) => ({
    id: row.id,
    userId: row.user_id,
    type: 'reward_earned' as const,
    title: row.title,
    message: row.message,
    metadata: {
      creditType: (row.metadata?.credit_type as 'exam' | 'practice') ||
                  (row.metadata?.content_type as 'exam' | 'practice') ||
                  'exam',
      amount: row.metadata?.amount || 1,
      sourceContentType: row.metadata?.source_content_type as 'exam' | 'practice' | undefined,
      completerId: row.metadata?.completer_id,
    },
    isRead: row.is_read,
    createdAt: row.created_at,
  }))

  const response: RewardNotificationsResponse = {
    notifications: transformedNotifications,
    unreadCount: unreadCount || 0,
    nextCursor,
    hasMore,
  }

  return NextResponse.json(response)
}
