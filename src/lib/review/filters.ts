import type { ReviewQuestion } from '@/components/results/QuestionReview'
import type { ReviewFilters, ReviewFilterStatus, ReviewSortOrder } from '@/types/review'

/**
 * Filter utilities for review questions
 */

// Default filter state
export const DEFAULT_FILTERS: ReviewFilters = {
  status: 'all',
  categories: [],
  difficulties: [],
  sortOrder: 'original',
}

/**
 * Apply status filter to questions
 */
export function filterByStatus(
  questions: ReviewQuestion[],
  status: ReviewFilterStatus,
  bookmarkedIndices?: Set<number>
): ReviewQuestion[] {
  switch (status) {
    case 'correct':
      return questions.filter((q) => q.isCorrect)

    case 'incorrect':
      return questions.filter((q) => !q.isCorrect && q.selectedAnswer !== null)

    case 'unanswered':
      return questions.filter((q) => q.selectedAnswer === null)

    case 'bookmarked':
      if (!bookmarkedIndices) return questions
      return questions.filter((q) => bookmarkedIndices.has(q.index))

    case 'all':
    default:
      return questions
  }
}

/**
 * Apply category filter to questions
 */
export function filterByCategories(
  questions: ReviewQuestion[],
  categories: string[]
): ReviewQuestion[] {
  if (categories.length === 0) return questions

  return questions.filter((q) => categories.includes(q.topic))
}

/**
 * Apply difficulty filter to questions
 */
export function filterByDifficulties(
  questions: ReviewQuestion[],
  difficulties: string[]
): ReviewQuestion[] {
  if (difficulties.length === 0) return questions

  return questions.filter((q) => difficulties.includes(q.difficulty))
}

/**
 * Sort questions based on sort order
 */
export function sortQuestions(
  questions: ReviewQuestion[],
  sortOrder: ReviewSortOrder
): ReviewQuestion[] {
  const sorted = [...questions]

  switch (sortOrder) {
    case 'performance':
      // Incorrect first, then unanswered, then correct
      return sorted.sort((a, b) => {
        if (a.isCorrect === b.isCorrect) {
          if (a.selectedAnswer === null && b.selectedAnswer !== null) return 1
          if (a.selectedAnswer !== null && b.selectedAnswer === null) return -1
          return 0
        }
        return a.isCorrect ? 1 : -1
      })

    case 'difficulty':
      // Hard first, then medium, then easy
      return sorted.sort((a, b) => {
        const difficultyOrder = { hard: 0, medium: 1, easy: 2 }
        const aOrder = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] ?? 3
        const bOrder = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] ?? 3
        return aOrder - bOrder
      })

    case 'time':
      // Longest time first
      return sorted.sort((a, b) => b.timeSpentSeconds - a.timeSpentSeconds)

    case 'original':
    default:
      // Keep original order (by index)
      return sorted.sort((a, b) => a.index - b.index)
  }
}

/**
 * Apply all filters to questions
 */
export function applyFilters(
  questions: ReviewQuestion[],
  filters: ReviewFilters,
  bookmarkedIndices?: Set<number>
): ReviewQuestion[] {
  let filtered = questions

  // Apply status filter
  filtered = filterByStatus(filtered, filters.status, bookmarkedIndices)

  // Apply category filter
  filtered = filterByCategories(filtered, filters.categories)

  // Apply difficulty filter
  filtered = filterByDifficulties(filtered, filters.difficulties)

  // Apply sort
  filtered = sortQuestions(filtered, filters.sortOrder)

  return filtered
}

/**
 * Get unique categories from questions
 */
export function getUniqueCategories(questions: ReviewQuestion[]): string[] {
  const categories = new Set(questions.map((q) => q.topic))
  return Array.from(categories).sort()
}

/**
 * Get unique sections from questions
 */
export function getUniqueSections(questions: ReviewQuestion[]): string[] {
  const sections = new Set(questions.map((q) => q.section))
  return Array.from(sections).sort()
}

/**
 * Check if filters are active (non-default)
 */
export function hasActiveFilters(filters: ReviewFilters): boolean {
  return (
    filters.status !== 'all' ||
    filters.categories.length > 0 ||
    filters.difficulties.length > 0 ||
    filters.sortOrder !== 'original'
  )
}

/**
 * Get filter count (number of active filters)
 */
export function getActiveFilterCount(filters: ReviewFilters): number {
  let count = 0

  if (filters.status !== 'all') count++
  if (filters.categories.length > 0) count += filters.categories.length
  if (filters.difficulties.length > 0) count += filters.difficulties.length
  if (filters.sortOrder !== 'original') count++

  return count
}

/**
 * Parse filters from URL search params
 */
export function parseFiltersFromURL(searchParams: URLSearchParams): Partial<ReviewFilters> {
  const filters: Partial<ReviewFilters> = {}

  const status = searchParams.get('status')
  if (status && ['all', 'correct', 'incorrect', 'unanswered', 'bookmarked'].includes(status)) {
    filters.status = status as ReviewFilterStatus
  }

  const categories = searchParams.get('categories')
  if (categories) {
    filters.categories = categories.split(',').filter(Boolean)
  }

  const difficulties = searchParams.get('difficulties')
  if (difficulties) {
    filters.difficulties = difficulties.split(',').filter(Boolean) as ('easy' | 'medium' | 'hard')[]
  }

  const sort = searchParams.get('sort')
  if (sort && ['original', 'performance', 'difficulty', 'time'].includes(sort)) {
    filters.sortOrder = sort as ReviewSortOrder
  }

  return filters
}

/**
 * Convert filters to URL search params
 */
export function filtersToURLParams(filters: ReviewFilters): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.status !== 'all') {
    params.set('status', filters.status)
  }

  if (filters.categories.length > 0) {
    params.set('categories', filters.categories.join(','))
  }

  if (filters.difficulties.length > 0) {
    params.set('difficulties', filters.difficulties.join(','))
  }

  if (filters.sortOrder !== 'original') {
    params.set('sort', filters.sortOrder)
  }

  return params
}
