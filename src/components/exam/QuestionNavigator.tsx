'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Grid3X3, X, Check, Star, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export interface QuestionNavigatorProps {
  currentIndex: number
  totalQuestions: number
  answeredQuestions: Set<number>
  onQuestionClick: (index: number) => void
  className?: string
  // Review mode: differentiate between correct and incorrect answers
  correctAnswers?: Set<number>
  incorrectAnswers?: Set<number>
  // Review mode: show bookmarks and notes (Phase 3)
  bookmarkedIndices?: Set<number>
  notedIndices?: Set<number>
}

/**
 * QuestionNavigator - Horizontal scrollable pills with question numbers
 * Provides quick navigation between questions with visual status indicators
 */
export function QuestionNavigator({
  currentIndex,
  totalQuestions,
  answeredQuestions,
  onQuestionClick,
  className,
  correctAnswers,
  incorrectAnswers,
  bookmarkedIndices,
  notedIndices,
}: QuestionNavigatorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isGridOpen, setIsGridOpen] = useState(false)

  // Check scroll position
  const updateScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    setCanScrollLeft(container.scrollLeft > 0)
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 5
    )
  }, [])

  // Scroll to current question pill
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const currentPill = container.children[currentIndex] as HTMLElement
    if (currentPill) {
      const containerRect = container.getBoundingClientRect()
      const pillRect = currentPill.getBoundingClientRect()

      // Check if pill is outside visible area
      if (pillRect.right > containerRect.right || pillRect.left < containerRect.left) {
        currentPill.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        })
      }
    }

    updateScrollButtons()
  }, [currentIndex, updateScrollButtons])

  // Update scroll buttons on scroll
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    container.addEventListener('scroll', updateScrollButtons)
    window.addEventListener('resize', updateScrollButtons)
    updateScrollButtons()

    return () => {
      container.removeEventListener('scroll', updateScrollButtons)
      window.removeEventListener('resize', updateScrollButtons)
    }
  }, [updateScrollButtons])

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -200, behavior: 'smooth' })
  }

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 200, behavior: 'smooth' })
  }

  // Determine if we're in review mode (correctAnswers/incorrectAnswers provided)
  const isReviewMode = Boolean(correctAnswers || incorrectAnswers)

  const answeredCount = answeredQuestions.size
  const remainingCount = totalQuestions - answeredCount
  const correctCount = correctAnswers?.size || 0
  const incorrectCount = incorrectAnswers?.size || 0

  return (
    <div className={cn('relative', className)} dir="rtl">
      <div className="flex items-center gap-2">
        {/* Grid View Button */}
        <Sheet open={isGridOpen} onOpenChange={setIsGridOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 h-10 w-10 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[60vh]" dir="rtl">
            <SheetHeader className="text-right mb-4">
              <SheetTitle>قائمة الأسئلة</SheetTitle>
            </SheetHeader>

            {/* Stats */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 mb-6 text-sm">
              {isReviewMode ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-600">{correctCount} صحيح</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                      <X className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-600">{incorrectCount} خطأ</span>
                  </div>
                  {remainingCount > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-200" />
                      <span className="text-gray-600">{remainingCount} لم يتم الإجابة</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-600">{answeredCount} تم الإجابة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-200" />
                    <span className="text-gray-600">{remainingCount} متبقي</span>
                  </div>
                </>
              )}
            </div>

            {/* Full Grid */}
            <div className="grid grid-cols-8 sm:grid-cols-10 gap-2 px-2 pb-8 max-h-[45vh] overflow-y-auto">
              {Array.from({ length: totalQuestions }, (_, i) => {
                const isAnswered = answeredQuestions.has(i)
                const isCurrent = i === currentIndex
                const isCorrect = correctAnswers?.has(i) || false
                const isIncorrect = incorrectAnswers?.has(i) || false
                const isBookmarked = bookmarkedIndices?.has(i) || false
                const hasNote = notedIndices?.has(i) || false

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onQuestionClick(i)
                      setIsGridOpen(false)
                    }}
                    className={cn(
                      'relative aspect-square rounded-lg flex items-center justify-center text-sm font-semibold transition-all',
                      'border-2',
                      isCurrent && 'ring-2 ring-primary ring-offset-2 scale-110',
                      // Review mode coloring
                      isReviewMode && isCorrect && [
                        'bg-green-500 text-white border-green-600',
                      ],
                      isReviewMode && isIncorrect && [
                        'bg-red-500 text-white border-red-600',
                      ],
                      isReviewMode && !isCorrect && !isIncorrect && [
                        'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200',
                      ],
                      // Exam mode coloring (original)
                      !isReviewMode && isAnswered && [
                        'bg-green-500 text-white border-green-600',
                      ],
                      !isReviewMode && !isAnswered && [
                        'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200',
                      ],
                      'active:scale-95'
                    )}
                  >
                    {i + 1}

                    {/* Bookmark Badge */}
                    {isBookmarked && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center shadow-sm">
                        <Star size={10} className="text-white fill-white" />
                      </div>
                    )}

                    {/* Note Badge */}
                    {hasNote && (
                      <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
                        <FileText size={10} className="text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>

        {/* Scroll Left Button (appears on right in RTL) */}
        <button
          type="button"
          onClick={scrollRight}
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center transition-opacity',
            canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          aria-label="التمرير لليسار"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>

        {/* Scrollable Pills Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {Array.from({ length: totalQuestions }, (_, i) => {
            const isAnswered = answeredQuestions.has(i)
            const isCurrent = i === currentIndex
            const isCorrect = correctAnswers?.has(i) || false
            const isIncorrect = incorrectAnswers?.has(i) || false
            const isBookmarked = bookmarkedIndices?.has(i) || false
            const hasNote = notedIndices?.has(i) || false

            return (
              <button
                key={i}
                type="button"
                onClick={() => onQuestionClick(i)}
                className={cn(
                  'relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                  'border-2',
                  // Current question
                  isCurrent && [
                    'bg-primary text-white border-primary',
                    'shadow-lg shadow-primary/30',
                    'scale-110',
                  ],
                  // Review mode coloring (not current)
                  !isCurrent && isReviewMode && isCorrect && [
                    'bg-green-500 text-white border-green-600',
                  ],
                  !isCurrent && isReviewMode && isIncorrect && [
                    'bg-red-500 text-white border-red-600',
                  ],
                  !isCurrent && isReviewMode && !isCorrect && !isIncorrect && [
                    'bg-white text-gray-600 border-gray-300',
                    'hover:border-primary hover:text-primary',
                  ],
                  // Exam mode coloring (original, not current)
                  !isCurrent && !isReviewMode && isAnswered && [
                    'bg-green-500 text-white border-green-600',
                  ],
                  !isCurrent && !isReviewMode && !isAnswered && [
                    'bg-white text-gray-600 border-gray-300',
                    'hover:border-primary hover:text-primary',
                  ],
                  'active:scale-95'
                )}
              >
                {!isCurrent && isAnswered && !isReviewMode ? (
                  <Check className="w-4 h-4" />
                ) : (
                  i + 1
                )}

                {/* Bookmark Badge */}
                {isBookmarked && (
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-yellow-500 flex items-center justify-center shadow-sm border border-white">
                    <Star size={8} className="text-white fill-white" />
                  </div>
                )}

                {/* Note Badge */}
                {hasNote && (
                  <div className="absolute -top-0.5 -left-0.5 w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center shadow-sm border border-white">
                    <FileText size={8} className="text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Scroll Right Button (appears on left in RTL) */}
        <button
          type="button"
          onClick={scrollLeft}
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center transition-opacity',
            canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          aria-label="التمرير لليمين"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-l from-green-500 to-green-400 transition-all duration-300 rounded-full"
          style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Summary Text */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>السؤال {currentIndex + 1} من {totalQuestions}</span>
        <span>{answeredCount} من {totalQuestions} تم الإجابة</span>
      </div>
    </div>
  )
}

export default QuestionNavigator
