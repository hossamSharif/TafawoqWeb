/**
 * Validation utility functions for diagram data
 * Provides high-level validation with fallbacks and sanitization
 */

import { z } from 'zod'
import type { DiagramData, DiagramType } from '@/types/question'
import {
  ChartDataSchema,
  CircleDataSchema,
  TriangleDataSchema,
  RectangleDataSchema,
  CompositeShapeDataSchema,
  DiagramDataSchema,
  type ValidatedChartData,
  type ValidatedCircleData,
  type ValidatedTriangleData,
  type ValidatedRectangleData,
  type ValidatedCompositeShapeData,
  type ValidationResult,
  zodErrorToArabicMessage,
  categorizeValidationError,
} from './validation'

// ============================================================================
// Chart Data Validation
// ============================================================================

/**
 * Validate chart data and return typed result
 */
export function validateChartData(data: unknown): ValidationResult<ValidatedChartData> {
  try {
    const validated = ChartDataSchema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: zodErrorToArabicMessage(error),
        errors: error,
      }
    }
    return {
      success: false,
      error: 'فشل التحقق من بيانات الرسم البياني',
      errors: new z.ZodError([]),
    }
  }
}

/**
 * Validate chart data with automatic fallback
 * Attempts to fix common issues before failing
 */
export function validateChartDataWithFallback(data: unknown): ValidationResult<ValidatedChartData> {
  // First attempt: direct validation
  const result = validateChartData(data)
  if (result.success) {
    return result
  }

  // Attempt to fix common issues
  try {
    const chartData = data as any

    // Ensure labels is an array
    if (!Array.isArray(chartData?.labels)) {
      chartData.labels = []
    }

    // Ensure datasets is an array with at least one valid dataset
    if (!Array.isArray(chartData?.datasets) || chartData.datasets.length === 0) {
      chartData.datasets = [{ data: [0], label: 'بيانات افتراضية' }]
    }

    // Ensure each dataset has a valid data array
    chartData.datasets = chartData.datasets.map((dataset: any) => ({
      ...dataset,
      data: Array.isArray(dataset?.data) && dataset.data.length > 0
        ? dataset.data
        : [0],
    }))

    // Retry validation
    return validateChartData(chartData)
  } catch {
    return result // Return original error if fallback fails
  }
}

// ============================================================================
// SVG Shape Validation
// ============================================================================

/**
 * Validate circle data
 */
export function validateCircleData(data: unknown): ValidationResult<ValidatedCircleData> {
  try {
    const validated = CircleDataSchema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: zodErrorToArabicMessage(error),
        errors: error,
      }
    }
    return {
      success: false,
      error: 'فشل التحقق من بيانات الدائرة',
      errors: new z.ZodError([]),
    }
  }
}

/**
 * Validate triangle data
 */
export function validateTriangleData(data: unknown): ValidationResult<ValidatedTriangleData> {
  try {
    const validated = TriangleDataSchema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: zodErrorToArabicMessage(error),
        errors: error,
      }
    }
    return {
      success: false,
      error: 'فشل التحقق من بيانات المثلث',
      errors: new z.ZodError([]),
    }
  }
}

/**
 * Validate rectangle data
 */
export function validateRectangleData(data: unknown): ValidationResult<ValidatedRectangleData> {
  try {
    const validated = RectangleDataSchema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: zodErrorToArabicMessage(error),
        errors: error,
      }
    }
    return {
      success: false,
      error: 'فشل التحقق من بيانات المستطيل',
      errors: new z.ZodError([]),
    }
  }
}

/**
 * Validate composite shape data
 */
export function validateCompositeShapeData(data: unknown): ValidationResult<ValidatedCompositeShapeData> {
  try {
    const validated = CompositeShapeDataSchema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: zodErrorToArabicMessage(error),
        errors: error,
      }
    }
    return {
      success: false,
      error: 'فشل التحقق من بيانات الشكل المركب',
      errors: new z.ZodError([]),
    }
  }
}

/**
 * Validate shape data based on type
 */
export function validateShapeData(
  type: DiagramType,
  data: unknown
): ValidationResult<ValidatedCircleData | ValidatedTriangleData | ValidatedRectangleData | ValidatedCompositeShapeData> {
  switch (type) {
    case 'circle':
      return validateCircleData(data)

    case 'triangle':
      return validateTriangleData(data)

    case 'rectangle':
      return validateRectangleData(data)

    case 'composite-shape':
      return validateCompositeShapeData(data)

    default:
      return {
        success: false,
        error: `نوع الشكل غير مدعوم: ${type}`,
        errors: new z.ZodError([]),
      }
  }
}

// ============================================================================
// Top-Level Diagram Validation
// ============================================================================

/**
 * Validate complete diagram data
 */
export function validateDiagramData(diagram: unknown): ValidationResult<DiagramData> {
  try {
    // First, validate the top-level structure
    const topLevelResult = DiagramDataSchema.parse(diagram)

    // Then validate the type-specific data
    const { type, data } = topLevelResult

    // For chart types, validate chart data
    if (['bar-chart', 'pie-chart', 'line-graph'].includes(type)) {
      const chartResult = validateChartData(data)
      if (!chartResult.success) {
        return {
          success: false,
          error: `خطأ في بيانات الرسم البياني: ${chartResult.error}`,
          errors: chartResult.errors,
        }
      }
    }

    // For SVG types, validate shape data
    if (['circle', 'triangle', 'rectangle', 'composite-shape'].includes(type)) {
      const shapeResult = validateShapeData(type as DiagramType, data)
      if (!shapeResult.success) {
        return {
          success: false,
          error: `خطأ في بيانات الشكل: ${shapeResult.error}`,
          errors: shapeResult.errors,
        }
      }
    }

    // All validations passed
    return {
      success: true,
      data: topLevelResult as DiagramData,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: zodErrorToArabicMessage(error),
        errors: error,
      }
    }
    return {
      success: false,
      error: 'فشل التحقق من بيانات الرسم',
      errors: new z.ZodError([]),
    }
  }
}

/**
 * Normalizes composite-shape data to handle both flat and nested structures
 * Converts flat structure {cx, cy, radius} to nested {type: 'circle', data: {cx, cy, radius}}
 */
function normalizeCompositeShapeData(data: any): any {
  if (!data.shapes || !Array.isArray(data.shapes)) {
    return null
  }

  const normalizedShapes = data.shapes.map((shape: any) => {
    // If shape already has nested structure, keep it
    if (shape.type && shape.data) {
      return shape
    }

    // If shape has flat structure, convert to nested
    if (shape.type === 'circle' && shape.cx !== undefined) {
      return {
        type: 'circle',
        data: {
          cx: shape.cx,
          cy: shape.cy,
          radius: shape.radius,
          centerLabel: shape.centerLabel,
          radiusLabel: shape.radiusLabel,
        },
      }
    }

    if (shape.type === 'rectangle' && shape.x !== undefined) {
      return {
        type: 'rectangle',
        data: {
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height,
          cornerLabels: shape.cornerLabels,
          widthLabel: shape.widthLabel,
          heightLabel: shape.heightLabel,
        },
      }
    }

    if (shape.type === 'triangle' && shape.points !== undefined) {
      return {
        type: 'triangle',
        data: {
          points: shape.points,
          labels: shape.labels,
          type: shape.triangleType || 'scalene',
        },
      }
    }

    // Keep as-is if format is unclear
    return shape
  })

  return {
    shapes: normalizedShapes,
    connections: data.connections || [],
  }
}

/**
 * Sanitize diagram data by validating and applying fallbacks
 * Returns sanitized data or null if unrecoverable
 */
export function sanitizeDiagramData(diagram: DiagramData): DiagramData | null {
  const result = validateDiagramData(diagram)

  if (result.success) {
    return result.data
  }

  // Attempt to recover from validation errors
  try {
    const { type, data } = diagram

    // For chart types, try to fix the data
    if (['bar-chart', 'pie-chart', 'line-graph'].includes(type)) {
      const fixedChartResult = validateChartDataWithFallback(data)
      if (fixedChartResult.success) {
        return {
          ...diagram,
          data: fixedChartResult.data as unknown as Record<string, unknown>,
        }
      }
    }

    // For composite-shape, try normalization
    if (type === 'composite-shape') {
      const normalized = normalizeCompositeShapeData(data)
      if (normalized) {
        const revalidated = validateDiagramData({
          ...diagram,
          data: normalized,
        })
        if (revalidated.success) {
          return revalidated.data
        }
      }
    }

    // For other shapes, we can't safely auto-fix, so return null
    return null
  } catch {
    return null
  }
}

// ============================================================================
// Validation Status Helpers
// ============================================================================

/**
 * Check if diagram data is valid without returning details
 */
export function isDiagramValid(diagram: unknown): diagram is DiagramData {
  const result = validateDiagramData(diagram)
  return result.success
}

/**
 * Check if chart data is valid
 */
export function isChartDataValid(data: unknown): data is ValidatedChartData {
  const result = validateChartData(data)
  return result.success
}

/**
 * Get validation error category for diagram
 */
export function getDiagramErrorCategory(diagram: unknown): string | null {
  const result = validateDiagramData(diagram)
  if (result.success) {
    return null
  }
  return categorizeValidationError(result.errors)
}
