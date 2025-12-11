'use client'

import { cn } from '@/lib/utils'

export interface QuestionCardProps {
  questionNumber: number
  totalQuestions: number
  stem: string
  passage?: string
  section: 'verbal' | 'quantitative'
  topic?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  className?: string
}

const DIFFICULTY_LABELS = {
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب',
}

const SECTION_LABELS = {
  verbal: 'لفظي',
  quantitative: 'كمي',
}

/**
 * QuestionCard - Displays exam question with Arabic RTL support
 */
export function QuestionCard({
  questionNumber,
  totalQuestions,
  stem,
  passage,
  section,
  topic,
  difficulty,
  className,
}: QuestionCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-sm p-6',
        className
      )}
      dir="rtl"
    >
      {/* Question Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold text-lg">
            {questionNumber}
          </span>
          <span className="text-gray-500 text-sm">من {totalQuestions}</span>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Reading Passage (if verbal with passage) */}
      {passage && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            اقرأ النص التالي:
          </h3>
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {passage}
          </p>
        </div>
      )}

      {/* Question Stem */}
      <div className="text-lg text-gray-900 leading-relaxed">
        <p className="whitespace-pre-wrap">{stem}</p>
      </div>

      {/* Topic hint (optional) */}
      {topic && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-400">التصنيف: {topic}</span>
        </div>
      )}
    </div>
  )
}

export default QuestionCard
