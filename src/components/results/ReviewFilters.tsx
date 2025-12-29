'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Filter,
  X,
  CheckCircle2,
  XCircle,
  Circle,
  Star,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react'
import type { ReviewFilters, ReviewFilterStatus, ReviewSortOrder, ReviewDifficulty } from '@/types/review'
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/types/review'

export interface ReviewFiltersProps {
  filters: ReviewFilters
  availableCategories: string[]
  activeFilterCount: number
  onStatusChange: (status: ReviewFilterStatus) => void
  onCategoryToggle: (category: string) => void
  onDifficultyToggle: (difficulty: ReviewDifficulty) => void
  onSortChange: (sort: ReviewSortOrder) => void
  onReset: () => void
  className?: string
}

/**
 * ReviewFilters - Desktop filter panel for review questions
 */
export function ReviewFilters({
  filters,
  availableCategories,
  activeFilterCount,
  onStatusChange,
  onCategoryToggle,
  onDifficultyToggle,
  onSortChange,
  onReset,
  className,
}: ReviewFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const statusOptions: { value: ReviewFilterStatus; label: string; icon: any; color: string }[] = [
    { value: 'all', label: 'جميع الأسئلة', icon: Circle, color: 'text-gray-600' },
    { value: 'correct', label: 'الإجابات الصحيحة', icon: CheckCircle2, color: 'text-green-600' },
    { value: 'incorrect', label: 'الإجابات الخاطئة', icon: XCircle, color: 'text-red-600' },
    { value: 'unanswered', label: 'لم يتم الإجابة', icon: Circle, color: 'text-gray-400' },
    { value: 'bookmarked', label: 'الأسئلة المحفوظة', icon: Star, color: 'text-yellow-600' },
  ]

  const sortOptions: { value: ReviewSortOrder; label: string }[] = [
    { value: 'original', label: 'الترتيب الأصلي' },
    { value: 'performance', label: 'حسب الأداء (الخاطئة أولاً)' },
    { value: 'difficulty', label: 'حسب الصعوبة (الصعبة أولاً)' },
    { value: 'time', label: 'حسب الوقت (الأطول أولاً)' },
  ]

  const difficultyOptions: ReviewDifficulty[] = ['easy', 'medium', 'hard']

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg', className)} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900">تصفية الأسئلة</h3>
          {activeFilterCount > 0 && (
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
              {activeFilterCount}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <RotateCcw className="w-4 h-4 ml-2" />
              إعادة تعيين
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="sm:hidden"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Filter Content */}
      <div className={cn('p-4 space-y-6', !isExpanded && 'hidden sm:block')}>
        {/* Quick Status Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            حالة الإجابة
          </label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => {
              const Icon = option.icon
              const isActive = filters.status === option.value

              return (
                <button
                  key={option.value}
                  onClick={() => onStatusChange(option.value)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all',
                    'text-sm font-medium',
                    isActive
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                >
                  <Icon className={cn('w-4 h-4', isActive ? 'text-primary' : option.color)} />
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Category Filters */}
        {availableCategories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              التصنيفات ({filters.categories.length} محدد)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {availableCategories.map((category) => {
                const isSelected = filters.categories.includes(category)
                const label = CATEGORY_LABELS[category] || category

                return (
                  <button
                    key={category}
                    onClick={() => onCategoryToggle(category)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-right',
                      'text-sm',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                        isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                      )}
                    >
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className="truncate">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Difficulty Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            مستوى الصعوبة ({filters.difficulties.length} محدد)
          </label>
          <div className="flex flex-wrap gap-2">
            {difficultyOptions.map((difficulty) => {
              const isSelected = filters.difficulties.includes(difficulty)
              const label = DIFFICULTY_LABELS[difficulty]

              return (
                <button
                  key={difficulty}
                  onClick={() => onDifficultyToggle(difficulty)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all',
                    'text-sm font-medium min-w-[100px] justify-center',
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            ترتيب الأسئلة
          </label>
          <select
            value={filters.sortOrder}
            onChange={(e) => onSortChange(e.target.value as ReviewSortOrder)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

export default ReviewFilters
