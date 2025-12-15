// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
// Rewards Calculator
// Server-side reward calculation and credit management

import { createServerClient } from '@/lib/supabase/server';
import { notifyRewardEarned } from '@/lib/notifications/service';
import type {
  UserCreditsRow,
  CreditHistoryEntry,
  RewardsResponse,
  RedeemResponse,
  CreditType,
  MILESTONE_INTERVAL,
  MILESTONE_REWARDS,
} from './types';
import {
  getNextMilestone,
  isMilestoneReached,
  getMilestoneNumber,
} from './types';

// ============================================
// Credit Query Functions
// ============================================

/**
 * Get user's credit balance and reward info
 */
export async function getUserRewards(userId: string): Promise<RewardsResponse> {
  const supabase = await createServerClient();

  // Get or create user credits record
  const credits = await getOrCreateUserCredits(userId);

  // Get total shares count
  const { count: totalShares } = await supabase
    .from('forum_posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', userId)
    .eq('post_type', 'exam_share')
    .eq('status', 'active');

  // Calculate next milestone
  const nextMilestone = getNextMilestone(credits.total_completions);
  const progressToNext = credits.total_completions % 5;

  return {
    exam_credits: credits.exam_credits,
    practice_credits: credits.practice_credits,
    total_completions: credits.total_completions,
    next_milestone: nextMilestone,
    progress_to_next: progressToNext,
    total_shares: totalShares || 0,
    credit_history: credits.credit_history || [],
  };
}

/**
 * Get or create user credits record
 */
export async function getOrCreateUserCredits(userId: string): Promise<UserCreditsRow> {
  const supabase = await createServerClient();

  // Try to get existing record
  const { data: existing } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) {
    return existing as UserCreditsRow;
  }

  // Create new record
  const { data: created, error } = await supabase
    .from('user_credits')
    .insert({
      user_id: userId,
      exam_credits: 0,
      practice_credits: 0,
      total_completions: 0,
      last_awarded_milestone: 0,
      credit_history: [],
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user credits: ${error.message}`);
  }

  return created as UserCreditsRow;
}

// ============================================
// Credit Redemption Functions
// ============================================

/**
 * Redeem a credit for exam or practice access
 */
export async function redeemCredit(
  userId: string,
  creditType: CreditType
): Promise<RedeemResponse> {
  const supabase = await createServerClient();

  // Get current credits
  const credits = await getOrCreateUserCredits(userId);

  // Check if user has enough credits
  if (creditType === 'exam' && credits.exam_credits <= 0) {
    throw new Error('Insufficient exam credits');
  }
  if (creditType === 'practice' && credits.practice_credits <= 0) {
    throw new Error('Insufficient practice credits');
  }

  // Create history entry
  const historyEntry: CreditHistoryEntry = {
    type: 'redeemed',
    exam_credits: creditType === 'exam' ? 1 : 0,
    practice_credits: creditType === 'practice' ? 1 : 0,
    reason: `${creditType}_redemption`,
    timestamp: new Date().toISOString(),
  };

  // Update credits
  const updateData = {
    exam_credits: creditType === 'exam' ? credits.exam_credits - 1 : credits.exam_credits,
    practice_credits: creditType === 'practice' ? credits.practice_credits - 1 : credits.practice_credits,
    credit_history: [...(credits.credit_history || []), historyEntry],
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from('user_credits')
    .update(updateData)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to redeem credit: ${error.message}`);
  }

  return {
    exam_credits: updated.exam_credits,
    practice_credits: updated.practice_credits,
    redeemed: true,
  };
}

// ============================================
// Milestone Checking Functions
// ============================================

/**
 * Check and award milestone rewards (called by trigger or manually)
 * Note: This is primarily handled by the database trigger, but can be called manually
 */
export async function checkAndAwardMilestone(userId: string): Promise<{
  awarded: boolean;
  milestone?: number;
  creditsAwarded?: number;
}> {
  const supabase = await createServerClient();

  // Get current credits
  const credits = await getOrCreateUserCredits(userId);

  // Get total completions across all shared exams
  const { count: completionCount } = await supabase
    .from('shared_exam_completions')
    .select('*', { count: 'exact', head: true })
    .in('post_id', supabase
      .from('forum_posts')
      .select('id')
      .eq('author_id', userId)
      .eq('post_type', 'exam_share')
    );

  const totalCompletions = completionCount || 0;

  // Check if a new milestone is reached
  if (!isMilestoneReached(totalCompletions, credits.last_awarded_milestone)) {
    return { awarded: false };
  }

  const newMilestone = getMilestoneNumber(totalCompletions);
  const creditsToAdd = 5; // Per milestone

  // Create history entry
  const historyEntry: CreditHistoryEntry = {
    type: 'earned',
    exam_credits: creditsToAdd,
    practice_credits: creditsToAdd,
    reason: `milestone_${newMilestone}`,
    timestamp: new Date().toISOString(),
  };

  // Update credits
  const { error } = await supabase
    .from('user_credits')
    .update({
      exam_credits: credits.exam_credits + creditsToAdd,
      practice_credits: credits.practice_credits + creditsToAdd,
      total_completions: totalCompletions,
      last_awarded_milestone: newMilestone,
      credit_history: [...(credits.credit_history || []), historyEntry],
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to award milestone: ${error.message}`);
  }

  // Trigger reward_earned notification
  try {
    await notifyRewardEarned(userId, {
      milestone: newMilestone,
      examCredits: creditsToAdd,
      practiceCredits: creditsToAdd,
    });
  } catch (notifyError) {
    // Log but don't throw - notification is not critical
    console.error('Failed to send reward notification:', notifyError);
  }

  return {
    awarded: true,
    milestone: newMilestone,
    creditsAwarded: creditsToAdd,
  };
}

// ============================================
// Admin Credit Management Functions
// ============================================

/**
 * Add credits to a user (admin only)
 */
export async function addCredits(
  userId: string,
  examCredits: number,
  practiceCredits: number,
  reason: string
): Promise<UserCreditsRow> {
  const supabase = await createServerClient();

  // Get current credits
  const credits = await getOrCreateUserCredits(userId);

  // Create history entry
  const historyEntry: CreditHistoryEntry = {
    type: 'earned',
    exam_credits: examCredits,
    practice_credits: practiceCredits,
    reason: `admin_grant_${reason}`,
    timestamp: new Date().toISOString(),
  };

  // Update credits
  const { data: updated, error } = await supabase
    .from('user_credits')
    .update({
      exam_credits: credits.exam_credits + examCredits,
      practice_credits: credits.practice_credits + practiceCredits,
      credit_history: [...(credits.credit_history || []), historyEntry],
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add credits: ${error.message}`);
  }

  return updated as UserCreditsRow;
}

/**
 * Set credits for a user (admin only)
 */
export async function setCredits(
  userId: string,
  examCredits: number,
  practiceCredits: number,
  reason: string
): Promise<UserCreditsRow> {
  const supabase = await createServerClient();

  // Get current credits to record the change
  const credits = await getOrCreateUserCredits(userId);
  const examDiff = examCredits - credits.exam_credits;
  const practiceDiff = practiceCredits - credits.practice_credits;

  // Create history entry
  const historyEntry: CreditHistoryEntry = {
    type: examDiff >= 0 && practiceDiff >= 0 ? 'earned' : 'redeemed',
    exam_credits: Math.abs(examDiff),
    practice_credits: Math.abs(practiceDiff),
    reason: `admin_set_${reason}`,
    timestamp: new Date().toISOString(),
  };

  // Update credits
  const { data: updated, error } = await supabase
    .from('user_credits')
    .update({
      exam_credits: examCredits,
      practice_credits: practiceCredits,
      credit_history: [...(credits.credit_history || []), historyEntry],
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to set credits: ${error.message}`);
  }

  return updated as UserCreditsRow;
}

// ============================================
// Integration with Subscription System
// ============================================

/**
 * Check if user can take an exam using credits
 * This integrates with the existing subscription system
 */
export async function canUseExamCredit(userId: string): Promise<{
  canUse: boolean;
  creditsAvailable: number;
}> {
  try {
    const credits = await getOrCreateUserCredits(userId);
    return {
      canUse: credits.exam_credits > 0,
      creditsAvailable: credits.exam_credits,
    };
  } catch {
    return {
      canUse: false,
      creditsAvailable: 0,
    };
  }
}

/**
 * Check if user can take a practice using credits
 */
export async function canUsePracticeCredit(userId: string): Promise<{
  canUse: boolean;
  creditsAvailable: number;
}> {
  try {
    const credits = await getOrCreateUserCredits(userId);
    return {
      canUse: credits.practice_credits > 0,
      creditsAvailable: credits.practice_credits,
    };
  } catch {
    return {
      canUse: false,
      creditsAvailable: 0,
    };
  }
}

/**
 * Consume an exam credit (call after subscription check fails but credit available)
 */
export async function consumeExamCredit(userId: string): Promise<boolean> {
  try {
    await redeemCredit(userId, 'exam');
    return true;
  } catch {
    return false;
  }
}

/**
 * Consume a practice credit for premium features
 */
export async function consumePracticeCredit(userId: string): Promise<boolean> {
  try {
    await redeemCredit(userId, 'practice');
    return true;
  } catch {
    return false;
  }
}

// ============================================
// Statistics Functions
// ============================================

/**
 * Get leaderboard of top sharers
 */
export async function getTopSharers(limit: number = 10): Promise<Array<{
  userId: string;
  displayName: string;
  totalCompletions: number;
  totalShares: number;
}>> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('user_credits')
    .select(`
      user_id,
      total_completions,
      user_profiles!user_credits_user_id_fkey(display_name)
    `)
    .order('total_completions', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get top sharers: ${error.message}`);
  }

  // Get share counts for each user
  const results = await Promise.all(
    (data || []).map(async (row) => {
      const { count: shares } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', row.user_id)
        .eq('post_type', 'exam_share')
        .eq('status', 'active');

      const profile = row.user_profiles as unknown as { display_name: string } | null;
      return {
        userId: row.user_id,
        displayName: profile?.display_name || 'Unknown',
        totalCompletions: row.total_completions,
        totalShares: shares || 0,
      };
    })
  );

  return results;
}
