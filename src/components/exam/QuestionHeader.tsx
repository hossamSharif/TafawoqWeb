'use client'

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import type { QuestionSection, QuestionDifficulty, QuestionCategory } from '@/types/question'
import { SECTION_LABELS, DIFFICULTY_LABELS, CATEGORY_LABELS } from '@/types/question'

export interface QuestionHeaderProps {
  questionNumber: number
  totalQuestions: number
  section: QuestionSection
  difficulty?: QuestionDifficulty
  category?: QuestionCategory
  showCategory?: boolean
  isLoadingBatch?: boolean
  className?: string
}

/**
 * QuestionHeader - Displays question metadata (number, section, difficulty, category)
 * Extracted for reuse across different question type components
 * Now includes loading spinner for batch loading states
 */
export function QuestionHeader({
  questionNumber,
  totalQuestions,
  section,
  difficulty,
  category,
  showCategory = true,
  isLoadingBatch = false,
  className,
}: QuestionHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between pb-4 border-b border-gray-100',
        className
      )}
      dir="rtl"
    >
      {/* Question number, progress, and loading indicator */}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold text-lg">
          {questionNumber}
        </span>
        <span className="text-gray-500 text-sm">من {totalQuestions}</span>
        {isLoadingBatch && (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        )}
      </div>

      {/* Badges - Section, Difficulty, Category */}
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {/* Category Badge (moved from footer to header) */}
        {showCategory && category && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {CATEGORY_LABELS[category]}
          </span>
        )}

        {/* Section Badge */}
        <span
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium',
            section === 'quantitative'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-purple-100 text-purple-800'
          )}
        >
          {SECTION_LABELS[section]}
        </span>

        {/* Difficulty Badge */}
        {difficulty && (
          <span
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium',
              difficulty === 'easy' && 'bg-green-100 text-green-800',
              difficulty === 'medium' && 'bg-yellow-100 text-yellow-800',
              difficulty === 'hard' && 'bg-red-100 text-red-800'
            )}
          >
            {DIFFICULTY_LABELS[difficulty]}
          </span>
        )}
      </div>
    </div>
  )
}

export default QuestionHeader
