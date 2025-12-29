/**
 * Forum validation utilities
 * Purpose: Validate practice/exam sessions before sharing
 */

export interface PracticeValidationResult {
  isValid: boolean
  reason?: string
  answeredCount?: number
  totalQuestions?: number
  completionPercentage?: number
}

// Validation thresholds for practice sharing
export const PRACTICE_SHARE_REQUIREMENTS = {
  MINIMUM_ANSWERED_QUESTIONS: 3,
  MINIMUM_COMPLETION_PERCENTAGE: 0.3, // 30%
} as const

/**
 * Validates that a practice session has meaningful completion before sharing
 * @param practiceSession - Practice session with questions array
 * @returns Validation result with details
 */
export function validatePracticeSessionCompleteness(
  practiceSession: { questions?: any[] }
): PracticeValidationResult {
  const questions = practiceSession.questions || []
  const totalQuestions = questions.length

  // Check if questions exist
  if (totalQuestions === 0) {
    return {
      isValid: false,
      reason: 'No questions found in practice session',
      answeredCount: 0,
      totalQuestions: 0,
      completionPercentage: 0,
    }
  }

  // Count answered questions (where userAnswer is not null/undefined)
  const answeredCount = questions.filter(
    (q) => q.userAnswer !== null && q.userAnswer !== undefined
  ).length

  const completionPercentage = answeredCount / totalQuestions

  // Validate minimum answered questions
  if (answeredCount < PRACTICE_SHARE_REQUIREMENTS.MINIMUM_ANSWERED_QUESTIONS) {
    return {
      isValid: false,
      reason: `Minimum ${PRACTICE_SHARE_REQUIREMENTS.MINIMUM_ANSWERED_QUESTIONS} questions must be answered`,
      answeredCount,
      totalQuestions,
      completionPercentage,
    }
  }

  // Validate minimum completion percentage
  if (completionPercentage < PRACTICE_SHARE_REQUIREMENTS.MINIMUM_COMPLETION_PERCENTAGE) {
    return {
      isValid: false,
      reason: `Minimum ${PRACTICE_SHARE_REQUIREMENTS.MINIMUM_COMPLETION_PERCENTAGE * 100}% completion required`,
      answeredCount,
      totalQuestions,
      completionPercentage,
    }
  }

  // Validation passed
  return {
    isValid: true,
    answeredCount,
    totalQuestions,
    completionPercentage,
  }
}

/**
 * Validates exam session completeness (for future use if needed)
 * Currently exams already have strict completion requirements
 */
export function validateExamSessionCompleteness(
  examSession: { questions?: any[] }
): PracticeValidationResult {
  // For now, exams are validated by status='completed' which already ensures
  // all questions are answered. This function can be enhanced later if needed.
  const questions = examSession.questions || []
  const totalQuestions = questions.length
  const answeredCount = questions.filter(
    (q) => q.userAnswer !== null && q.userAnswer !== undefined
  ).length

  return {
    isValid: totalQuestions > 0 && answeredCount === totalQuestions,
    reason:
      answeredCount === totalQuestions
        ? undefined
        : 'All exam questions must be answered',
    answeredCount,
    totalQuestions,
    completionPercentage: totalQuestions > 0 ? answeredCount / totalQuestions : 0,
  }
}
