'use client'

import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { cn } from '@/lib/utils'
import { Lock } from 'lucide-react'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export interface TrendDataPoint {
  date: string
  verbal?: number
  quantitative?: number
  overall: number
}

interface TrendChartProps {
  data: TrendDataPoint[]
  title?: string
  showVerbal?: boolean
  showQuantitative?: boolean
  showOverall?: boolean
  height?: number
  isPremium?: boolean
  isLocked?: boolean
  onUnlockClick?: () => void
  className?: string
}

const CHART_COLORS = {
  overall: {
    line: '#6366F1', // Indigo
    background: 'rgba(99, 102, 241, 0.1)',
  },
  verbal: {
    line: '#10B981', // Green
    background: 'rgba(16, 185, 129, 0.1)',
  },
  quantitative: {
    line: '#F59E0B', // Amber
    background: 'rgba(245, 158, 11, 0.1)',
  },
}

/**
 * Line chart for displaying historical exam score trends
 */
export function TrendChart({
  data,
  title = 'تطور الأداء',
  showVerbal = true,
  showQuantitative = true,
  showOverall = true,
  height = 300,
  isPremium = false,
  isLocked = false,
  onUnlockClick,
  className,
}: TrendChartProps) {
  // Format dates for display
  const labels = data.map((d) => {
    const date = new Date(d.date)
    return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
  })

  const datasets: ChartData<'line'>['datasets'] = []

  if (showOverall) {
    datasets.push({
      label: 'الإجمالي',
      data: data.map((d) => d.overall),
      borderColor: CHART_COLORS.overall.line,
      backgroundColor: CHART_COLORS.overall.background,
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6,
    })
  }

  if (showVerbal) {
    datasets.push({
      label: 'لفظي',
      data: data.map((d) => d.verbal ?? 0),
      borderColor: CHART_COLORS.verbal.line,
      backgroundColor: 'transparent',
      borderDash: [5, 5],
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 5,
    })
  }

  if (showQuantitative) {
    datasets.push({
      label: 'كمي',
      data: data.map((d) => d.quantitative ?? 0),
      borderColor: CHART_COLORS.quantitative.line,
      backgroundColor: 'transparent',
      borderDash: [5, 5],
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 5,
    })
  }

  const chartData: ChartData<'line'> = {
    labels,
    datasets,
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        rtl: true,
        labels: {
          font: {
            family: 'Noto Kufi Arabic, sans-serif',
          },
          usePointStyle: true,
          padding: 20,
        },
      },
      title: {
        display: !!title,
        text: title,
        font: {
          family: 'Noto Kufi Arabic, sans-serif',
          size: 16,
          weight: 'bold',
        },
        padding: { bottom: 20 },
      },
      tooltip: {
        rtl: true,
        titleFont: {
          family: 'Noto Kufi Arabic, sans-serif',
        },
        bodyFont: {
          family: 'Noto Kufi Arabic, sans-serif',
        },
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw}%`,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`,
          font: {
            family: 'Noto Kufi Arabic, sans-serif',
          },
        },
        grid: {
          color: '#E5E7EB',
        },
      },
      x: {
        ticks: {
          font: {
            family: 'Noto Kufi Arabic, sans-serif',
          },
        },
        grid: {
          display: false,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  }

  if (isLocked) {
    return (
      <div className={cn('relative', className)}>
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex flex-col items-center justify-center z-10">
          <Lock className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-bold text-gray-700 mb-2">
            {title}
          </h3>
          <p className="text-gray-500 text-sm text-center mb-4 px-4">
            تتبع تقدمك عبر الزمن واطلع على رؤى تفصيلية
          </p>
          {onUnlockClick && (
            <button
              onClick={onUnlockClick}
              className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
            >
              ترقية للمميز
            </button>
          )}
        </div>
        <div className="opacity-20 pointer-events-none" style={{ height }}>
          <Line data={chartData} options={options} />
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-gray-50 rounded-lg',
          className
        )}
        style={{ height }}
      >
        <p className="text-gray-500 text-sm">لا توجد بيانات كافية لعرض الرسم البياني</p>
        <p className="text-gray-400 text-xs mt-1">أكمل اختبارين على الأقل لرؤية تطورك</p>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)} style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  )
}

interface SimpleTrendProps {
  data: number[]
  labels?: string[]
  color?: string
  height?: number
  className?: string
}

/**
 * Simple single-line trend chart for compact displays
 */
export function SimpleTrend({
  data,
  labels,
  color = '#6366F1',
  height = 100,
  className,
}: SimpleTrendProps) {
  const chartLabels = labels || data.map((_, i) => `${i + 1}`)

  const chartData: ChartData<'line'> = {
    labels: chartLabels,
    datasets: [
      {
        data,
        borderColor: color,
        backgroundColor: `${color}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.raw}%`,
        },
      },
    },
    scales: {
      y: {
        display: false,
        min: Math.min(...data) - 10,
        max: Math.max(...data) + 10,
      },
      x: { display: false },
    },
    interaction: {
      intersect: false,
    },
  }

  return (
    <div className={className} style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  )
}

interface TrendIndicatorProps {
  current: number
  previous: number
  className?: string
}

/**
 * Simple trend indicator showing improvement or decline
 */
export function TrendIndicator({ current, previous, className }: TrendIndicatorProps) {
  const diff = current - previous
  const percentage = previous > 0 ? Math.round((diff / previous) * 100) : 0

  if (diff === 0) {
    return (
      <span className={cn('text-gray-500 text-sm', className)}>
        ثابت
      </span>
    )
  }

  if (diff > 0) {
    return (
      <span className={cn('text-green-600 text-sm flex items-center gap-1', className)}>
        <span>↑</span>
        <span>+{Math.abs(diff)}%</span>
        {percentage > 0 && <span className="text-xs text-gray-400">({percentage}% تحسن)</span>}
      </span>
    )
  }

  return (
    <span className={cn('text-red-600 text-sm flex items-center gap-1', className)}>
      <span>↓</span>
      <span>-{Math.abs(diff)}%</span>
      {percentage < 0 && <span className="text-xs text-gray-400">({Math.abs(percentage)}% انخفاض)</span>}
    </span>
  )
}

export default TrendChart
