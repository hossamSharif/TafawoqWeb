'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import { SVGDiagram } from './SVGDiagram'
import type { DiagramData, DiagramType } from '@/types/question'
import type { ChartData } from './ChartDiagram'

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
}

/**
 * DiagramRenderer - Main dispatcher component for rendering diagrams
 * Routes to appropriate renderer (SVG or Chart.js) based on diagram type
 */
export function DiagramRenderer({
  diagram,
  className,
  enableZoom = true,
}: DiagramRendererProps) {
  const [isZoomOpen, setIsZoomOpen] = useState(false)

  const handleClick = useCallback(() => {
    if (enableZoom) {
      setIsZoomOpen(true)
    }
  }, [enableZoom])

  const handleCloseZoom = useCallback(() => {
    setIsZoomOpen(false)
  }, [])

  // Determine which renderer to use
  const isChartType = CHART_TYPES.includes(diagram.type)
  const isSVGType = SVG_TYPES.includes(diagram.type)

  // Render the appropriate diagram type
  const renderDiagram = (interactive: boolean = false) => {
    if (isChartType) {
      return (
        <ChartDiagram
          type={diagram.type}
          data={diagram.data as unknown as ChartData}
          caption={diagram.caption}
          interactive={interactive && enableZoom}
          onClick={handleClick}
        />
      )
    }

    if (isSVGType) {
      return (
        <SVGDiagram
          type={diagram.type}
          data={diagram.data}
          caption={diagram.caption}
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
        <p className="text-gray-500 text-sm">نوع الرسم غير مدعوم: {diagram.type}</p>
        {diagram.caption && (
          <p className="text-gray-600 mt-2 text-sm">{diagram.caption}</p>
        )}
      </div>
    )
  }

  return (
    <div className={cn('diagram-renderer', className)}>
      {/* Main diagram display */}
      {renderDiagram(true)}

      {/* Zoom modal */}
      {enableZoom && isZoomOpen && (
        <DiagramZoomModal
          isOpen={isZoomOpen}
          onClose={handleCloseZoom}
          diagram={diagram}
        />
      )}
    </div>
  )
}

export default DiagramRenderer
