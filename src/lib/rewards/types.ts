// Reward Types for Forum & Exam Sharing Platform
// Based on data-model.md and contracts/api.md specifications

// ============================================
// Enums and Constants
// ============================================

export type CreditType = 'exam' | 'practice';
export type CreditTransactionType = 'earned' | 'redeemed';

// ============================================
// Database Row Types (matching Supabase schema)
// ============================================

export interface UserCreditsRow {
  id: string;
  user_id: string;
  exam_credits: number;
  practice_credits: number;
  total_completions: number;
  last_awarded_milestone: number;
  credit_history: CreditHistoryEntry[];
  created_at: string;
  updated_at: string;
}

export interface CreditHistoryEntry {
  type: CreditTransactionType;
  exam_credits: number;
  practice_credits: number;
  reason: string; // e.g., 'milestone_5', 'milestone_10', 'exam_redemption', 'practice_redemption'
  timestamp: string;
}

// ============================================
// Insert Types (for creating new records)
// ============================================

export interface UserCreditsInsert {
  id?: string;
  user_id: string;
  exam_credits?: number;
  practice_credits?: number;
  total_completions?: number;
  last_awarded_milestone?: number;
  credit_history?: CreditHistoryEntry[];
  created_at?: string;
  updated_at?: string;
}

// ============================================
// Update Types (for updating existing records)
// ============================================

export interface UserCreditsUpdate {
  exam_credits?: number;
  practice_credits?: number;
  total_completions?: number;
  last_awarded_milestone?: number;
  credit_history?: CreditHistoryEntry[];
  updated_at?: string;
}

// ============================================
// API Response Types
// ============================================

export interface RewardsResponse {
  exam_credits: number;
  practice_credits: number;
  total_completions: number;
  next_milestone: number;
  progress_to_next: number;
  total_shares: number;
  credit_history: CreditHistoryEntry[];
}

export interface RedeemResponse {
  exam_credits: number;
  practice_credits: number;
  redeemed: boolean;
}

// ============================================
// API Request Types
// ============================================

export interface RedeemRequest {
  credit_type: CreditType;
}

// ============================================
// Milestone System
// ============================================

export const MILESTONE_INTERVAL = 5; // Every 5 completions = 1 milestone

export const MILESTONE_REWARDS = {
  exam_credits: 5,      // Credits per milestone
  practice_credits: 5,  // Credits per milestone
} as const;

/**
 * Calculate the next milestone based on current completions
 */
export function getNextMilestone(totalCompletions: number): number {
  return Math.ceil((totalCompletions + 1) / MILESTONE_INTERVAL) * MILESTONE_INTERVAL;
}

/**
 * Check if a milestone has been reached
 */
export function isMilestoneReached(
  totalCompletions: number,
  lastAwardedMilestone: number
): boolean {
  const currentMilestone = Math.floor(totalCompletions / MILESTONE_INTERVAL) * MILESTONE_INTERVAL;
  return currentMilestone > lastAwardedMilestone && totalCompletions >= MILESTONE_INTERVAL;
}

/**
 * Get the milestone number for a given completion count
 */
export function getMilestoneNumber(totalCompletions: number): number {
  return Math.floor(totalCompletions / MILESTONE_INTERVAL) * MILESTONE_INTERVAL;
}

/**
 * Calculate progress percentage to next milestone
 */
export function getProgressToNextMilestone(totalCompletions: number): {
  progress: number;
  remaining: number;
  nextMilestone: number;
} {
  const nextMilestone = getNextMilestone(totalCompletions);
  const previousMilestone = nextMilestone - MILESTONE_INTERVAL;
  const progressInCurrentCycle = totalCompletions - previousMilestone;
  const progress = (progressInCurrentCycle / MILESTONE_INTERVAL) * 100;
  const remaining = nextMilestone - totalCompletions;

  return {
    progress: Math.min(progress, 100),
    remaining,
    nextMilestone,
  };
}

// ============================================
// Reward Progress Display
// ============================================

export interface RewardProgressInfo {
  currentCompletions: number;
  nextMilestone: number;
  progressPercentage: number;
  remainingCompletions: number;
  rewardsAtNextMilestone: {
    exam_credits: number;
    practice_credits: number;
  };
}

export function getRewardProgressInfo(totalCompletions: number): RewardProgressInfo {
  const { progress, remaining, nextMilestone } = getProgressToNextMilestone(totalCompletions);

  return {
    currentCompletions: totalCompletions,
    nextMilestone,
    progressPercentage: progress,
    remainingCompletions: remaining,
    rewardsAtNextMilestone: MILESTONE_REWARDS,
  };
}

// ============================================
// Credit Balance Display
// ============================================

export interface CreditBalanceDisplay {
  examCredits: number;
  practiceCredits: number;
  totalCredits: number;
  hasExamCredits: boolean;
  hasPracticeCredits: boolean;
}

export function getCreditBalanceDisplay(
  examCredits: number,
  practiceCredits: number
): CreditBalanceDisplay {
  return {
    examCredits,
    practiceCredits,
    totalCredits: examCredits + practiceCredits,
    hasExamCredits: examCredits > 0,
    hasPracticeCredits: practiceCredits > 0,
  };
}

// ============================================
// Validation
// ============================================

export function canRedeemCredit(
  creditType: CreditType,
  examCredits: number,
  practiceCredits: number
): boolean {
  if (creditType === 'exam') {
    return examCredits > 0;
  }
  return practiceCredits > 0;
}
