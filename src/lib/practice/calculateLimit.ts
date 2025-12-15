/**
 * Practice Session Limit Calculator
 *
 * Implements User Story 3 (FR-016, FR-017): Practice sessions are limited
 * to half the number of questions available in that section from the exam.
 *
 * Based on the Saudi GAT (Qudurat) exam structure:
 * - Scientific track: 52 quantitative + 44 verbal = 96 total
 * - Literary track: 48 quantitative + 48 verbal = 96 total
 */

import type { QuestionSection } from '@/types/question'

/**
 * Academic track types supported by the platform
 */
export type AcademicTrack = 'scientific' | 'literary'

/**
 * Exam section question counts by academic track
 * These represent the standard GAT exam structure
 */
export const EXAM_SECTION_COUNTS: Record<AcademicTrack, Record<QuestionSection, number>> = {
  scientific: {
    quantitative: 52,
    verbal: 44,
  },
  literary: {
    quantitative: 48,
    verbal: 48,
  },
}

/**
 * Default section counts when track is unknown
 * Uses the average/common structure
 */
export const DEFAULT_SECTION_COUNTS: Record<QuestionSection, number> = {
  quantitative: 50, // Average of 52 and 48
  verbal: 46,       // Average of 44 and 48
}

/**
 * Calculate the maximum number of questions allowed for a practice session
 *
 * @param section - The section type (quantitative or verbal)
 * @param track - Optional academic track for more accurate limits
 * @returns Maximum question count (floor of half the exam section count)
 *
 * @example
 * // Scientific track, quantitative section: floor(52/2) = 26
 * calculatePracticeLimit('quantitative', 'scientific') // Returns 26
 *
 * @example
 * // Scientific track, verbal section: floor(44/2) = 22
 * calculatePracticeLimit('verbal', 'scientific') // Returns 22
 *
 * @example
 * // Literary track, either section: floor(48/2) = 24
 * calculatePracticeLimit('quantitative', 'literary') // Returns 24
 */
export function calculatePracticeLimit(
  section: QuestionSection,
  track?: AcademicTrack | null
): number {
  let sectionQuestionCount: number

  if (track && EXAM_SECTION_COUNTS[track]) {
    sectionQuestionCount = EXAM_SECTION_COUNTS[track][section]
  } else {
    sectionQuestionCount = DEFAULT_SECTION_COUNTS[section]
  }

  // FR-016: Limit to half, rounded down
  return Math.floor(sectionQuestionCount / 2)
}

/**
 * Get the exam section question count for display purposes
 *
 * @param section - The section type
 * @param track - Optional academic track
 * @returns The total questions in that exam section
 */
export function getExamSectionCount(
  section: QuestionSection,
  track?: AcademicTrack | null
): number {
  if (track && EXAM_SECTION_COUNTS[track]) {
    return EXAM_SECTION_COUNTS[track][section]
  }
  return DEFAULT_SECTION_COUNTS[section]
}

/**
 * Practice limit information for UI display
 */
export interface PracticeLimitInfo {
  /** Maximum questions allowed for practice */
  maxQuestions: number
  /** Total questions in the exam section */
  examSectionCount: number
  /** The section type */
  section: QuestionSection
  /** The academic track (if known) */
  track?: AcademicTrack | null
}

/**
 * Get complete practice limit information for UI display
 *
 * @param section - The section type
 * @param track - Optional academic track
 * @returns Object with limit info for display
 */
export function getPracticeLimitInfo(
  section: QuestionSection,
  track?: AcademicTrack | null
): PracticeLimitInfo {
  const examSectionCount = getExamSectionCount(section, track)
  const maxQuestions = Math.floor(examSectionCount / 2)

  return {
    maxQuestions,
    examSectionCount,
    section,
    track,
  }
}

/**
 * Validate if a requested question count is within the practice limit
 *
 * @param requestedCount - Number of questions requested
 * @param section - The section type
 * @param track - Optional academic track
 * @returns Object indicating if valid and the actual limit
 */
export function validatePracticeQuestionCount(
  requestedCount: number,
  section: QuestionSection,
  track?: AcademicTrack | null
): { isValid: boolean; maxAllowed: number; requestedCount: number } {
  const maxAllowed = calculatePracticeLimit(section, track)

  return {
    isValid: requestedCount <= maxAllowed,
    maxAllowed,
    requestedCount,
  }
}
