'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { DiagramType } from '@/types/question'

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
}: ChartDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<ChartInstance | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const initChart = async () => {
      if (!canvasRef.current) return

      try {
        // Dynamic import of Chart.js
        const { Chart, registerables } = await import('chart.js')
        Chart.register(...registerables)

        if (!mounted) return

        // Destroy existing chart
        if (chartRef.current) {
          chartRef.current.destroy()
        }

        const ctx = canvasRef.current.getContext('2d')
        if (!ctx) {
          setError('فشل في تهيئة الرسم البياني')
          return
        }

        const chartType = chartTypeMap[type] || 'bar'

        // Apply default colors if not provided
        const datasets = data.datasets.map((dataset, index) => ({
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
            labels: data.labels,
            datasets,
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            // RTL support
            plugins: {
              legend: {
                display: data.options?.legend !== false,
                position: 'top',
                rtl: true,
                labels: {
                  font: {
                    family: 'Noto Kufi Arabic, sans-serif',
                  },
                },
              },
              title: data.options?.title
                ? {
                    display: true,
                    text: data.options.title,
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
                      title: data.options?.xAxisLabel
                        ? {
                            display: true,
                            text: data.options.xAxisLabel,
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
                      title: data.options?.yAxisLabel
                        ? {
                            display: true,
                            text: data.options.yAxisLabel,
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

        setIsLoading(false)
      } catch (err) {
        console.error('Chart initialization error:', err)
        if (mounted) {
          setError('فشل في تحميل الرسم البياني')
          setIsLoading(false)
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
  }, [type, data])

  if (error) {
    return (
      <div
        className={cn(
          'chart-diagram flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg',
          className
        )}
        dir="rtl"
      >
        <p className="text-red-500 text-sm">{error}</p>
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
