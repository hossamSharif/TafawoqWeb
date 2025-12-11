'use client'

import { cn } from '@/lib/utils'
import { Check, Circle, CircleDot } from 'lucide-react'

export interface QuestionStatus {
  index: number
  isAnswered: boolean
  isCorrect?: boolean
  isCurrent?: boolean
}

export interface ProgressIndicatorProps {
  /** Current question index (0-based) */
  currentIndex: number
  /** Total number of questions */
  totalQuestions: number
  /** Answered questions info */
  answeredQuestions?: Set<number> | number[]
  /** Optional: map of question index to correctness */
  correctnessMap?: Map<number, boolean>
  /** Whether to show correctness indicators */
  showCorrectness?: boolean
  /** Called when a question is clicked */
  onQuestionClick?: (index: number) => void
  /** Whether navigation is allowed */
  allowNavigation?: boolean
  /** Compact mode for smaller displays */
  compact?: boolean
  className?: string
}

/**
 * ProgressIndicator - Shows question progress with navigation
 */
export function ProgressIndicator({
  currentIndex,
  totalQuestions,
  answeredQuestions = [],
  correctnessMap,
  showCorrectness = false,
  onQuestionClick,
  allowNavigation = true,
  compact = false,
  className,
}: ProgressIndicatorProps) {
  const answeredSet =
    answeredQuestions instanceof Set
      ? answeredQuestions
      : new Set(answeredQuestions)

  const answeredCount = answeredSet.size
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100)

  const handleClick = (index: number) => {
    if (!allowNavigation) return
    onQuestionClick?.(index)
  }

  // For large question counts, show paginated view
  const showPagination = totalQuestions > 20

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)} dir="rtl">
        {/* Current / Total */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary">
            {currentIndex + 1}
          </span>
          <span className="text-gray-400">/</span>
          <span className="text-lg text-gray-600">{totalQuestions}</span>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Answered Count */}
        <span className="text-sm text-gray-500">
          {answeredCount} تم إجابتها
        </span>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)} dir="rtl">
      {/* Summary Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-800">
            السؤال {currentIndex + 1} من {totalQuestions}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-green-600">
            <Check className="w-4 h-4 inline ml-1" />
            {answeredCount} تم إجابتها
          </span>
          <span className="text-gray-500">
            {totalQuestions - answeredCount} متبقية
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Question Grid */}
      {!showPagination && (
        <div className="grid grid-cols-12 gap-2">
          {Array.from({ length: totalQuestions }, (_, i) => {
            const isAnswered = answeredSet.has(i)
            const isCurrent = i === currentIndex
            const isCorrect = showCorrectness
              ? correctnessMap?.get(i)
              : undefined

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleClick(i)}
                disabled={!allowNavigation}
                className={cn(
                  'aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all',
                  // Current question
                  isCurrent && 'ring-2 ring-primary ring-offset-2',
                  // Answered states
                  !showCorrectness && isAnswered && 'bg-green-500 text-white',
                  !showCorrectness && !isAnswered && 'bg-gray-200 text-gray-600',
                  // With correctness
                  showCorrectness && isCorrect === true && 'bg-green-500 text-white',
                  showCorrectness && isCorrect === false && 'bg-red-500 text-white',
                  showCorrectness &&
                    isCorrect === undefined &&
                    !isAnswered &&
                    'bg-gray-200 text-gray-600',
                  showCorrectness &&
                    isCorrect === undefined &&
                    isAnswered &&
                    'bg-yellow-500 text-white',
                  // Hover
                  allowNavigation && 'hover:scale-110 cursor-pointer',
                  !allowNavigation && 'cursor-default'
                )}
                title={`السؤال ${i + 1}`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
      )}

      {/* Paginated View for large question counts */}
      {showPagination && (
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: totalQuestions }, (_, i) => {
            const isAnswered = answeredSet.has(i)
            const isCurrent = i === currentIndex
            const isCorrect = showCorrectness
              ? correctnessMap?.get(i)
              : undefined

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleClick(i)}
                disabled={!allowNavigation}
                className={cn(
                  'w-6 h-6 rounded flex items-center justify-center text-[10px] font-medium transition-all',
                  // Current question
                  isCurrent && 'ring-2 ring-primary',
                  // Answered states
                  !showCorrectness && isAnswered && 'bg-green-500 text-white',
                  !showCorrectness && !isAnswered && 'bg-gray-100 text-gray-500',
                  // With correctness
                  showCorrectness && isCorrect === true && 'bg-green-500 text-white',
                  showCorrectness && isCorrect === false && 'bg-red-500 text-white',
                  showCorrectness &&
                    isCorrect === undefined &&
                    'bg-gray-100 text-gray-500',
                  // Hover
                  allowNavigation && 'hover:opacity-80 cursor-pointer'
                )}
                title={`السؤال ${i + 1}`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-200" />
          <span>لم تُجب</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>تم الإجابة</span>
        </div>
        {showCorrectness && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span>خطأ</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProgressIndicator
