'use client'

import { cn } from '@/lib/utils'

export interface CircleData {
  // Standard SVG properties
  cx?: number
  cy?: number
  r?: number
  // Alternative properties from Claude AI generation
  radius?: number
  center?: [number, number]
  showRadius?: boolean
  showDiameter?: boolean
  // Common properties
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
  // Normalize data to handle both standard SVG properties and Claude AI generation format
  // Claude uses: radius, center (array), showRadius, showDiameter
  // Standard uses: r, cx, cy, annotations

  // Get the raw radius value
  const rawRadius = data.r ?? data.radius ?? 50

  // Scale small radii (< 20) to be visible in the viewBox
  // Claude often generates the actual measurement (e.g., 6 for "6 cm") rather than SVG coordinates
  // We scale to use ~25% of the viewBox size for better visibility
  const minVisibleRadius = Math.min(viewBox.width, viewBox.height) * 0.25
  const r = rawRadius < 20 ? minVisibleRadius : rawRadius

  // Always center the circle in the viewBox for consistent rendering
  // Claude's center coordinates may not account for the scaled radius
  const cx = viewBox.width / 2
  const cy = viewBox.height / 2
  const fill = data.fill ?? 'none'
  const stroke = data.stroke ?? '#1E5631'
  const strokeWidth = data.strokeWidth ?? 2
  const label = data.label
  const labelPosition = data.labelPosition ?? 'center'

  // Build annotations array from both formats
  const annotations = data.annotations ?? []

  // Add radius annotation if showRadius is true (Claude format)
  if (data.showRadius && !annotations.some(a => a.type === 'radius')) {
    annotations.push({ type: 'radius', label: label || `نق = ${r}` })
  }

  // Add diameter annotation if showDiameter is true (Claude format)
  if (data.showDiameter && !annotations.some(a => a.type === 'diameter')) {
    annotations.push({ type: 'diameter', label: `ق = ${r * 2}` })
  }

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
