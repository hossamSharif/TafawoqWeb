'use client'

import { cn } from '@/lib/utils'

export interface RectangleData {
  x?: number
  y?: number
  width: number
  height: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  cornerLabels?: [string?, string?, string?, string?] // top-right, bottom-right, bottom-left, top-left (RTL order)
  widthLabel?: string
  heightLabel?: string
  diagonalLabel?: string
  showDiagonal?: boolean
  isSquare?: boolean
}

interface RectangleProps {
  data: RectangleData
  viewBox?: { width: number; height: number }
  className?: string
}

/**
 * Rectangle/Square shape component for geometry diagrams
 * Supports corner labels, dimension labels, and diagonal
 */
export function Rectangle({
  data,
  viewBox = { width: 200, height: 200 },
  className,
}: RectangleProps) {
  const {
    x = (viewBox.width - data.width) / 2,
    y = (viewBox.height - data.height) / 2,
    width,
    height,
    fill = 'none',
    stroke = '#1E5631',
    strokeWidth = 2,
    cornerLabels,
    widthLabel,
    heightLabel,
    diagonalLabel,
    showDiagonal = false,
  } = data

  // Corner positions (clockwise from top-right for RTL)
  const corners = [
    { x: x + width, y: y, label: cornerLabels?.[0] }, // top-right (أ)
    { x: x + width, y: y + height, label: cornerLabels?.[1] }, // bottom-right (ب)
    { x: x, y: y + height, label: cornerLabels?.[2] }, // bottom-left (ج)
    { x: x, y: y, label: cornerLabels?.[3] }, // top-left (د)
  ]

  // Right angle marker
  const rightAngleSize = 12
  const rightAngleMarkers = corners.map((corner, index) => {
    const isTopRight = index === 0
    const isBottomRight = index === 1
    const isBottomLeft = index === 2
    const isTopLeft = index === 3

    let d = ''
    if (isTopRight) {
      d = `M ${corner.x - rightAngleSize} ${corner.y} L ${corner.x - rightAngleSize} ${corner.y + rightAngleSize} L ${corner.x} ${corner.y + rightAngleSize}`
    } else if (isBottomRight) {
      d = `M ${corner.x - rightAngleSize} ${corner.y} L ${corner.x - rightAngleSize} ${corner.y - rightAngleSize} L ${corner.x} ${corner.y - rightAngleSize}`
    } else if (isBottomLeft) {
      d = `M ${corner.x + rightAngleSize} ${corner.y} L ${corner.x + rightAngleSize} ${corner.y - rightAngleSize} L ${corner.x} ${corner.y - rightAngleSize}`
    } else if (isTopLeft) {
      d = `M ${corner.x + rightAngleSize} ${corner.y} L ${corner.x + rightAngleSize} ${corner.y + rightAngleSize} L ${corner.x} ${corner.y + rightAngleSize}`
    }

    return (
      <path
        key={`right-angle-${index}`}
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={1}
      />
    )
  })

  return (
    <g className={cn('rectangle-shape', className)}>
      {/* Main rectangle */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />

      {/* Right angle markers */}
      {rightAngleMarkers}

      {/* Diagonal */}
      {showDiagonal && (
        <>
          <line
            x1={x}
            y1={y}
            x2={x + width}
            y2={y + height}
            stroke={stroke}
            strokeWidth={1}
            strokeDasharray="4,2"
          />
          {diagonalLabel && (
            <text
              x={x + width / 2 + 10}
              y={y + height / 2 - 5}
              textAnchor="start"
              fontSize="12"
              fill="#6B7280"
              fontFamily="Noto Kufi Arabic, sans-serif"
            >
              {diagonalLabel}
            </text>
          )}
        </>
      )}

      {/* Corner labels */}
      {corners.map((corner, index) => {
        if (!corner.label) return null

        // Position label outside the rectangle
        const offsetX = index === 0 || index === 1 ? 12 : -12
        const offsetY = index === 0 || index === 3 ? -12 : 12

        return (
          <text
            key={`corner-${index}`}
            x={corner.x + offsetX}
            y={corner.y + offsetY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fontWeight="600"
            fill={stroke}
            fontFamily="Noto Kufi Arabic, sans-serif"
          >
            {corner.label}
          </text>
        )
      })}

      {/* Width label (top) */}
      {widthLabel && (
        <text
          x={x + width / 2}
          y={y - 12}
          textAnchor="middle"
          fontSize="12"
          fill="#6B7280"
          fontFamily="Noto Kufi Arabic, sans-serif"
        >
          {widthLabel}
        </text>
      )}

      {/* Height label (right side for RTL) */}
      {heightLabel && (
        <text
          x={x + width + 12}
          y={y + height / 2}
          textAnchor="start"
          dominantBaseline="middle"
          fontSize="12"
          fill="#6B7280"
          fontFamily="Noto Kufi Arabic, sans-serif"
        >
          {heightLabel}
        </text>
      )}
    </g>
  )
}

export default Rectangle
