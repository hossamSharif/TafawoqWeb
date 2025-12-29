/**
 * Runtime validation schemas for diagram data using Zod
 * Provides type-safe validation with detailed error messages in Arabic
 */

import { z } from 'zod'

// ============================================================================
// Chart Data Schemas
// ============================================================================

/**
 * Schema for chart dataset
 */
const ChartDatasetSchema = z.object({
  label: z.string().optional(),
  data: z.array(z.number()).min(1, 'يجب أن تحتوي البيانات على قيمة واحدة على الأقل'),
  backgroundColor: z.union([z.string(), z.array(z.string())]).optional(),
  borderColor: z.union([z.string(), z.array(z.string())]).optional(),
  borderWidth: z.number().nonnegative().optional(),
  fill: z.boolean().optional(),
})

/**
 * Schema for chart options
 */
const ChartOptionsSchema = z.object({
  title: z.string().optional(),
  xAxisLabel: z.string().optional(),
  yAxisLabel: z.string().optional(),
  legend: z.boolean().optional(),
}).optional()

/**
 * Schema for complete chart data
 */
export const ChartDataSchema = z.object({
  labels: z.array(z.string()).min(1, 'يجب أن تحتوي التسميات على عنصر واحد على الأقل'),
  datasets: z.array(ChartDatasetSchema).min(1, 'يجب أن تحتوي البيانات على مجموعة واحدة على الأقل'),
  options: ChartOptionsSchema,
})

export type ValidatedChartData = z.infer<typeof ChartDataSchema>

// ============================================================================
// SVG Shape Schemas
// ============================================================================

/**
 * Schema for circle annotations
 */
const CircleAnnotationSchema = z.object({
  type: z.enum(['radius', 'diameter', 'point']),
  label: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
})

/**
 * Schema for circle data
 */
export const CircleDataSchema = z.object({
  // Standard SVG properties
  cx: z.number().optional(),
  cy: z.number().optional(),
  r: z.number().positive('يجب أن يكون نصف القطر قيمة موجبة').optional(),
  // Claude AI format
  radius: z.number().positive('يجب أن يكون نصف القطر قيمة موجبة').optional(),
  center: z.tuple([z.number(), z.number()]).optional(),
  showRadius: z.boolean().optional(),
  showDiameter: z.boolean().optional(),
  // Common properties
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().nonnegative().optional(),
  label: z.string().optional(),
  labelPosition: z.enum(['center', 'top', 'bottom']).optional(),
  annotations: z.array(CircleAnnotationSchema).optional(),
}).refine(
  (data) => data.r !== undefined || data.radius !== undefined,
  {
    message: 'يجب توفير نصف القطر (r أو radius)',
  }
)

export type ValidatedCircleData = z.infer<typeof CircleDataSchema>

/**
 * Schema for triangle vertex (supports two formats)
 */
const TriangleVertexSchema = z.union([
  z.tuple([z.number(), z.number()]), // [x, y] format
  z.object({ x: z.number(), y: z.number(), label: z.string().optional() }), // {x, y, label} format
])

/**
 * Schema for triangle data
 */
export const TriangleDataSchema = z.object({
  vertices: z.array(TriangleVertexSchema).length(3, 'يجب أن يحتوي المثلث على 3 رؤوس بالضبط').optional(),
  points: z.array(z.object({
    x: z.number(),
    y: z.number(),
    label: z.string().optional(),
  })).length(3, 'يجب أن يحتوي المثلث على 3 نقاط بالضبط').optional(),
  labels: z.array(z.string()).optional(),
  sides: z.array(z.string().nullable()).optional(),
  angles: z.tuple([
    z.string().optional(),
    z.string().optional(),
    z.string().optional(),
  ]).optional(),
  height: z.string().optional(),
  showHeight: z.boolean().optional(),
  type: z.enum(['scalene', 'isosceles', 'equilateral', 'right']).optional(),
  rightAngleIndex: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
}).refine(
  (data) => data.vertices !== undefined || data.points !== undefined,
  {
    message: 'يجب توفير الرؤوس (vertices) أو النقاط (points)',
  }
)

export type ValidatedTriangleData = z.infer<typeof TriangleDataSchema>

/**
 * Schema for rectangle data
 */
export const RectangleDataSchema = z.object({
  width: z.number().positive('يجب أن يكون العرض قيمة موجبة'),
  height: z.number().positive('يجب أن يكون الارتفاع قيمة موجبة'),
  cornerLabels: z.tuple([
    z.string().optional(),
    z.string().optional(),
    z.string().optional(),
    z.string().optional(),
  ]).optional(),
  widthLabel: z.string().optional(),
  heightLabel: z.string().optional(),
  diagonalLabel: z.string().optional(),
  showDiagonal: z.boolean().optional(),
  isSquare: z.boolean().optional(),
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().nonnegative().optional(),
})

export type ValidatedRectangleData = z.infer<typeof RectangleDataSchema>

/**
 * Schema for composite shape data
 */
export const CompositeShapeDataSchema = z.object({
  shapes: z.array(z.object({
    type: z.enum(['circle', 'triangle', 'rectangle']),
    data: z.union([CircleDataSchema, TriangleDataSchema, RectangleDataSchema]),
  })).min(1, 'يجب أن يحتوي الشكل المركب على شكل واحد على الأقل'),
  connections: z.array(z.object({
    from: z.object({ x: z.number(), y: z.number() }),
    to: z.object({ x: z.number(), y: z.number() }),
    style: z.enum(['solid', 'dashed']).optional(),
    label: z.string().optional(),
  })).optional(),
})

export type ValidatedCompositeShapeData = z.infer<typeof CompositeShapeDataSchema>

// ============================================================================
// Top-Level Diagram Schema
// ============================================================================

/**
 * Discriminated union schema for all diagram types
 */
export const DiagramDataSchema = z.object({
  type: z.enum([
    'circle',
    'triangle',
    'rectangle',
    'composite-shape',
    'bar-chart',
    'pie-chart',
    'line-graph',
    'custom',
  ]),
  data: z.record(z.unknown()),
  renderHint: z.enum(['SVG', 'Canvas', 'Chart.js']),
  caption: z.string().optional(),
})

export type ValidatedDiagramData = z.infer<typeof DiagramDataSchema>

// ============================================================================
// Validation Result Types
// ============================================================================

/**
 * Validation result with typed success or error
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; errors: z.ZodError }

/**
 * Error categories for diagram validation
 */
export type DiagramErrorCategory =
  | 'missing-required-field'
  | 'invalid-type'
  | 'out-of-range'
  | 'empty-array'
  | 'malformed-data'

/**
 * Detailed validation error
 */
export interface DiagramValidationError {
  category: DiagramErrorCategory
  message: string
  field?: string
  expected?: string
  received?: string
}

// ============================================================================
// Error Message Helpers
// ============================================================================

/**
 * Convert Zod error to user-friendly Arabic message
 */
export function zodErrorToArabicMessage(error: z.ZodError): string {
  const firstIssue = error.issues[0]

  if (!firstIssue) {
    return 'البيانات غير صالحة'
  }

  // Use custom message if provided
  if (firstIssue.message && !firstIssue.message.startsWith('Invalid') && !firstIssue.message.startsWith('Required')) {
    return firstIssue.message
  }

  // Generate message based on error type
  switch (firstIssue.code) {
    case 'invalid_type':
      return `نوع البيانات غير صحيح في "${firstIssue.path.join('.')}": متوقع ${firstIssue.expected}، تم استلام ${firstIssue.received}`

    case 'too_small':
      if (firstIssue.type === 'array') {
        return `عدد العناصر في "${firstIssue.path.join('.')}" قليل جداً (الحد الأدنى: ${firstIssue.minimum})`
      }
      return `القيمة في "${firstIssue.path.join('.')}" صغيرة جداً (الحد الأدنى: ${firstIssue.minimum})`

    case 'too_big':
      if (firstIssue.type === 'array') {
        return `عدد العناصر في "${firstIssue.path.join('.')}" كثير جداً (الحد الأقصى: ${firstIssue.maximum})`
      }
      return `القيمة في "${firstIssue.path.join('.')}" كبيرة جداً (الحد الأقصى: ${firstIssue.maximum})`

    case 'invalid_enum_value':
      return `قيمة غير صالحة في "${firstIssue.path.join('.')}": ${JSON.stringify(firstIssue.options)}`

    case 'custom':
      return firstIssue.message || 'البيانات غير صالحة'

    default:
      return `خطأ في التحقق من "${firstIssue.path.join('.')}": ${firstIssue.message}`
  }
}

/**
 * Categorize validation error
 */
export function categorizeValidationError(error: z.ZodError): DiagramErrorCategory {
  const firstIssue = error.issues[0]

  if (!firstIssue) {
    return 'malformed-data'
  }

  switch (firstIssue.code) {
    case 'invalid_type':
      if (firstIssue.received === 'undefined') {
        return 'missing-required-field'
      }
      return 'invalid-type'

    case 'too_small':
      if (firstIssue.type === 'array' && firstIssue.minimum === 1) {
        return 'empty-array'
      }
      return 'out-of-range'

    case 'too_big':
      return 'out-of-range'

    default:
      return 'malformed-data'
  }
}
