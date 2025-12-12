'use client'

import { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SVGDiagram } from '@/components/diagrams/SVGDiagram'
import { ChartDiagram, type ChartData } from '@/components/diagrams/ChartDiagram'
import type { DiagramData, DiagramType } from '@/types/question'

interface DiagramZoomModalProps {
  isOpen: boolean
  onClose: () => void
  diagram: DiagramData
}

/**
 * DiagramZoomModal - Full-screen modal for diagram inspection
 * Provides zoom controls and keyboard navigation
 */
export function DiagramZoomModal({
  isOpen,
  onClose,
  diagram,
}: DiagramZoomModalProps) {
  // Handle escape key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  // Determine render type
  const isChartType = ['bar-chart', 'pie-chart', 'line-graph'].includes(diagram.type)
  const isSVGType = ['circle', 'triangle', 'rectangle', 'composite-shape'].includes(
    diagram.type
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="zoom-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div className="relative z-10 w-full max-w-4xl mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h2
            id="zoom-modal-title"
            className="text-lg font-semibold text-gray-900"
            dir="rtl"
          >
            {diagram.caption || 'عرض الرسم التوضيحي'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-gray-200"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Diagram display area */}
        <div
          className="p-8 bg-white flex items-center justify-center min-h-[400px]"
          dir="rtl"
        >
          {isChartType && (
            <ZoomedChartDiagram type={diagram.type} data={diagram.data} />
          )}
          {isSVGType && (
            <ZoomedSVGDiagram type={diagram.type} data={diagram.data} />
          )}
          {!isChartType && !isSVGType && (
            <p className="text-gray-500">نوع الرسم غير مدعوم</p>
          )}
        </div>

        {/* Footer with controls */}
        <div className="flex items-center justify-center gap-4 p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-500" dir="rtl">
            اضغط ESC للإغلاق
          </p>
        </div>
      </div>
    </div>
  )
}

// Zoomed SVG diagram component
function ZoomedSVGDiagram({
  type,
  data,
}: {
  type: DiagramType
  data: Record<string, unknown>
}) {
  return (
    <div className="w-full max-w-2xl">
      <SVGDiagram
        type={type}
        data={data}
        className="scale-150 origin-center"
        interactive={false}
      />
    </div>
  )
}

// Zoomed Chart diagram component
function ZoomedChartDiagram({
  type,
  data,
}: {
  type: DiagramType
  data: Record<string, unknown>
}) {
  return (
    <div className="w-full max-w-2xl">
      <ChartDiagram
        type={type}
        data={data as unknown as ChartData}
        className="scale-110"
        interactive={false}
      />
    </div>
  )
}

export default DiagramZoomModal
