'use client'

import { cn } from '@/lib/utils'
import { Circle, type CircleData } from './shapes/Circle'
import { Triangle, type TriangleData } from './shapes/Triangle'
import { Rectangle, type RectangleData } from './shapes/Rectangle'
import type { DiagramType } from '@/types/question'

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

  const renderShape = () => {
    switch (type) {
      case 'circle':
        return <Circle data={data as CircleData} viewBox={viewBox} />

      case 'triangle':
        return <Triangle data={data as TriangleData} viewBox={viewBox} />

      case 'rectangle':
        return <Rectangle data={data as RectangleData} viewBox={viewBox} />

      case 'composite-shape': {
        const compositeData = data as CompositeShapeData
        return (
          <g>
            {/* Render all shapes */}
            {compositeData.shapes?.map((shape, index) => {
              switch (shape.type) {
                case 'circle':
                  return (
                    <Circle
                      key={`shape-${index}`}
                      data={shape.data as CircleData}
                      viewBox={viewBox}
                    />
                  )
                case 'triangle':
                  return (
                    <Triangle
                      key={`shape-${index}`}
                      data={shape.data as TriangleData}
                      viewBox={viewBox}
                    />
                  )
                case 'rectangle':
                  return (
                    <Rectangle
                      key={`shape-${index}`}
                      data={shape.data as RectangleData}
                      viewBox={viewBox}
                    />
                  )
                default:
                  return null
              }
            })}

            {/* Render connections between shapes */}
            {compositeData.connections?.map((connection, index) => (
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
            ))}
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
