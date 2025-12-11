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
