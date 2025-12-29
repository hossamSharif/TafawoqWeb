/**
 * Error logging and monitoring utilities for diagram rendering
 * Provides structured logging for debugging and future integration with error tracking services
 */

import type { DiagramType } from '@/types/question'
import type { DiagramErrorCategory } from './validation'

// ============================================================================
// Error Types
// ============================================================================

export type DiagramErrorType =
  | 'import-failed'      // Chart.js dynamic import failed
  | 'canvas-failed'      // Canvas context initialization failed
  | 'data-invalid'       // Data validation failed
  | 'render-failed'      // Rendering error
  | 'font-failed'        // Font loading failed
  | 'unknown'            // Unknown error

export interface DiagramError {
  type: DiagramErrorType
  diagramType: DiagramType
  message: string
  details?: unknown
  timestamp: number
  context?: Record<string, unknown>
}

export interface DiagramLoadMetrics {
  diagramType: DiagramType
  loadDuration: number
  success: boolean
  retryCount?: number
  timestamp: number
}

export interface ValidationFailure {
  diagramType: DiagramType
  category: DiagramErrorCategory
  message: string
  field?: string
  timestamp: number
}

// ============================================================================
// Logging Functions
// ============================================================================

/**
 * Log a diagram error
 * In production, this could be sent to error tracking service (Sentry, LogRocket, etc.)
 */
export function logDiagramError(
  type: DiagramErrorType,
  diagramType: DiagramType,
  error: Error | string,
  context?: Record<string, unknown>
): void {
  const errorData: DiagramError = {
    type,
    diagramType,
    message: typeof error === 'string' ? error : error.message,
    details: typeof error === 'string' ? undefined : error,
    timestamp: Date.now(),
    context,
  }

  // Console logging for development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Diagram Error]', {
      ...errorData,
      details: typeof error === 'string' ? undefined : {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    })
  }

  // TODO: Send to error tracking service in production
  // Example: Sentry.captureException(error, { extra: errorData })
}

/**
 * Log diagram load metrics
 * Tracks performance of diagram rendering
 */
export function logDiagramLoad(metrics: DiagramLoadMetrics): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Diagram Load]', metrics)
  }

  // Warn if load took too long
  if (metrics.loadDuration > 1000) {
    console.warn('[Diagram Performance]', `Slow diagram load: ${metrics.loadDuration}ms`, metrics)
  }

  // TODO: Send to analytics service in production
  // Example: analytics.track('diagram_load', metrics)
}

/**
 * Log validation failure
 * Tracks data quality issues
 */
export function logValidationFailure(failure: ValidationFailure): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Diagram Validation]', failure)
  }

  // TODO: Send to monitoring service to track data quality
  // Example: monitoring.trackDataQuality('diagram_validation_failed', failure)
}

/**
 * Log Chart.js import attempt
 */
export function logChartImportAttempt(attempt: number, success: boolean, error?: Error): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Chart.js Import]', {
      attempt,
      success,
      error: error?.message,
    })
  }
}

/**
 * Log font loading attempt
 */
export function logFontLoadAttempt(fontFamily: string, success: boolean, duration: number): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Font Loading]', {
      fontFamily,
      success,
      duration,
    })
  }

  if (!success) {
    console.warn('[Font Loading]', `Failed to load font: ${fontFamily}`)
  }
}

// ============================================================================
// Performance Monitoring
// ============================================================================

/**
 * Create a performance timer for diagram operations
 */
export function createDiagramTimer() {
  const startTime = performance.now()

  return {
    /**
     * Get elapsed time in milliseconds
     */
    elapsed(): number {
      return performance.now() - startTime
    },

    /**
     * Complete the timer and log metrics
     */
    complete(diagramType: DiagramType, success: boolean, retryCount?: number): void {
      const duration = this.elapsed()
      logDiagramLoad({
        diagramType,
        loadDuration: duration,
        success,
        retryCount,
        timestamp: Date.now(),
      })
    },
  }
}

// ============================================================================
// Error Categorization
// ============================================================================

/**
 * Categorize an error for better tracking
 */
export function categorizeError(error: Error): DiagramErrorType {
  const message = error.message.toLowerCase()

  if (message.includes('import') || message.includes('dynamic import')) {
    return 'import-failed'
  }

  if (message.includes('canvas') || message.includes('getcontext')) {
    return 'canvas-failed'
  }

  if (message.includes('validat') || message.includes('invalid') || message.includes('required')) {
    return 'data-invalid'
  }

  if (message.includes('font')) {
    return 'font-failed'
  }

  if (message.includes('render')) {
    return 'render-failed'
  }

  return 'unknown'
}

// ============================================================================
// User-Friendly Error Messages
// ============================================================================

/**
 * Get user-friendly Arabic error message based on error type
 */
export function getUserFriendlyErrorMessage(errorType: DiagramErrorType): string {
  switch (errorType) {
    case 'import-failed':
      return 'فشل تحميل مكتبة الرسم البياني. يرجى التحقق من اتصال الإنترنت.'

    case 'canvas-failed':
      return 'فشل تهيئة منطقة الرسم. يرجى تحديث المتصفح.'

    case 'data-invalid':
      return 'بيانات الرسم غير صالحة. يرجى المحاولة مرة أخرى.'

    case 'render-failed':
      return 'فشل عرض الرسم. يرجى المحاولة مرة أخرى.'

    case 'font-failed':
      return 'فشل تحميل الخط. سيتم استخدام خط بديل.'

    case 'unknown':
    default:
      return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
  }
}

/**
 * Get error recovery instructions
 */
export function getErrorRecoveryInstructions(errorType: DiagramErrorType): string[] {
  switch (errorType) {
    case 'import-failed':
      return [
        'تحقق من اتصال الإنترنت',
        'أعد تحميل الصفحة',
        'إذا استمرت المشكلة، استخدم خيار "عرض كنص"',
      ]

    case 'canvas-failed':
      return [
        'حدّث المتصفح إلى أحدث إصدار',
        'جرّب متصفحاً آخر',
        'تأكد من تفعيل JavaScript',
      ]

    case 'data-invalid':
      return [
        'أعد المحاولة',
        'إذا استمرت المشكلة، استخدم خيار "عرض كنص"',
      ]

    case 'render-failed':
      return [
        'انقر على "إعادة المحاولة"',
        'أعد تحميل الصفحة',
        'استخدم خيار "عرض كنص" للمتابعة',
      ]

    case 'font-failed':
      return [
        'سيستمر الرسم بخط بديل',
        'لا حاجة لإجراء',
      ]

    case 'unknown':
    default:
      return [
        'أعد تحميل الصفحة',
        'إذا استمرت المشكلة، استخدم خيار "عرض كنص"',
        'تواصل مع الدعم الفني إذا تكرر الخطأ',
      ]
  }
}
