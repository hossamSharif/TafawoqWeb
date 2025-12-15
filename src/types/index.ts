/**
 * Central export for all type definitions
 */

// Exam types
export type {
  AcademicTrack,
  ExamSessionStatus,
  ExamSession,
  CategoryScore,
  ExamResults,
  ExamConfig,
  ExamProgress,
} from './exam'
export { EXAM_CONFIG } from './exam'

// Question types
export type {
  QuestionSection,
  QuestionDifficulty,
  QuestionType,
  QuantitativeCategory,
  VerbalCategory,
  QuestionCategory,
  DiagramType,
  RenderHint,
  DiagramData,
  Question,
  UserAnswer,
} from './question'
export {
  QUANTITATIVE_CATEGORIES,
  VERBAL_CATEGORIES,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  SECTION_LABELS,
} from './question'

// User types
export type {
  SubscriptionTier,
  User,
  UserProfile,
  LastExamScores,
  PerformanceRecord,
  ExamHistoryEntry,
  PracticeStat,
  OnboardingState,
  FeatureAccess,
} from './user'
export { SUBSCRIPTION_FEATURES } from './user'

// Subscription types
export type {
  SubscriptionStatus,
  Subscription,
  SubscriptionPlan,
  PlanFeature,
  CheckoutSession,
  Invoice,
  UsageStats,
} from './subscription'
export { FREE_PLAN, PREMIUM_PLAN } from './subscription'

// Platform Upgrade V2 - New subscription types
export type {
  SharingLimits,
  GracePeriodStatus,
  SubscriptionWithGracePeriod,
  UserLimits,
  SharingQuota,
} from './subscription'
export { TIER_LIMITS, GRACE_PERIOD_DAYS } from './subscription'

// Library types
export type {
  LibraryAccessStatus,
  LibraryExam,
  LibraryExamDetail,
  LibraryAccess,
  UserLibraryAccess,
  LibraryListResponse,
  LibraryExamDetailResponse,
  LibraryAccessRequest,
  LibraryAccessResponse,
  LibraryAccessDeniedResponse,
  LibraryStartExamResponse,
  LibraryFilters,
} from './library'
export { LIBRARY_LIMITS } from './library'

// Rewards types
export type {
  RewardType,
  CreditType,
  RewardTransaction,
  RewardNotification,
  RewardBalance,
  RewardInfo,
  RewardEligibility,
  RewardHistoryResponse,
  ClaimRewardResponse,
} from './rewards'
export { REWARD_MESSAGES } from './rewards'

// Maintenance types
export type {
  MaintenanceAction,
  MaintenanceConfig,
  MaintenanceLog,
  MaintenanceStatus,
  EnableMaintenanceRequest,
  MaintenanceStatusResponse,
  MaintenanceLogResponse,
  MaintenanceBlockedOperation,
} from './maintenance'
export {
  MAINTENANCE_BLOCKED_OPERATIONS,
  DEFAULT_MAINTENANCE_MESSAGE,
  isOperationBlocked,
} from './maintenance'
