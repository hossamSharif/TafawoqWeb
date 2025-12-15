/**
 * Rewards-related type definitions for the reward system
 */

export type RewardType =
  | 'exam_completion'      // Someone completed your shared exam
  | 'practice_completion'  // Someone completed your shared practice
  | 'milestone'            // Reached a sharing milestone
  | 'admin_grant'          // Admin manually granted credits

export type CreditType = 'exam' | 'practice'

export interface RewardTransaction {
  id: string
  type: RewardType
  creditType: CreditType
  amount: number
  source: {
    userId: string
    displayName: string | null
    contentType: 'exam' | 'practice'
    contentId: string
  } | null // null for admin_grant or milestone
  createdAt: string
}

export interface RewardNotification {
  id: string
  userId: string
  type: 'reward_earned'
  title: string
  message: string
  metadata: {
    creditType: CreditType
    amount: number
    sourceContentType?: 'exam' | 'practice'
    completerId?: string
  }
  isRead: boolean
  createdAt: string
}

export interface RewardBalance {
  examCredits: number
  practiceCredits: number
}

export interface RewardInfo {
  balance: RewardBalance
  totalEarned: RewardBalance
  recentTransactions: RewardTransaction[]
}

export interface RewardEligibility {
  canEarnRewards: boolean
  reason?: string
  sharedContentCount: number
  totalRewardsEarned: number
}

// Response types for API
export interface RewardHistoryResponse {
  transactions: RewardTransaction[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export interface ClaimRewardResponse {
  success: boolean
  creditsClaimed: number
  newBalance: RewardBalance
}

// Constants for reward display
export const REWARD_MESSAGES = {
  exam_completion: {
    titleAr: 'مكافأة اختبار',
    titleEn: 'Exam Reward',
    messageAr: 'أكمل مستخدم اختبارك المشارك',
    messageEn: 'A user completed your shared exam',
  },
  practice_completion: {
    titleAr: 'مكافأة تمرين',
    titleEn: 'Practice Reward',
    messageAr: 'أكمل مستخدم تمرينك المشارك',
    messageEn: 'A user completed your shared practice',
  },
  milestone: {
    titleAr: 'إنجاز جديد',
    titleEn: 'New Milestone',
    messageAr: 'حققت إنجازاً جديداً في المشاركة',
    messageEn: 'You reached a new sharing milestone',
  },
  admin_grant: {
    titleAr: 'منحة إدارية',
    titleEn: 'Admin Grant',
    messageAr: 'تم منحك رصيد من الإدارة',
    messageEn: 'You received credits from admin',
  },
} as const
