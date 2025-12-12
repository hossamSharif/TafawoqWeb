'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuestionHeader, type QuestionHeaderProps } from './QuestionHeader'
import { Button } from '@/components/ui/button'

export interface ReadingPassageQuestionProps extends Omit<QuestionHeaderProps, 'className'> {
  stem: string
  passage: string
  passageTitle?: string
  wordCount?: number
  questionIndex?: number // Index within the passage group (e.g., 2/5)
  totalPassageQuestions?: number
  className?: string
}

/**
 * ReadingPassageQuestion - Displays reading comprehension questions with expandable passage
 * Optimized for Arabic text with proper RTL layout and line height
 */
export function ReadingPassageQuestion({
  questionNumber,
  totalQuestions,
  section,
  difficulty,
  category,
  showCategory,
  stem,
  passage,
  passageTitle,
  wordCount,
  questionIndex,
  totalPassageQuestions,
  className,
}: ReadingPassageQuestionProps) {
  const [isPassageExpanded, setIsPassageExpanded] = useState(true)

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

      {/* Reading Passage Section */}
      <div className="mb-6">
        {/* Passage Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-medium text-gray-700">
              {passageTitle || 'اقرأ النص التالي:'}
            </h3>
            {wordCount && (
              <span className="text-xs text-gray-400">({wordCount} كلمة)</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Question index within passage */}
            {questionIndex !== undefined && totalPassageQuestions && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                السؤال {questionIndex} من {totalPassageQuestions}
              </span>
            )}

            {/* Expand/Collapse button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPassageExpanded(!isPassageExpanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isPassageExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 ml-1" />
                  <span className="text-xs">إخفاء النص</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 ml-1" />
                  <span className="text-xs">عرض النص</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Passage Content */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-300',
            isPassageExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <p
              className={cn(
                'text-gray-800',
                // Arabic-optimized line height for readability
                'leading-[2]',
                // Text justification for Arabic
                'text-justify',
                // Preserve paragraph formatting
                'whitespace-pre-wrap'
              )}
            >
              {passage}
            </p>
          </div>
        </div>

        {/* Collapsed indicator */}
        {!isPassageExpanded && (
          <div
            className="p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => setIsPassageExpanded(true)}
          >
            <p className="text-gray-500 text-sm text-center">
              انقر لعرض النص...
            </p>
          </div>
        )}
      </div>

      {/* Question Stem */}
      <div className="pt-4 border-t border-gray-100">
        <p
          className={cn(
            'text-lg text-gray-900',
            'leading-loose',
            'whitespace-pre-wrap'
          )}
        >
          {stem}
        </p>
      </div>
    </div>
  )
}

export default ReadingPassageQuestion
