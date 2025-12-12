'use client'

import { cn } from '@/lib/utils'

export interface CircleData {
  cx?: number
  cy?: number
  r: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  label?: string
  labelPosition?: 'center' | 'top' | 'bottom'
  annotations?: Array<{
    type: 'radius' | 'diameter' | 'point'
    label?: string
    position?: { x: number; y: number }
  }>
}

interface CircleProps {
  data: CircleData
  viewBox?: { width: number; height: number }
  className?: string
}

/**
 * Circle shape component for geometry diagrams
 * Supports radius/diameter annotations and center labels
 */
export function Circle({
  data,
  viewBox = { width: 200, height: 200 },
  className,
}: CircleProps) {
  const {
    cx = viewBox.width / 2,
    cy = viewBox.height / 2,
    r,
    fill = 'none',
    stroke = '#1E5631',
    strokeWidth = 2,
    label,
    labelPosition = 'center',
    annotations = [],
  } = data

  // Calculate label position
  const getLabelY = () => {
    switch (labelPosition) {
      case 'top':
        return cy - r - 15
      case 'bottom':
        return cy + r + 20
      default:
        return cy + 5
    }
  }

  return (
    <g className={cn('circle-shape', className)}>
      {/* Main circle */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />

      {/* Center point */}
      <circle cx={cx} cy={cy} r={3} fill={stroke} />

      {/* Annotations */}
      {annotations.map((annotation, index) => {
        if (annotation.type === 'radius') {
          return (
            <g key={`annotation-${index}`}>
              <line
                x1={cx}
                y1={cy}
                x2={cx + r}
                y2={cy}
                stroke={stroke}
                strokeWidth={1}
                strokeDasharray="4,2"
              />
              {annotation.label && (
                <text
                  x={cx + r / 2}
                  y={cy - 8}
                  textAnchor="middle"
                  fontSize="12"
                  fill={stroke}
                  fontFamily="Noto Kufi Arabic, sans-serif"
                >
                  {annotation.label}
                </text>
              )}
            </g>
          )
        }

        if (annotation.type === 'diameter') {
          return (
            <g key={`annotation-${index}`}>
              <line
                x1={cx - r}
                y1={cy}
                x2={cx + r}
                y2={cy}
                stroke={stroke}
                strokeWidth={1}
                strokeDasharray="4,2"
              />
              {annotation.label && (
                <text
                  x={cx}
                  y={cy - 8}
                  textAnchor="middle"
                  fontSize="12"
                  fill={stroke}
                  fontFamily="Noto Kufi Arabic, sans-serif"
                >
                  {annotation.label}
                </text>
              )}
            </g>
          )
        }

        if (annotation.type === 'point' && annotation.position) {
          return (
            <g key={`annotation-${index}`}>
              <circle
                cx={annotation.position.x}
                cy={annotation.position.y}
                r={4}
                fill={stroke}
              />
              {annotation.label && (
                <text
                  x={annotation.position.x}
                  y={annotation.position.y - 10}
                  textAnchor="middle"
                  fontSize="12"
                  fill={stroke}
                  fontFamily="Noto Kufi Arabic, sans-serif"
                >
                  {annotation.label}
                </text>
              )}
            </g>
          )
        }

        return null
      })}

      {/* Main label */}
      {label && (
        <text
          x={cx}
          y={getLabelY()}
          textAnchor="middle"
          fontSize="14"
          fontWeight="500"
          fill="#374151"
          fontFamily="Noto Kufi Arabic, sans-serif"
        >
          {label}
        </text>
      )}
    </g>
  )
}

export default Circle
