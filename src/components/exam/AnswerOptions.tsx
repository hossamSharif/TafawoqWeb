'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'

export interface AnswerOptionsProps {
  choices: [string, string, string, string]
  selectedAnswer?: number | null
  correctAnswer?: number | null
  showResult?: boolean
  disabled?: boolean
  onSelect?: (index: number) => void
  className?: string
}

const OPTION_LABELS = ['أ', 'ب', 'ج', 'د'] as const

/**
 * AnswerOptions - 4-option MCQ layout with RTL support
 */
export function AnswerOptions({
  choices,
  selectedAnswer,
  correctAnswer,
  showResult = false,
  disabled = false,
  onSelect,
  className,
}: AnswerOptionsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const handleSelect = (index: number) => {
    if (disabled) return
    onSelect?.(index)
  }

  const getOptionState = (index: number) => {
    if (!showResult) {
      return selectedAnswer === index ? 'selected' : 'default'
    }

    // Show results
    if (index === correctAnswer) {
      return 'correct'
    }
    if (index === selectedAnswer && selectedAnswer !== correctAnswer) {
      return 'incorrect'
    }
    return 'default'
  }

  return (
    <div className={cn('space-y-3', className)} dir="rtl">
      {choices.map((choice, index) => {
        const state = getOptionState(index)
        const isSelected = selectedAnswer === index
        const isHovered = hoveredIndex === index && !disabled

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleSelect(index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            disabled={disabled}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200 text-right',
              // Default state
              state === 'default' && [
                'border-gray-200 bg-white',
                !disabled && 'hover:border-primary/50 hover:bg-primary/5',
                isSelected && 'border-primary bg-primary/10',
              ],
              // Correct answer
              state === 'correct' && [
                'border-green-500 bg-green-50',
                'cursor-default',
              ],
              // Incorrect answer
              state === 'incorrect' && [
                'border-red-500 bg-red-50',
                'cursor-default',
              ],
              // Disabled state
              disabled && !showResult && 'cursor-not-allowed opacity-70'
            )}
          >
            {/* Option Label */}
            <span
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors',
                state === 'default' && [
                  'bg-gray-100 text-gray-600',
                  isSelected && 'bg-primary text-white',
                  isHovered && !isSelected && 'bg-gray-200',
                ],
                state === 'correct' && 'bg-green-500 text-white',
                state === 'incorrect' && 'bg-red-500 text-white'
              )}
            >
              {state === 'correct' ? (
                <Check className="w-5 h-5" />
              ) : state === 'incorrect' ? (
                <X className="w-5 h-5" />
              ) : (
                OPTION_LABELS[index]
              )}
            </span>

            {/* Choice Text */}
            <span
              className={cn(
                'flex-1 text-base leading-relaxed',
                state === 'default' && 'text-gray-800',
                state === 'correct' && 'text-green-800 font-medium',
                state === 'incorrect' && 'text-red-800'
              )}
            >
              {choice}
            </span>

            {/* Result Indicator */}
            {showResult && state === 'correct' && (
              <span className="flex-shrink-0 text-sm text-green-600 font-medium">
                إجابة صحيحة
              </span>
            )}
            {showResult && state === 'incorrect' && (
              <span className="flex-shrink-0 text-sm text-red-600 font-medium">
                إجابة خاطئة
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default AnswerOptions
