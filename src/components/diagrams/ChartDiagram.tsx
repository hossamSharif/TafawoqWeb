'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { DiagramType } from '@/types/question'
import {
  logDiagramError,
  logChartImportAttempt,
  logFontLoadAttempt,
  createDiagramTimer,
  categorizeError,
  type DiagramErrorType,
} from '@/lib/diagrams/errorLogging'
import { validateChartDataWithFallback } from '@/lib/diagrams/validators'
import { ChartFallback, ChartFallbackButton } from './ChartFallback'

// Chart.js types for dynamic import
type ChartInstance = {
  destroy: () => void
  update: () => void
}

export interface ChartData {
  labels: string[]
  datasets: Array<{
    label?: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
    fill?: boolean
  }>
  options?: {
    title?: string
    xAxisLabel?: string
    yAxisLabel?: string
    legend?: boolean
  }
}

interface ChartDiagramProps {
  type: DiagramType
  data: ChartData
  caption?: string
  className?: string
  onClick?: () => void
  interactive?: boolean
  onLoadSuccess?: () => void
  onLoadError?: (error: string, errorType: DiagramErrorType) => void
}

// Map diagram types to Chart.js chart types
const chartTypeMap: Record<string, string> = {
  'bar-chart': 'bar',
  'pie-chart': 'pie',
  'line-graph': 'line',
}

// Default Arabic-friendly colors
const defaultColors = [
  '#1E5631', // Saudi Deep Green (primary)
  '#D4AF37', // Muted Gold (accent)
  '#2563EB', // Blue
  '#DC2626', // Red
  '#059669', // Emerald
  '#7C3AED', // Violet
]

/**
 * ChartDiagram - Renders statistical charts using Chart.js
 * Supports bar, pie, and line charts with RTL support
 */
export function ChartDiagram({
  type,
  data,
  caption,
  className,
  onClick,
  interactive = false,
  onLoadSuccess,
  onLoadError,
}: ChartDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<ChartInstance | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<DiagramErrorType | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [showFallback, setShowFallback] = useState(false)
  const timerRef = useRef(createDiagramTimer())

  // Memoize data to prevent unnecessary re-initialization
  const memoizedData = useMemo(() => {
    // Validate data with fallback
    const validationResult = validateChartDataWithFallback(data)
    return validationResult.success ? validationResult.data : data
  }, [JSON.stringify(data)])

  // Wait for canvas to be ready
  const waitForCanvas = useCallback(async (): Promise<boolean> => {
    const maxAttempts = 10
    const interval = 100 // ms

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        if (ctx) {
          return true
        }
      }
      await new Promise((resolve) => setTimeout(resolve, interval))
    }

    return false
  }, [])

  // Check if font is loaded
  const checkFontLoaded = useCallback(async (): Promise<boolean> => {
    const fontFamily = 'Noto Kufi Arabic'
    const fontStartTime = performance.now()

    try {
      // Check if FontFaceSet API is available
      if (!document.fonts) {
        logFontLoadAttempt(fontFamily, false, 0)
        return false // Font API not available, proceed anyway
      }

      // Wait for font to load or timeout after 3s
      const timeout = 3000
      const fontLoadPromise = document.fonts.load('12px "Noto Kufi Arabic"')
      const timeoutPromise = new Promise<FontFace[]>((resolve) =>
        setTimeout(() => resolve([]), timeout)
      )

      await Promise.race([fontLoadPromise, timeoutPromise])

      // Check if font is actually loaded
      const isLoaded = document.fonts.check('12px "Noto Kufi Arabic"')
      const duration = performance.now() - fontStartTime

      logFontLoadAttempt(fontFamily, isLoaded, duration)
      return isLoaded
    } catch (err) {
      const duration = performance.now() - fontStartTime
      logFontLoadAttempt(fontFamily, false, duration)
      return false // Proceed even if font loading fails
    }
  }, [])

  // Dynamic import with retry
  const importChartJS = useCallback(async (attempt: number = 0): Promise<typeof import('chart.js') | null> => {
    const maxRetries = 3
    const delays = [0, 1000, 3000] // Exponential backoff

    try {
      const chartModule = await import('chart.js')
      logChartImportAttempt(attempt + 1, true)
      return chartModule
    } catch (err) {
      logChartImportAttempt(attempt + 1, false, err as Error)

      if (attempt < maxRetries - 1) {
        // Wait and retry
        await new Promise((resolve) => setTimeout(resolve, delays[attempt + 1]))
        return importChartJS(attempt + 1)
      }

      // All retries exhausted
      return null
    }
  }, [])

  // Main chart initialization effect
  useEffect(() => {
    let mounted = true

    const initChart = async () => {
      try {
        // Reset error state
        setError(null)
        setErrorType(null)

        // Step 1: Wait for canvas to be ready
        const canvasReady = await waitForCanvas()
        if (!mounted) return

        if (!canvasReady || !canvasRef.current) {
          const errType = 'canvas-failed'
          setErrorType(errType)
          setError('فشل في تهيئة الرسم البياني')
          logDiagramError(errType, type, 'Canvas context not available')
          onLoadError?.('فشل في تهيئة الرسم البياني', errType)
          setIsLoading(false)
          return
        }

        // Step 2: Load font (non-blocking)
        await checkFontLoaded()
        if (!mounted) return

        // Step 3: Import Chart.js with retry
        const chartModule = await importChartJS(retryCount)
        if (!mounted) return

        if (!chartModule) {
          const errType = 'import-failed'
          setErrorType(errType)
          setError('فشل في تحميل مكتبة الرسم البياني')
          logDiagramError(errType, type, 'Failed to import Chart.js after retries')
          onLoadError?.('فشل في تحميل مكتبة الرسم البياني', errType)
          setIsLoading(false)
          return
        }

        const { Chart, registerables } = chartModule
        Chart.register(...registerables)

        // Step 4: Destroy existing chart
        if (chartRef.current) {
          chartRef.current.destroy()
        }

        // Step 5: Get canvas context
        const ctx = canvasRef.current.getContext('2d')
        if (!ctx) {
          const errType = 'canvas-failed'
          setErrorType(errType)
          setError('فشل في تهيئة الرسم البياني')
          logDiagramError(errType, type, 'Canvas context is null')
          onLoadError?.('فشل في تهيئة الرسم البياني', errType)
          setIsLoading(false)
          return
        }

        // Step 6: Create chart
        const chartType = chartTypeMap[type] || 'bar'

        // Apply default colors if not provided
        const datasets = memoizedData.datasets.map((dataset, index) => ({
          ...dataset,
          backgroundColor:
            dataset.backgroundColor ||
            (chartType === 'pie' ? defaultColors : defaultColors[index % defaultColors.length]),
          borderColor:
            dataset.borderColor ||
            (chartType === 'line' ? defaultColors[index % defaultColors.length] : undefined),
          borderWidth: dataset.borderWidth || (chartType === 'pie' ? 1 : 2),
        }))

        // Create chart with RTL support
        chartRef.current = new Chart(ctx, {
          type: chartType as 'bar' | 'pie' | 'line',
          data: {
            labels: memoizedData.labels,
            datasets,
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            // RTL support
            plugins: {
              legend: {
                display: memoizedData.options?.legend !== false,
                position: 'top',
                rtl: true,
                labels: {
                  font: {
                    family: 'Noto Kufi Arabic, sans-serif',
                  },
                },
              },
              title: memoizedData.options?.title
                ? {
                    display: true,
                    text: memoizedData.options.title,
                    font: {
                      family: 'Noto Kufi Arabic, sans-serif',
                      size: 14,
                      weight: 'bold' as const,
                    },
                  }
                : undefined,
              tooltip: {
                rtl: true,
                titleFont: {
                  family: 'Noto Kufi Arabic, sans-serif',
                },
                bodyFont: {
                  family: 'Noto Kufi Arabic, sans-serif',
                },
              },
            },
            scales:
              chartType !== 'pie'
                ? {
                    x: {
                      ticks: {
                        font: {
                          family: 'Noto Kufi Arabic, sans-serif',
                        },
                      },
                      title: memoizedData.options?.xAxisLabel
                        ? {
                            display: true,
                            text: memoizedData.options.xAxisLabel,
                            font: {
                              family: 'Noto Kufi Arabic, sans-serif',
                            },
                          }
                        : undefined,
                    },
                    y: {
                      ticks: {
                        font: {
                          family: 'Noto Kufi Arabic, sans-serif',
                        },
                      },
                      title: memoizedData.options?.yAxisLabel
                        ? {
                            display: true,
                            text: memoizedData.options.yAxisLabel,
                            font: {
                              family: 'Noto Kufi Arabic, sans-serif',
                            },
                          }
                        : undefined,
                    },
                  }
                : undefined,
          },
        }) as unknown as ChartInstance

        // Success!
        setIsLoading(false)
        timerRef.current.complete(type, true, retryCount)
        onLoadSuccess?.()
      } catch (err) {
        const error = err as Error
        const errType = categorizeError(error)

        if (mounted) {
          setErrorType(errType)
          setError('فشل في تحميل الرسم البياني')
          setIsLoading(false)
          logDiagramError(errType, type, error)
          timerRef.current.complete(type, false, retryCount)
          onLoadError?.('فشل في تحميل الرسم البياني', errType)
        }
      }
    }

    initChart()

    return () => {
      mounted = false
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [type, memoizedData, retryCount, waitForCanvas, checkFontLoaded, importChartJS, onLoadSuccess, onLoadError])

  // Retry handler
  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1)
    setError(null)
    setErrorType(null)
    setIsLoading(true)
    setShowFallback(false)
    timerRef.current = createDiagramTimer()
  }, [])

  // Fallback toggle handler
  const handleShowFallback = useCallback(() => {
    setShowFallback(true)
  }, [])

  // Show fallback table if requested or if max retries reached
  if (showFallback || (error && retryCount >= 3)) {
    return (
      <div className={cn('space-y-3', className)}>
        <ChartFallback data={memoizedData} caption={caption} />
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={cn(
          'chart-diagram flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg gap-4',
          className
        )}
        dir="rtl"
      >
        {/* Error icon */}
        <svg className="w-12 h-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>

        {/* Error message */}
        <p className="text-red-600 text-sm font-medium text-center">{error}</p>

        {/* Error type hint */}
        {errorType && retryCount < 3 && (
          <p className="text-gray-500 text-xs text-center max-w-xs">
            {errorType === 'import-failed' && 'يرجى التحقق من اتصال الإنترنت'}
            {errorType === 'canvas-failed' && 'يرجى تحديث المتصفح أو استخدام متصفح آخر'}
            {errorType === 'data-invalid' && 'البيانات المُستلمة غير صالحة'}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {/* Retry button */}
          {retryCount < 3 && (
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-[#1E5631] text-white rounded-lg hover:bg-[#163f24] transition-colors text-sm font-medium"
            >
              إعادة المحاولة {retryCount > 0 && `(${retryCount + 1}/3)`}
            </button>
          )}

          {/* Fallback button */}
          <ChartFallbackButton onClick={handleShowFallback} />
        </div>

        {/* Max retries info */}
        {retryCount >= 3 && (
          <p className="text-gray-600 text-xs text-center max-w-xs">
            تم الوصول إلى الحد الأقصى من المحاولات
          </p>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'chart-diagram flex flex-col items-center',
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
      {/* Loading state */}
      {isLoading && (
        <div className="w-full max-w-md h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
          <span className="text-gray-400 text-sm">جاري التحميل...</span>
        </div>
      )}

      {/* Chart canvas */}
      <div className={cn('w-full max-w-md', isLoading && 'hidden')}>
        <canvas ref={canvasRef} role="img" aria-label={caption || 'رسم بياني'} />
      </div>

      {/* Caption */}
      {caption && (
        <p className="mt-2 text-sm text-gray-600 text-center" dir="rtl">
          {caption}
        </p>
      )}

      {/* Interactive hint */}
      {interactive && !isLoading && (
        <p className="mt-1 text-xs text-gray-400 text-center" dir="rtl">
          انقر للتكبير
        </p>
      )}
    </div>
  )
}

export default ChartDiagram
