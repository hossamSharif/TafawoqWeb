/**
 * User-related type definitions
 */

import type { AcademicTrack } from './exam'

export type SubscriptionTier = 'free' | 'premium'

export interface User {
  id: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  id: string
  userId: string
  academicTrack: AcademicTrack
  subscriptionTier: SubscriptionTier
  onboardingCompleted: boolean
  totalPracticeHours: number
  lastExamScores?: LastExamScores
  createdAt: string
  updatedAt: string
}

export interface LastExamScores {
  verbal: number
  quantitative: number
  overall: number
  examDate: string
}

export interface PerformanceRecord {
  id: string
  userId: string
  categoryScores: Record<string, number>
  examHistory: ExamHistoryEntry[]
  practiceStats: Record<string, PracticeStat>
  totalQuestionsAnswered: number
  totalCorrectAnswers: number
  weeklyExamCount: number
  weekStartDate?: string
  createdAt: string
  updatedAt: string
}

export interface ExamHistoryEntry {
  date: string
  verbal: number
  quantitative: number
  overall: number
}

export interface PracticeStat {
  total: number
  correct: number
  avgTime: number // average time per question in seconds
}

export interface OnboardingState {
  step: 'track-selection' | 'plan-selection' | 'tutorial' | 'completed'
  trackSelected?: AcademicTrack
  planSelected?: SubscriptionTier
  tutorialCompleted?: boolean
}

// Feature access based on subscription
export interface FeatureAccess {
  maxExamsPerWeek: number | null // null = unlimited
  maxQuestionsPerPractice: number
  maxCategoriesPerPractice: number
  explanationDelay: number // hours delay before viewing explanations
  advancedAnalytics: boolean
  dataExport: boolean
  peerComparison: boolean
}

export const SUBSCRIPTION_FEATURES: Record<SubscriptionTier, FeatureAccess> = {
  free: {
    maxExamsPerWeek: 3,
    maxQuestionsPerPractice: 5,
    maxCategoriesPerPractice: 2,
    explanationDelay: 24,
    advancedAnalytics: false,
    dataExport: false,
    peerComparison: false,
  },
  premium: {
    maxExamsPerWeek: null,
    maxQuestionsPerPractice: 100,
    maxCategoriesPerPractice: 12, // all categories
    explanationDelay: 0,
    advancedAnalytics: true,
    dataExport: true,
    peerComparison: true,
  },
}
