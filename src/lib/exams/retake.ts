/**
 * Retake exam functionality
 * Allows users to generate a new exam with similar configuration to a previous exam
 */

import type { ExamConfigStored } from '@/types/exam'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface RetakeOptions {
  sourceExamId: string
  userId: string
}

export interface RetakeResult {
  success: boolean
  sessionId?: string
  error?: string
}

/**
 * Get the configuration from a completed exam for retake
 */
export async function getExamConfigForRetake(
  supabase: SupabaseClient,
  examId: string,
  userId: string
): Promise<ExamConfigStored | null> {
  // Fetch the source exam session
  const { data: sourceExam, error } = await supabase
    .from('exam_sessions')
    .select('exam_config, track, total_questions, questions')
    .eq('id', examId)
    .eq('user_id', userId) // Ensure user owns this exam
    .single()

  if (error || !sourceExam) {
    console.error('Error fetching source exam:', error)
    return null
  }

  // If exam_config is already stored, use it
  if (sourceExam.exam_config && Object.keys(sourceExam.exam_config).length > 0) {
    return sourceExam.exam_config as ExamConfigStored
  }

  // Otherwise, infer configuration from the exam
  const config: ExamConfigStored = {
    track: sourceExam.track,
    totalQuestions: sourceExam.total_questions || 96,
    timeLimit: 120, // Standard 2 hours
  }

  // Try to infer category and difficulty distribution from questions
  if (sourceExam.questions && Array.isArray(sourceExam.questions)) {
    const questions = sourceExam.questions as Array<{
      topic?: string
      difficulty?: string
    }>

    // Count categories
    const categoryCount: Record<string, number> = {}
    const difficultyCount: Record<string, number> = {}

    questions.forEach((q) => {
      if (q.topic) {
        categoryCount[q.topic] = (categoryCount[q.topic] || 0) + 1
      }
      if (q.difficulty) {
        difficultyCount[q.difficulty] = (difficultyCount[q.difficulty] || 0) + 1
      }
    })

    if (Object.keys(categoryCount).length > 0) {
      config.categoryDistribution = categoryCount
    }
    if (Object.keys(difficultyCount).length > 0) {
      config.difficultyDistribution = difficultyCount
    }
  }

  return config
}

/**
 * Validate that a user can retake an exam
 */
export async function canRetakeExam(
  supabase: SupabaseClient,
  examId: string,
  userId: string
): Promise<{ canRetake: boolean; reason?: string }> {
  // Fetch the source exam
  const { data: exam, error } = await supabase
    .from('exam_sessions')
    .select('user_id, status')
    .eq('id', examId)
    .single()

  if (error || !exam) {
    return { canRetake: false, reason: 'الاختبار غير موجود' }
  }

  // Check ownership
  if (exam.user_id !== userId) {
    return { canRetake: false, reason: 'غير مصرح' }
  }

  // Check if exam is completed (can only retake completed exams)
  if (exam.status !== 'completed') {
    return { canRetake: false, reason: 'يمكن فقط إعادة الاختبارات المكتملة' }
  }

  return { canRetake: true }
}

/**
 * Calculate similarity score between two exams based on their configurations
 * Returns a number between 0 and 1 (1 = identical)
 */
export function calculateConfigSimilarity(
  config1: ExamConfigStored,
  config2: ExamConfigStored
): number {
  let score = 0
  let factors = 0

  // Track match (30% weight)
  if (config1.track === config2.track) {
    score += 0.3
  }
  factors++

  // Total questions match (10% weight)
  if (config1.totalQuestions === config2.totalQuestions) {
    score += 0.1
  }
  factors++

  // Category distribution match (40% weight)
  if (config1.categoryDistribution && config2.categoryDistribution) {
    const cat1Keys = Object.keys(config1.categoryDistribution)
    const cat2Keys = Object.keys(config2.categoryDistribution)
    const commonCategories = cat1Keys.filter((k) => cat2Keys.includes(k))

    if (commonCategories.length > 0) {
      const categoryScore =
        commonCategories.length / Math.max(cat1Keys.length, cat2Keys.length)
      score += categoryScore * 0.4
    }
  }
  factors++

  // Difficulty distribution match (20% weight)
  if (config1.difficultyDistribution && config2.difficultyDistribution) {
    const diff1Keys = Object.keys(config1.difficultyDistribution)
    const diff2Keys = Object.keys(config2.difficultyDistribution)
    const commonDifficulties = diff1Keys.filter((k) => diff2Keys.includes(k))

    if (commonDifficulties.length > 0) {
      const difficultyScore =
        commonDifficulties.length / Math.max(diff1Keys.length, diff2Keys.length)
      score += difficultyScore * 0.2
    }
  }
  factors++

  return score
}

/**
 * Format exam config for display in UI
 */
export function formatExamConfig(config: ExamConfigStored): string {
  const parts: string[] = []

  parts.push(config.track === 'scientific' ? 'علمي' : 'أدبي')
  parts.push(`${config.totalQuestions} سؤال`)
  parts.push(`${config.timeLimit} دقيقة`)

  return parts.join(' • ')
}
