'use client'

import { cn } from '@/lib/utils'
import { DIFFICULTY_LABELS, type QuestionDifficulty } from '@/types/question'

interface DifficultySelectorProps {
  value: QuestionDifficulty | null
  onChange: (difficulty: QuestionDifficulty) => void
  disabled?: boolean
}

interface DifficultyOption {
  id: QuestionDifficulty
  label: string
  description: string
  color: string
  bgColor: string
  borderColor: string
}

const difficulties: DifficultyOption[] = [
  {
    id: 'easy',
    label: DIFFICULTY_LABELS.easy,
    description: 'للمبتدئين والمراجعة الأساسية',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-500',
  },
  {
    id: 'medium',
    label: DIFFICULTY_LABELS.medium,
    description: 'للتدريب المتوازن',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-500',
  },
  {
    id: 'hard',
    label: DIFFICULTY_LABELS.hard,
    description: 'للتحدي والإتقان',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500',
  },
]

export function DifficultySelector({
  value,
  onChange,
  disabled = false,
}: DifficultySelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">اختر مستوى الصعوبة</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {difficulties.map((difficulty) => (
          <button
            key={difficulty.id}
            type="button"
            onClick={() => onChange(difficulty.id)}
            disabled={disabled}
            className={cn(
              'relative flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all duration-200',
              'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2',
              value === difficulty.id
                ? [
                    difficulty.bgColor,
                    difficulty.borderColor,
                    difficulty.color,
                    'shadow-sm',
                  ]
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
              disabled && 'cursor-not-allowed opacity-50',
              // Focus ring color based on difficulty
              difficulty.id === 'easy' && 'focus:ring-green-500',
              difficulty.id === 'medium' && 'focus:ring-amber-500',
              difficulty.id === 'hard' && 'focus:ring-red-500'
            )}
          >
            {/* Selected indicator */}
            {value === difficulty.id && (
              <div className="absolute top-2 left-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path
                    d="m9 12 2 2 4-4"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
            )}

            {/* Difficulty level indicator */}
            <div className="flex gap-1">
              {[1, 2, 3].map((level) => (
                <div
                  key={level}
                  className={cn(
                    'h-2 w-6 rounded-full transition-colors',
                    value === difficulty.id
                      ? (difficulty.id === 'easy' && level <= 1) ||
                        (difficulty.id === 'medium' && level <= 2) ||
                        difficulty.id === 'hard'
                        ? difficulty.id === 'easy'
                          ? 'bg-green-500'
                          : difficulty.id === 'medium'
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        : 'bg-gray-200'
                      : (difficulty.id === 'easy' && level <= 1) ||
                          (difficulty.id === 'medium' && level <= 2) ||
                          difficulty.id === 'hard'
                        ? 'bg-gray-400'
                        : 'bg-gray-200'
                  )}
                />
              ))}
            </div>

            {/* Label */}
            <span className="text-lg font-bold">{difficulty.label}</span>

            {/* Description */}
            <span
              className={cn(
                'text-xs text-center',
                value === difficulty.id ? difficulty.color : 'text-gray-500'
              )}
            >
              {difficulty.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default DifficultySelector
