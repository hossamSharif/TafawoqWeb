'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Circle, type CircleData } from './shapes/Circle'
import { Triangle, type TriangleData } from './shapes/Triangle'
import { Rectangle, type RectangleData } from './shapes/Rectangle'
import type { DiagramType } from '@/types/question'
import { validateShapeData } from '@/lib/diagrams/validators'
import { getFallbackShapeData, shapeDataToTextDescription } from '@/lib/diagrams/fallbacks'
import { logDiagramError } from '@/lib/diagrams/errorLogging'

// Union type for all shape data
export type ShapeData = CircleData | TriangleData | RectangleData | CompositeShapeData

export interface CompositeShapeData {
  shapes: Array<{
    type: 'circle' | 'triangle' | 'rectangle'
    data: CircleData | TriangleData | RectangleData
  }>
  connections?: Array<{
    from: { x: number; y: number }
    to: { x: number; y: number }
    style?: 'solid' | 'dashed'
    label?: string
  }>
}

interface SVGDiagramProps {
  type: DiagramType
  data: Record<string, unknown>
  caption?: string
  className?: string
  onClick?: () => void
  interactive?: boolean
}

/**
 * SVGDiagram - Renders geometric shapes using SVG
 * Supports circle, triangle, rectangle, and composite shapes
 */
export function SVGDiagram({
  type,
  data,
  caption,
  className,
  onClick,
  interactive = false,
}: SVGDiagramProps) {
  const viewBox = { width: 200, height: 200 }

  // Validate and sanitize data using useMemo (no state updates in render phase)
  const { sanitizedData, validationError } = useMemo(() => {
    if (type === 'custom') {
      // Skip validation for custom types
      return { sanitizedData: data, validationError: null }
    }

    const validationResult = validateShapeData(type, data)

    if (!validationResult.success) {
      // Log validation error
      logDiagramError('data-invalid', type, validationResult.error)

      // Try to use fallback data
      const fallback = getFallbackShapeData(type as 'circle' | 'triangle' | 'rectangle')
      return {
        sanitizedData: fallback as unknown as Record<string, unknown>,
        validationError: validationResult.error,
      }
    }

    return {
      sanitizedData: validationResult.data as unknown as Record<string, unknown>,
      validationError: null,
    }
  }, [type, JSON.stringify(data)])

  const renderShape = () => {
    try {
      switch (type) {
        case 'circle':
          return <Circle data={sanitizedData as unknown as CircleData} viewBox={viewBox} />

        case 'triangle':
          return <Triangle data={sanitizedData as unknown as TriangleData} viewBox={viewBox} />

        case 'rectangle':
          return <Rectangle data={sanitizedData as unknown as RectangleData} viewBox={viewBox} />

        case 'composite-shape': {
          const compositeData = sanitizedData as unknown as any

          // Validate composite data structure
          if (!compositeData.shapes || !Array.isArray(compositeData.shapes) || compositeData.shapes.length === 0) {
            throw new Error('Composite shape must have at least one shape')
          }

          const shaded = compositeData.shaded || false
          const fillColor = shaded ? 'rgba(59, 130, 246, 0.1)' : 'none'

          return (
            <g>
              {/* Render all shapes with raw SVG for proper positioning */}
              {compositeData.shapes.map((shape: any, index: number) => {
                try {
                  // Use flat structure directly
                  const shapeData = shape.data || shape

                  // Scale coordinates to viewBox
                  const scale = Math.min(viewBox.width / 20, viewBox.height / 20)

                  switch (shape.type) {
                    case 'rectangle':
                      return (
                        <rect
                          key={`shape-${index}`}
                          x={shapeData.x * scale}
                          y={shapeData.y * scale}
                          width={shapeData.width * scale}
                          height={shapeData.height * scale}
                          fill={fillColor}
                          stroke="#1E5631"
                          strokeWidth={2}
                        />
                      )

                    case 'circle':
                      if (shapeData.half) {
                        // Render half circle using path
                        const scaledCx = shapeData.cx * scale
                        const scaledCy = shapeData.cy * scale
                        const scaledR = shapeData.radius * scale
                        const startAngle = -Math.PI / 2
                        const endAngle = Math.PI / 2
                        const x1 = scaledCx + scaledR * Math.cos(startAngle)
                        const y1 = scaledCy + scaledR * Math.sin(startAngle)
                        const x2 = scaledCx + scaledR * Math.cos(endAngle)
                        const y2 = scaledCy + scaledR * Math.sin(endAngle)

                        return (
                          <path
                            key={`shape-${index}`}
                            d={`M ${x1} ${y1} A ${scaledR} ${scaledR} 0 0 1 ${x2} ${y2} L ${scaledCx} ${y2} L ${scaledCx} ${y1} Z`}
                            fill={fillColor}
                            stroke="#1E5631"
                            strokeWidth={2}
                          />
                        )
                      } else {
                        return (
                          <circle
                            key={`shape-${index}`}
                            cx={shapeData.cx * scale}
                            cy={shapeData.cy * scale}
                            r={shapeData.radius * scale}
                            fill={fillColor}
                            stroke="#1E5631"
                            strokeWidth={2}
                          />
                        )
                      }

                    default:
                      return null
                  }
                } catch (err) {
                  // Log and skip invalid shape
                  logDiagramError('render-failed', type, err as Error, { shapeIndex: index })
                  return null
                }
              })}

              {/* Render connections between shapes */}
              {compositeData.connections?.map((connection, index) => {
                // Validate connection coordinates
                if (
                  typeof connection?.from?.x !== 'number' ||
                  typeof connection?.from?.y !== 'number' ||
                  typeof connection?.to?.x !== 'number' ||
                  typeof connection?.to?.y !== 'number'
                ) {
                  return null
                }

                return (
                  <g key={`connection-${index}`}>
                    <line
                      x1={connection.from.x}
                      y1={connection.from.y}
                      x2={connection.to.x}
                      y2={connection.to.y}
                      stroke="#1E5631"
                      strokeWidth={1}
                      strokeDasharray={connection.style === 'dashed' ? '4,2' : undefined}
                    />
                    {connection.label && (
                      <text
                        x={(connection.from.x + connection.to.x) / 2}
                        y={(connection.from.y + connection.to.y) / 2 - 5}
                        textAnchor="middle"
                        fontSize="11"
                        fill="#6B7280"
                        fontFamily="Noto Kufi Arabic, sans-serif"
                      >
                        {connection.label}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>
          )
        }

        default:
          return (
            <text
              x={viewBox.width / 2}
              y={viewBox.height / 2}
              textAnchor="middle"
              fill="#9CA3AF"
              fontSize="12"
              fontFamily="Noto Kufi Arabic, sans-serif"
            >
              شكل غير مدعوم
            </text>
          )
      }
    } catch (err) {
      logDiagramError('render-failed', type, err as Error)
      // Return fallback visual
      return (
        <g>
          <text
            x={viewBox.width / 2}
            y={viewBox.height / 2 - 10}
            textAnchor="middle"
            fill="#DC2626"
            fontSize="12"
            fontFamily="Noto Kufi Arabic, sans-serif"
          >
            خطأ في عرض الشكل
          </text>
          <text
            x={viewBox.width / 2}
            y={viewBox.height / 2 + 10}
            textAnchor="middle"
            fill="#9CA3AF"
            fontSize="10"
            fontFamily="Noto Kufi Arabic, sans-serif"
          >
            {shapeDataToTextDescription(type, data)}
          </text>
        </g>
      )
    }
  }

  return (
    <div
      className={cn(
        'svg-diagram flex flex-col items-center',
        interactive && 'cursor-pointer hover:opacity-90 transition-opacity',
        className
      )}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onClick?.()
              }
            }
          : undefined
      }
    >
      {/* Validation warning */}
      {validationError && (
        <div className="mb-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs text-yellow-800 text-center" dir="rtl">
            تحذير: تم استخدام بيانات افتراضية بسبب خطأ في التحقق
          </p>
        </div>
      )}

      <svg
        viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
        className="w-full max-w-xs h-auto"
        role="img"
        aria-label={caption || 'رسم توضيحي'}
      >
        {/* Background */}
        <rect
          x="0"
          y="0"
          width={viewBox.width}
          height={viewBox.height}
          fill="#FAFAFA"
          rx="4"
        />

        {/* Render the shape(s) */}
        {renderShape()}
      </svg>

      {/* Caption */}
      {caption && (
        <p className="mt-2 text-sm text-gray-600 text-center" dir="rtl">
          {caption}
        </p>
      )}

      {/* Interactive hint */}
      {interactive && (
        <p className="mt-1 text-xs text-gray-400 text-center" dir="rtl">
          انقر للتكبير
        </p>
      )}
    </div>
  )
}

export default SVGDiagram
