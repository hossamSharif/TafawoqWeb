'use client'

import { useState, useCallback } from 'react'
import { ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuestionHeader, type QuestionHeaderProps } from './QuestionHeader'
import { DiagramRenderer } from '@/components/diagrams/DiagramRenderer'
import type { DiagramData } from '@/types/question'

export interface ImageQuestionProps extends Omit<QuestionHeaderProps, 'className'> {
  stem: string
  diagram: DiagramData
  className?: string
}

/**
 * ImageQuestion - Displays questions with diagrams/charts
 * Includes responsive scaling and zoom functionality
 */
export function ImageQuestion({
  questionNumber,
  totalQuestions,
  section,
  difficulty,
  category,
  showCategory,
  stem,
  diagram,
  className,
}: ImageQuestionProps) {
  const [isImageLoading, setIsImageLoading] = useState(true)

  // Handle diagram load completion
  const handleDiagramLoad = useCallback(() => {
    setIsImageLoading(false)
  }, [])

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

      {/* Diagram Display */}
      <div className="mb-6 relative">
        {/* Loading skeleton */}
        {isImageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="space-y-3 text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-500">جاري تحميل الرسم...</p>
            </div>
          </div>
        )}

        {/* Diagram container */}
        <div
          className={cn(
            'flex justify-center items-center p-4 bg-gray-50 rounded-lg border border-gray-100',
            'min-h-[200px]',
            isImageLoading && 'invisible'
          )}
          onLoad={handleDiagramLoad}
        >
          <DiagramRenderer
            diagram={diagram}
            enableZoom={true}
            className="max-w-full"
          />
        </div>

        {/* Zoom hint */}
        <div className="flex items-center justify-center gap-1 mt-2 text-xs text-gray-400">
          <ZoomIn className="h-3 w-3" />
          <span>انقر على الرسم للتكبير</span>
        </div>
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

/**
 * ImageQuestionSkeleton - Loading skeleton for image questions
 */
export function ImageQuestionSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="w-16 h-4 bg-gray-200 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-6 bg-gray-200 rounded-full" />
          <div className="w-12 h-6 bg-gray-200 rounded-full" />
        </div>
      </div>

      {/* Image skeleton */}
      <div className="mb-6">
        <div className="h-48 bg-gray-200 rounded-lg" />
      </div>

      {/* Stem skeleton */}
      <div className="pt-4 border-t border-gray-100 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
    </div>
  )
}

export default ImageQuestion
