/**
 * Rewards utilities for tracking and managing user rewards
 * T018: Rewards utilities implementation
 */

import { createClient } from '@/lib/supabase/client'
import type {
  RewardTransaction,
  RewardBalance,
  RewardInfo,
  RewardEligibility,
  RewardHistoryResponse,
} from '@/types'

/**
 * Get user's current reward balance
 */
export async function getRewardBalance(userId: string): Promise<RewardBalance> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_credits')
    .select('exam_credits, practice_credits')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching reward balance:', error)
    return { examCredits: 0, practiceCredits: 0 }
  }

  return {
    examCredits: data?.exam_credits || 0,
    practiceCredits: data?.practice_credits || 0,
  }
}

/**
 * Get user's reward history with pagination
 */
export async function getRewardHistory(
  userId: string,
  page = 1,
  limit = 20
): Promise<RewardHistoryResponse> {
  const supabase = createClient()
  const offset = (page - 1) * limit

  // Get notifications of type 'reward_earned'
  const { data, error, count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('type', 'reward_earned')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching reward history:', error)
    return {
      transactions: [],
      pagination: { page, limit, total: 0, hasMore: false },
    }
  }

  // Transform notifications to reward transactions
  const transactions: RewardTransaction[] = (data || []).map((notification) => {
    // Parse metadata from notification if available
    const metadata = typeof notification.message === 'string'
      ? parseRewardMessage(notification.message)
      : { creditType: 'exam' as const, amount: 1 }

    return {
      id: notification.id,
      type: 'exam_completion' as const,
      creditType: metadata.creditType,
      amount: metadata.amount,
      source: notification.target_id ? {
        userId: '', // Would need to fetch from completion record
        displayName: null,
        contentType: notification.target_type as 'exam' | 'practice' || 'exam',
        contentId: notification.target_id,
      } : null,
      createdAt: notification.created_at || '',
    }
  })

  return {
    transactions,
    pagination: {
      page,
      limit,
      total: count || 0,
      hasMore: offset + transactions.length < (count || 0),
    },
  }
}

/**
 * Get comprehensive reward info for user
 */
export async function getRewardInfo(userId: string): Promise<RewardInfo> {
  const [balance, historyResponse] = await Promise.all([
    getRewardBalance(userId),
    getRewardHistory(userId, 1, 5),
  ])

  return {
    balance,
    totalEarned: balance, // Simplified - would need credit_history for accurate total
    recentTransactions: historyResponse.transactions,
  }
}

/**
 * Check if user is eligible to earn rewards
 */
export async function checkRewardEligibility(userId: string): Promise<RewardEligibility> {
  const supabase = createClient()

  // Check if user has shared any content
  const { count: sharedCount } = await supabase
    .from('forum_posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', userId)
    .in('post_type', ['exam_share', 'practice_share'])

  // Get total rewards earned
  const { count: rewardsCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', 'reward_earned')

  const hasSharedContent = (sharedCount || 0) > 0

  return {
    canEarnRewards: hasSharedContent,
    reason: hasSharedContent
      ? undefined
      : 'شارك اختباراً أو تمريناً لتبدأ بكسب المكافآت',
    sharedContentCount: sharedCount || 0,
    totalRewardsEarned: rewardsCount || 0,
  }
}

/**
 * Get sharing statistics for user
 */
export async function getSharingStats(userId: string): Promise<{
  examSharesCount: number
  practiceSharesCount: number
  totalCompletions: number
  totalRewardsEarned: number
}> {
  const supabase = createClient()

  // Count exam shares
  const { count: examCount } = await supabase
    .from('forum_posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', userId)
    .eq('post_type', 'exam_share')

  // Count practice shares
  const { count: practiceCount } = await supabase
    .from('forum_posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', userId)
    .eq('post_type', 'practice_share')

  // Get user credits for total completions
  const { data: credits } = await supabase
    .from('user_credits')
    .select('total_completions')
    .eq('user_id', userId)
    .maybeSingle()

  // Count reward notifications
  const { count: rewardsCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', 'reward_earned')

  return {
    examSharesCount: examCount || 0,
    practiceSharesCount: practiceCount || 0,
    totalCompletions: credits?.total_completions || 0,
    totalRewardsEarned: rewardsCount || 0,
  }
}

// Helper function to parse reward info from notification message
function parseRewardMessage(message: string): { creditType: 'exam' | 'practice'; amount: number } {
  // Default values
  let creditType: 'exam' | 'practice' = 'exam'
  let amount = 1

  // Try to extract from message (Arabic)
  if (message.includes('تمرين') || message.includes('practice')) {
    creditType = 'practice'
  }

  // Could parse amount from message if formatted consistently
  const amountMatch = message.match(/\d+/)
  if (amountMatch) {
    amount = parseInt(amountMatch[0], 10)
  }

  return { creditType, amount }
}
