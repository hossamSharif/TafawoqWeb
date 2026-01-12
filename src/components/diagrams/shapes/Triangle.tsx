'use client'

import { cn } from '@/lib/utils'

export interface TriangleData {
  // Standard format
  points?: [
    { x: number; y: number; label?: string },
    { x: number; y: number; label?: string },
    { x: number; y: number; label?: string }
  ]
  // Claude AI generation format
  vertices?: [number, number][]
  labels?: string[]
  sides?: (string | null)[]
  height?: string
  showHeight?: boolean
  isIsosceles?: boolean
  // Common properties
  fill?: string
  stroke?: string
  strokeWidth?: number
  showAngles?: boolean
  angles?: [string?, string?, string?]
  sideLengths?: [string?, string?, string?]
  type?: 'scalene' | 'isosceles' | 'equilateral' | 'right'
  rightAngleIndex?: 0 | 1 | 2
}

interface TriangleProps {
  data: TriangleData
  viewBox?: { width: number; height: number }
  className?: string
}

/**
 * Triangle shape component for geometry diagrams
 * Supports vertex labels, side lengths, angles, and right angle markers
 */
export function Triangle({
  data,
  viewBox = { width: 200, height: 200 },
  className,
}: TriangleProps) {
  // Normalize data to handle both standard and Claude AI generation formats
  // Claude uses: vertices (array of [x,y]), labels (separate array), sides
  // Standard uses: points (array of {x, y, label}), sideLengths

  // Convert vertices array to points array if needed
  let points: { x: number; y: number; label?: string }[]

  if (data.points) {
    points = data.points
  } else if (data.vertices && data.vertices.length >= 3) {
    // Scale vertices to fit viewBox if they're outside the range
    const xs = data.vertices.map(v => v[0])
    const ys = data.vertices.map(v => v[1])
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    const rangeX = maxX - minX || 1
    const rangeY = maxY - minY || 1

    // Scale to fit within viewBox with padding
    const padding = 30
    const scaleX = (viewBox.width - 2 * padding) / rangeX
    const scaleY = (viewBox.height - 2 * padding) / rangeY
    const scale = Math.min(scaleX, scaleY)

    points = data.vertices.map((v, i) => {
      // Safely extract label - handle both string and object formats
      const rawLabel = data.labels?.[i]
      const label = typeof rawLabel === 'string'
        ? rawLabel
        : (rawLabel?.label || rawLabel?.text || rawLabel?.name || undefined)

      return {
        x: padding + (v[0] - minX) * scale,
        y: padding + (v[1] - minY) * scale,
        label
      }
    })
  } else {
    // Default triangle if no valid data
    points = [
      { x: viewBox.width / 2, y: 30, label: 'أ' },
      { x: 30, y: viewBox.height - 30, label: 'ب' },
      { x: viewBox.width - 30, y: viewBox.height - 30, label: 'ج' }
    ]
  }

  const fill = data.fill ?? 'none'
  const stroke = data.stroke ?? '#1E5631'
  const strokeWidth = data.strokeWidth ?? 2
  const showAngles = data.showAngles ?? false
  const angles = data.angles
  const sideLengths = data.sideLengths ?? data.sides?.map(s => s ?? undefined) as [string?, string?, string?]
  const rightAngleIndex = data.rightAngleIndex

  // Create points string for polygon
  const pointsString = points.map((p) => `${p.x},${p.y}`).join(' ')

  // Calculate midpoint of a line
  const midpoint = (p1: { x: number; y: number }, p2: { x: number; y: number }) => ({
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  })

  // Calculate offset for label (perpendicular to the line)
  const getLabelOffset = (
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    offset: number
  ) => {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const length = Math.sqrt(dx * dx + dy * dy)
    return {
      x: -dy / length * offset,
      y: dx / length * offset,
    }
  }

  // Draw right angle marker
  const drawRightAngle = (index: number) => {
    const vertex = points[index]
    const prev = points[(index + 2) % 3]
    const next = points[(index + 1) % 3]

    const size = 15

    // Calculate unit vectors
    const dx1 = prev.x - vertex.x
    const dy1 = prev.y - vertex.y
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)
    const ux1 = dx1 / len1
    const uy1 = dy1 / len1

    const dx2 = next.x - vertex.x
    const dy2 = next.y - vertex.y
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
    const ux2 = dx2 / len2
    const uy2 = dy2 / len2

    const p1 = { x: vertex.x + ux1 * size, y: vertex.y + uy1 * size }
    const p2 = { x: vertex.x + (ux1 + ux2) * size, y: vertex.y + (uy1 + uy2) * size }
    const p3 = { x: vertex.x + ux2 * size, y: vertex.y + uy2 * size }

    return (
      <path
        d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y}`}
        fill="none"
        stroke={stroke}
        strokeWidth={1}
      />
    )
  }

  return (
    <g className={cn('triangle-shape', className)}>
      {/* Main triangle */}
      <polygon
        points={pointsString}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />

      {/* Right angle marker */}
      {rightAngleIndex !== undefined && drawRightAngle(rightAngleIndex)}

      {/* Vertex labels */}
      {points.map((point, index) => {
        if (!point.label) return null

        // Calculate label position (outside the triangle)
        const center = {
          x: (points[0].x + points[1].x + points[2].x) / 3,
          y: (points[0].y + points[1].y + points[2].y) / 3,
        }
        const dx = point.x - center.x
        const dy = point.y - center.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const offset = 18

        return (
          <text
            key={`vertex-${index}`}
            x={point.x + (dx / dist) * offset}
            y={point.y + (dy / dist) * offset}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fontWeight="600"
            fill={stroke}
            fontFamily="Noto Kufi Arabic, sans-serif"
          >
            {point.label}
          </text>
        )
      })}

      {/* Side lengths */}
      {sideLengths?.map((length, index) => {
        if (!length) return null

        const p1 = points[index]
        const p2 = points[(index + 1) % 3]
        const mid = midpoint(p1, p2)
        const offset = getLabelOffset(p1, p2, 15)

        return (
          <text
            key={`side-${index}`}
            x={mid.x + offset.x}
            y={mid.y + offset.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fill="#6B7280"
            fontFamily="Noto Kufi Arabic, sans-serif"
          >
            {length}
          </text>
        )
      })}

      {/* Angle labels */}
      {showAngles && angles?.map((angle, index) => {
        if (!angle) return null

        const vertex = points[index]
        const center = {
          x: (points[0].x + points[1].x + points[2].x) / 3,
          y: (points[0].y + points[1].y + points[2].y) / 3,
        }

        // Position angle label inside triangle, near vertex
        const dx = center.x - vertex.x
        const dy = center.y - vertex.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const offset = 25

        return (
          <text
            key={`angle-${index}`}
            x={vertex.x + (dx / dist) * offset}
            y={vertex.y + (dy / dist) * offset}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fill="#9CA3AF"
            fontFamily="Noto Kufi Arabic, sans-serif"
          >
            {angle}
          </text>
        )
      })}
    </g>
  )
}

export default Triangle
