import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { ReviewQuestion } from '@/components/results/QuestionReview'
import type { ReviewFilters, ReviewFilterStatus, ReviewSortOrder, ReviewDifficulty } from '@/types/review'
import {
  DEFAULT_FILTERS,
  applyFilters,
  getUniqueCategories,
  hasActiveFilters,
  getActiveFilterCount,
  parseFiltersFromURL,
  filtersToURLParams,
} from '@/lib/review/filters'

export interface UseReviewFiltersOptions {
  questions: ReviewQuestion[]
  bookmarkedIndices?: Set<number>
  enableURLState?: boolean
}

export interface UseReviewFiltersReturn {
  filters: ReviewFilters
  filteredQuestions: ReviewQuestion[]
  availableCategories: string[]
  isFiltered: boolean
  activeFilterCount: number
  setStatusFilter: (status: ReviewFilterStatus) => void
  toggleCategory: (category: string) => void
  toggleDifficulty: (difficulty: ReviewDifficulty) => void
  setSortOrder: (sortOrder: ReviewSortOrder) => void
  resetFilters: () => void
  setFilters: (filters: Partial<ReviewFilters>) => void
}

/**
 * useReviewFilters - Manage review question filtering and sorting
 *
 * Features:
 * - Filter by status (correct/incorrect/unanswered/bookmarked)
 * - Filter by categories and difficulties
 * - Sort by performance, difficulty, or time
 * - URL state synchronization (optional)
 * - Memoized filtered questions for performance
 */
export function useReviewFilters({
  questions,
  bookmarkedIndices,
  enableURLState = true,
}: UseReviewFiltersOptions): UseReviewFiltersReturn {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize filters from URL if enabled
  const initialFilters = useMemo(() => {
    if (enableURLState && searchParams) {
      const urlFilters = parseFiltersFromURL(searchParams)
      return { ...DEFAULT_FILTERS, ...urlFilters }
    }
    return DEFAULT_FILTERS
  }, [enableURLState, searchParams])

  const [filters, setFiltersState] = useState<ReviewFilters>(initialFilters)

  // Update URL when filters change
  useEffect(() => {
    if (!enableURLState) return

    const params = filtersToURLParams(filters)
    const newURL = params.toString()
      ? `?${params.toString()}`
      : window.location.pathname

    // Only update if URL actually changed
    if (newURL !== window.location.pathname + window.location.search) {
      router.replace(newURL, { scroll: false })
    }
  }, [filters, enableURLState, router])

  // Get available categories from questions
  const availableCategories = useMemo(
    () => getUniqueCategories(questions),
    [questions]
  )

  // Apply filters to questions (memoized for performance)
  const filteredQuestions = useMemo(
    () => applyFilters(questions, filters, bookmarkedIndices),
    [questions, filters, bookmarkedIndices]
  )

  // Check if any filters are active
  const isFiltered = useMemo(() => hasActiveFilters(filters), [filters])

  // Get active filter count
  const activeFilterCount = useMemo(() => getActiveFilterCount(filters), [filters])

  // Filter setter functions
  const setStatusFilter = useCallback((status: ReviewFilterStatus) => {
    setFiltersState((prev) => ({ ...prev, status }))
  }, [])

  const toggleCategory = useCallback((category: string) => {
    setFiltersState((prev) => {
      const categories = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category]
      return { ...prev, categories }
    })
  }, [])

  const toggleDifficulty = useCallback((difficulty: ReviewDifficulty) => {
    setFiltersState((prev) => {
      const difficulties = prev.difficulties.includes(difficulty)
        ? prev.difficulties.filter((d) => d !== difficulty)
        : [...prev.difficulties, difficulty]
      return { ...prev, difficulties }
    })
  }, [])

  const setSortOrder = useCallback((sortOrder: ReviewSortOrder) => {
    setFiltersState((prev) => ({ ...prev, sortOrder }))
  }, [])

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS)
  }, [])

  const setFilters = useCallback((newFilters: Partial<ReviewFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }))
  }, [])

  return {
    filters,
    filteredQuestions,
    availableCategories,
    isFiltered,
    activeFilterCount,
    setStatusFilter,
    toggleCategory,
    toggleDifficulty,
    setSortOrder,
    resetFilters,
    setFilters,
  }
}

export default useReviewFilters
