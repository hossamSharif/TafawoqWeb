'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuestionHeader } from './QuestionHeader'
import { DiagramRenderer } from '@/components/diagrams/DiagramRenderer'
import type { DiagramData, QuestionSection, QuestionDifficulty, QuestionCategory, QuestionType } from '@/types/question'

export interface QuestionCardProps {
  questionNumber: number
  totalQuestions: number
  stem: string
  passage?: string
  section: QuestionSection
  topic?: QuestionCategory
  difficulty?: QuestionDifficulty
  questionType?: QuestionType
  diagram?: DiagramData
  showCategory?: boolean
  className?: string
}

/**
 * QuestionCard - Universal question display with support for all question types
 * Includes diagram rendering, passage display, and skeleton loading
 */
export function QuestionCard({
  questionNumber,
  totalQuestions,
  stem,
  passage,
  section,
  topic,
  difficulty,
  questionType = 'text-only',
  diagram,
  showCategory = false,
  className,
}: QuestionCardProps) {
  // Event-based loading state for diagrams
  const isChartType = diagram?.type && ['bar-chart', 'pie-chart', 'line-graph'].includes(diagram.type)
  const [isDiagramLoading, setIsDiagramLoading] = useState(isChartType)
  const [diagramError, setDiagramError] = useState<string | null>(null)

  // Reset loading state when diagram changes
  useEffect(() => {
    if (isChartType) {
      setIsDiagramLoading(true)
      setDiagramError(null)
    } else {
      setIsDiagramLoading(false)
    }
  }, [isChartType, diagram])

  // Callbacks for diagram load events
  const handleDiagramLoadSuccess = useCallback(() => {
    setIsDiagramLoading(false)
    setDiagramError(null)
  }, [])

  const handleDiagramLoadError = useCallback((error: string) => {
    setIsDiagramLoading(false)
    setDiagramError(error)
  }, [])

  // Determine if we should show the diagram
  // Fix: Show diagram whenever diagram data exists, regardless of questionType
  // This handles cases where API returns questionType: "mcq" with diagram data
  const showDiagram = diagram && diagram.type

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
        category={topic}
        showCategory={showCategory}
        className="mb-4"
      />

      {/* Diagram/Chart Display */}
      {showDiagram && (
        <div className="mb-6 relative">
          {/* Loading skeleton for diagram */}
          {isDiagramLoading && (
            <DiagramSkeleton />
          )}

          {/* Diagram container */}
          <div
            className={cn(
              'flex justify-center items-center p-4 bg-gray-50 rounded-lg border border-gray-100',
              'min-h-[200px]',
              isDiagramLoading && 'invisible'
            )}
          >
            {/* Pass load callbacks to DiagramRenderer */}
            <DiagramRenderer
              diagram={diagram}
              enableZoom={true}
              className="max-w-full"
              onLoadSuccess={isChartType ? handleDiagramLoadSuccess : undefined}
              onLoadError={isChartType ? handleDiagramLoadError : undefined}
            />
          </div>

          {/* Zoom hint (only show when loaded successfully) */}
          {!isDiagramLoading && !diagramError && (
            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-gray-400">
              <ZoomIn className="h-3 w-3" />
              <span>انقر على الرسم للتكبير</span>
            </div>
          )}
        </div>
      )}

      {/* Reading Passage (if verbal with passage) */}
      {passage && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            اقرأ النص التالي:
          </h3>
          <p className="text-gray-800 leading-[2] text-justify whitespace-pre-wrap">
            {passage}
          </p>
        </div>
      )}

      {/* Question Stem */}
      <div className="text-lg text-gray-900 leading-loose">
        <p className="whitespace-pre-wrap">{stem}</p>
      </div>

      {/* Topic hint (optional, shown at bottom if not in header) */}
      {topic && !showCategory && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-400">التصنيف: {topic}</span>
        </div>
      )}
    </div>
  )
}

/**
 * DiagramSkeleton - Loading skeleton for diagram/chart display
 */
function DiagramSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg animate-pulse">
      <div className="space-y-3 text-center">
        <div className="w-32 h-32 mx-auto">
          <svg
            className="w-full h-full text-gray-200"
            viewBox="0 0 100 100"
            fill="none"
          >
            {/* Placeholder shape */}
            <rect
              x="10"
              y="10"
              width="80"
              height="80"
              rx="4"
              fill="currentColor"
            />
            <circle cx="50" cy="50" r="25" fill="white" opacity="0.5" />
          </svg>
        </div>
        <p className="text-sm text-gray-400">جاري تحميل الرسم...</p>
      </div>
    </div>
  )
}

/**
 * QuestionCardSkeleton - Full loading skeleton for question card
 */
export function QuestionCardSkeleton() {
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

      {/* Stem skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  )
}

/**
 * QuestionCardWithDiagramSkeleton - Loading skeleton for questions with diagrams
 */
export function QuestionCardWithDiagramSkeleton() {
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

      {/* Diagram skeleton */}
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

export default QuestionCard
