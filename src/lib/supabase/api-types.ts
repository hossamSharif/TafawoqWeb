/**
 * Helper types for API routes to work around Supabase type generation issues
 */

import type { Json } from './types'
import type { Question } from '@/types/question'

// Row types for common tables
export interface ExamSessionRow {
  id: string
  user_id: string
  status: string
  track: string | null
  total_questions: number
  questions_answered: number | null
  questions: Json | null
  start_time: string | null
  end_time: string | null
  started_at: string | null
  completed_at: string | null
  time_spent_seconds: number | null
  time_paused_seconds: number | null
  verbal_score: number | null
  quantitative_score: number | null
  overall_score: number | null
  created_at: string | null
}

export interface AnswerRow {
  id: string
  user_id: string
  session_id: string
  session_type: string
  question_id: string
  question_index: number
  selected_answer: number | null
  is_correct: boolean
  time_spent_seconds: number
  explanation_viewed: boolean
  explanation_viewed_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface PracticeSessionRow {
  id: string
  user_id: string
  status: string
  section: string
  categories: string[]
  difficulty: string
  question_count: number
  started_at: string | null
  completed_at: string | null
  time_spent_seconds: number | null
  created_at: string | null
}

export interface UserSubscriptionRow {
  id: string
  user_id: string
  tier: string
  status: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  trial_end_at: string | null
  canceled_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface UserAnalyticsRow {
  id: string
  user_id: string
  total_exams_completed: number | null
  total_practices_completed: number | null
  total_practice_hours: number | null
  last_exam_verbal_score: number | null
  last_exam_quantitative_score: number | null
  last_exam_overall_average: number | null
  strongest_category: string | null
  weakest_category: string | null
  last_activity_at: string | null
  updated_at: string | null
}

export interface PracticeResultRow {
  id: string
  practice_session_id: string
  user_id: string
  overall_score: number
  category_breakdown: Json
  strengths: Json | null
  weaknesses: Json | null
  improvement_advice: string | null
  created_at: string | null
}

export interface UserProfileRow {
  id: string
  user_id: string
  academic_track: string
  profile_picture_url: string | null
  total_practice_hours: number | null
  onboarding_completed: boolean | null
  last_active_at: string | null
  created_at: string | null
  updated_at: string | null
}

// Helper function to cast Supabase query results
export function asExamSession(data: unknown): ExamSessionRow {
  return data as ExamSessionRow
}

export function asAnswer(data: unknown): AnswerRow {
  return data as AnswerRow
}

export function asAnswerArray(data: unknown): AnswerRow[] {
  return (data || []) as AnswerRow[]
}

export function asPracticeSession(data: unknown): PracticeSessionRow {
  return data as PracticeSessionRow
}

export function asQuestions(data: unknown): Question[] {
  return (data || []) as Question[]
}
