'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import { SVGDiagram } from './SVGDiagram'
import { DiagramErrorBoundary } from './DiagramErrorBoundary'
import type { DiagramData, DiagramType } from '@/types/question'
import type { ChartData } from './ChartDiagram'
import { validateDiagramData, sanitizeDiagramData } from '@/lib/diagrams/validators'
import { createFallbackDiagram } from '@/lib/diagrams/fallbacks'
import { logValidationFailure, logDiagramError } from '@/lib/diagrams/errorLogging'

// Dynamically import ChartDiagram to reduce bundle size
const ChartDiagram = dynamic(
  () => import('./ChartDiagram').then((mod) => mod.ChartDiagram),
  {
    loading: () => (
      <div className="w-full max-w-md h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-gray-400 text-sm">جاري التحميل...</span>
      </div>
    ),
    ssr: false,
  }
)

// Dynamically import zoom modal
const DiagramZoomModal = dynamic(
  () => import('../exam/DiagramZoomModal').then((mod) => mod.DiagramZoomModal),
  { ssr: false }
)

// Chart types that need Chart.js
const CHART_TYPES: DiagramType[] = ['bar-chart', 'pie-chart', 'line-graph']

// SVG geometry types
const SVG_TYPES: DiagramType[] = ['circle', 'triangle', 'rectangle', 'composite-shape']

interface DiagramRendererProps {
  diagram: DiagramData
  className?: string
  enableZoom?: boolean
  onLoadSuccess?: () => void
  onLoadError?: (error: string, errorType: string) => void
}

/**
 * DiagramRenderer - Main dispatcher component for rendering diagrams
 * Routes to appropriate renderer (SVG or Chart.js) based on diagram type
 */
export function DiagramRenderer({
  diagram,
  className,
  enableZoom = true,
  onLoadSuccess,
  onLoadError,
}: DiagramRendererProps) {
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const [hasValidationError, setHasValidationError] = useState(false)

  // Validate and sanitize diagram data (no state updates in useMemo)
  const sanitizedDiagram = useMemo(() => {
    // Validate diagram data
    const validationResult = validateDiagramData(diagram)

    if (!validationResult.success) {
      // Log validation failure
      logValidationFailure({
        diagramType: diagram.type,
        category: 'malformed-data',
        message: validationResult.error,
        timestamp: Date.now(),
      })

      // Attempt to sanitize
      const sanitized = sanitizeDiagramData(diagram)

      if (sanitized) {
        return { data: sanitized, hasError: true }
      }

      // Sanitization failed, use fallback
      logDiagramError('data-invalid', diagram.type, validationResult.error)
      return {
        data: createFallbackDiagram(diagram.type, 'بيانات افتراضية - البيانات الأصلية غير صالحة'),
        hasError: true,
      }
    }

    // Validation passed
    return { data: diagram, hasError: false }
  }, [JSON.stringify(diagram)])

  // Update state in separate useEffect
  useEffect(() => {
    setHasValidationError(sanitizedDiagram.hasError)
  }, [sanitizedDiagram.hasError])

  const handleClick = useCallback(() => {
    if (enableZoom) {
      setIsZoomOpen(true)
    }
  }, [enableZoom])

  const handleCloseZoom = useCallback(() => {
    setIsZoomOpen(false)
  }, [])

  // Determine which renderer to use
  const isChartType = CHART_TYPES.includes(sanitizedDiagram.data.type)
  const isSVGType = SVG_TYPES.includes(sanitizedDiagram.data.type)

  // Render the appropriate diagram type
  const renderDiagram = (interactive: boolean = false) => {
    if (isChartType) {
      return (
        <ChartDiagram
          type={sanitizedDiagram.data.type}
          data={sanitizedDiagram.data.data as unknown as ChartData}
          caption={sanitizedDiagram.data.caption}
          interactive={interactive && enableZoom}
          onClick={handleClick}
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
        />
      )
    }

    if (isSVGType) {
      return (
        <SVGDiagram
          type={sanitizedDiagram.data.type}
          data={sanitizedDiagram.data.data}
          caption={sanitizedDiagram.data.caption}
          interactive={interactive && enableZoom}
          onClick={handleClick}
        />
      )
    }

    // Fallback for unsupported types
    return (
      <div
        className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center"
        dir="rtl"
      >
        <p className="text-gray-500 text-sm">نوع الرسم غير مدعوم: {sanitizedDiagram.data.type}</p>
        {sanitizedDiagram.data.caption && (
          <p className="text-gray-600 mt-2 text-sm">{sanitizedDiagram.data.caption}</p>
        )}
      </div>
    )
  }

  return (
    <div className={cn('diagram-renderer', className)}>
      {/* Validation warning */}
      {hasValidationError && (
        <div className="mb-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs text-yellow-800 text-center" dir="rtl">
            تحذير: تم اكتشاف خطأ في بيانات الرسم. يتم استخدام بيانات بديلة.
          </p>
        </div>
      )}

      {/* Main diagram display wrapped in error boundary */}
      <DiagramErrorBoundary diagramType={sanitizedDiagram.data.type}>
        {renderDiagram(true)}
      </DiagramErrorBoundary>

      {/* Zoom modal */}
      {enableZoom && isZoomOpen && (
        <DiagramZoomModal
          isOpen={isZoomOpen}
          onClose={handleCloseZoom}
          diagram={sanitizedDiagram.data}
        />
      )}
    </div>
  )
}

export default DiagramRenderer
