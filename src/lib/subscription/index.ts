/**
 * Subscription Management Utilities
 *
 * Exports all subscription-related utilities including:
 * - Edge case handling (T083-T085)
 * - Grace period management (T086-T088)
 */

// Re-export constants from subscription types
export { GRACE_PERIOD_DAYS, TIER_LIMITS } from '@/types/subscription'

// Edge cases (T083-T085)
export {
  checkDowngradeStatus,
  checkDeletedContentRewardStatus,
  checkSimultaneousCompletions,
  applyDowngradeLimits,
  type DowngradeStatus,
  type DeletedContentRewardStatus,
  type SimultaneousCompletionStatus,
} from './edge-cases'

// Grace period (T086-T088)
export {
  getGracePeriodStatus,
  startGracePeriod,
  clearGracePeriod,
  processExpiredGracePeriods,
  createPaymentFailureNotification,
  createGracePeriodWarningNotification,
  shouldRetainPremiumAccess,
  type GracePeriodInfo,
} from './grace-period'
