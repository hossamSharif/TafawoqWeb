'use client'

import { cn } from '@/lib/utils'
import { QuestionHeader, type QuestionHeaderProps } from './QuestionHeader'

export interface TextOnlyQuestionProps extends Omit<QuestionHeaderProps, 'className'> {
  stem: string
  className?: string
}

/**
 * TextOnlyQuestion - Displays text-based questions with proper Arabic RTL layout
 * Optimized line height and spacing for Arabic readability
 */
export function TextOnlyQuestion({
  questionNumber,
  totalQuestions,
  section,
  difficulty,
  category,
  showCategory,
  stem,
  className,
}: TextOnlyQuestionProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-sm p-6',
        className
      )}
      dir="rtl"
    >
      {/* Question Header */}
      <QuestionHeader
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        section={section}
        difficulty={difficulty}
        category={category}
        showCategory={showCategory}
        className="mb-4"
      />

      {/* Question Stem */}
      <div className="mt-4">
        <p
          className={cn(
            'text-lg text-gray-900',
            // Arabic-optimized line height and spacing
            'leading-loose',
            // Preserve whitespace formatting
            'whitespace-pre-wrap'
          )}
        >
          {stem}
        </p>
      </div>
    </div>
  )
}

export default TextOnlyQuestion
