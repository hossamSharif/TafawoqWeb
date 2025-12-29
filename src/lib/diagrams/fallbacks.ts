/**
 * Fallback diagram generators
 * Provides safe default diagrams when data is invalid or missing
 */

import type { DiagramData, DiagramType } from '@/types/question'
import type {
  ValidatedChartData,
  ValidatedCircleData,
  ValidatedTriangleData,
  ValidatedRectangleData,
} from './validation'

// ============================================================================
// Chart Fallbacks
// ============================================================================

/**
 * Create a simple fallback bar chart
 */
export function createFallbackBarChart(): ValidatedChartData {
  return {
    labels: ['أ', 'ب', 'ج', 'د'],
    datasets: [
      {
        label: 'بيانات افتراضية',
        data: [10, 20, 15, 25],
        backgroundColor: '#1E5631',
      },
    ],
    options: {
      title: 'رسم بياني افتراضي',
    },
  }
}

/**
 * Create a simple fallback pie chart
 */
export function createFallbackPieChart(): ValidatedChartData {
  return {
    labels: ['الفئة أ', 'الفئة ب', 'الفئة ج'],
    datasets: [
      {
        data: [30, 40, 30],
        backgroundColor: ['#1E5631', '#D4AF37', '#2563EB'],
      },
    ],
    options: {
      title: 'رسم دائري افتراضي',
    },
  }
}

/**
 * Create a simple fallback line graph
 */
export function createFallbackLineGraph(): ValidatedChartData {
  return {
    labels: ['1', '2', '3', '4', '5'],
    datasets: [
      {
        label: 'البيانات',
        data: [5, 10, 8, 15, 12],
        borderColor: '#1E5631',
        fill: false,
      },
    ],
    options: {
      title: 'رسم خطي افتراضي',
    },
  }
}

/**
 * Get fallback chart data based on type
 */
export function getFallbackChartData(type: 'bar-chart' | 'pie-chart' | 'line-graph'): ValidatedChartData {
  switch (type) {
    case 'bar-chart':
      return createFallbackBarChart()
    case 'pie-chart':
      return createFallbackPieChart()
    case 'line-graph':
      return createFallbackLineGraph()
    default:
      return createFallbackBarChart()
  }
}

// ============================================================================
// SVG Shape Fallbacks
// ============================================================================

/**
 * Create a default circle
 */
export function createFallbackCircle(): ValidatedCircleData {
  return {
    radius: 50,
    center: [100, 100],
    showRadius: true,
    label: 'دائرة',
  }
}

/**
 * Create a default equilateral triangle
 */
export function createFallbackTriangle(): ValidatedTriangleData {
  // Equilateral triangle centered in 200x200 viewBox
  return {
    vertices: [
      [100, 40],  // Top
      [160, 160], // Bottom right
      [40, 160],  // Bottom left
    ],
    labels: ['أ', 'ب', 'ج'],
    type: 'equilateral',
  }
}

/**
 * Create a default rectangle
 */
export function createFallbackRectangle(): ValidatedRectangleData {
  return {
    width: 120,
    height: 80,
    cornerLabels: ['أ', 'ب', 'ج', 'د'],
    widthLabel: 'العرض',
    heightLabel: 'الارتفاع',
  }
}

/**
 * Get fallback shape data based on type
 */
export function getFallbackShapeData(
  type: 'circle' | 'triangle' | 'rectangle'
): ValidatedCircleData | ValidatedTriangleData | ValidatedRectangleData {
  switch (type) {
    case 'circle':
      return createFallbackCircle()
    case 'triangle':
      return createFallbackTriangle()
    case 'rectangle':
      return createFallbackRectangle()
    default:
      return createFallbackCircle()
  }
}

// ============================================================================
// Complete Diagram Fallbacks
// ============================================================================

/**
 * Create a complete fallback diagram
 */
export function createFallbackDiagram(type: DiagramType, caption?: string): DiagramData {
  let data: unknown
  let renderHint: 'SVG' | 'Canvas' | 'Chart.js'

  // Determine data and render hint based on type
  if (type === 'bar-chart' || type === 'pie-chart' || type === 'line-graph') {
    data = getFallbackChartData(type)
    renderHint = 'Chart.js'
  } else if (type === 'circle' || type === 'triangle' || type === 'rectangle') {
    data = getFallbackShapeData(type)
    renderHint = 'SVG'
  } else {
    // Unsupported type, use a simple circle
    data = createFallbackCircle()
    renderHint = 'SVG'
  }

  return {
    type,
    data: data as Record<string, unknown>,
    renderHint,
    caption: caption || 'رسم افتراضي (بيانات غير صالحة)',
  }
}

/**
 * Text representation of chart data for accessibility
 * Used when visual chart fails to render
 */
export interface ChartTextRepresentation {
  title?: string
  labels: string[]
  datasets: Array<{
    label?: string
    values: Array<{
      label: string
      value: number
    }>
  }>
}

/**
 * Convert chart data to text representation
 */
export function chartDataToTextRepresentation(data: ValidatedChartData): ChartTextRepresentation {
  return {
    title: data.options?.title,
    labels: data.labels,
    datasets: data.datasets.map((dataset) => ({
      label: dataset.label,
      values: data.labels.map((label, index) => ({
        label,
        value: dataset.data[index] || 0,
      })),
    })),
  }
}

/**
 * Convert shape data to text description
 */
export function shapeDataToTextDescription(type: DiagramType, data: unknown): string {
  switch (type) {
    case 'circle': {
      const circleData = data as ValidatedCircleData
      const radius = circleData.r || circleData.radius || 50
      return `دائرة بنصف قطر ${radius}`
    }

    case 'triangle': {
      const triangleData = data as ValidatedTriangleData
      const typeLabel = triangleData.type
        ? {
            scalene: 'مختلف الأضلاع',
            isosceles: 'متساوي الساقين',
            equilateral: 'متساوي الأضلاع',
            right: 'قائم الزاوية',
          }[triangleData.type]
        : 'مثلث'
      return `مثلث ${typeLabel || ''}`
    }

    case 'rectangle': {
      const rectData = data as ValidatedRectangleData
      if (rectData.isSquare) {
        return `مربع بطول ضلع ${rectData.width}`
      }
      return `مستطيل بطول ${rectData.width} وعرض ${rectData.height}`
    }

    default:
      return 'شكل هندسي'
  }
}
