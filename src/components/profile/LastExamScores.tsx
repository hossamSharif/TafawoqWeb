'use client'

import { Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getScoreColor, getScoreLabel } from '@/lib/utils/scoring'

interface LastExamScoresProps {
  scores: {
    verbal: number
    quantitative: number
    overall: number
  } | null
  className?: string
}

function ScoreCircle({
  score,
  label,
  size = 'md',
}: {
  score: number
  label: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const colorClass = getScoreColor(score)
  const sizeClasses = {
    sm: 'w-16 h-16 text-lg',
    md: 'w-20 h-20 text-xl',
    lg: 'w-28 h-28 text-3xl',
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold',
          sizeClasses[size],
          colorClass === 'gold' && 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300',
          colorClass === 'green' && 'bg-green-100 text-green-700 border-2 border-green-300',
          colorClass === 'grey' && 'bg-gray-100 text-gray-700 border-2 border-gray-300',
          colorClass === 'warm' && 'bg-orange-100 text-orange-700 border-2 border-orange-300'
        )}
      >
        {Math.round(score)}%
      </div>
      <span className={cn(
        'font-medium text-gray-600',
        size === 'lg' ? 'text-base' : 'text-sm'
      )}>
        {label}
      </span>
      <span
        className={cn(
          'text-xs',
          colorClass === 'gold' && 'text-yellow-600',
          colorClass === 'green' && 'text-green-600',
          colorClass === 'grey' && 'text-gray-500',
          colorClass === 'warm' && 'text-orange-600'
        )}
      >
        {getScoreLabel(score)}
      </span>
    </div>
  )
}

export function LastExamScores({ scores, className }: LastExamScoresProps) {
  if (!scores) {
    return (
      <div className={cn('bg-white rounded-xl shadow-sm p-6', className)}>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-gray-900">نتائج آخر اختبار</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>لم تكمل أي اختبار بعد</p>
          <p className="text-sm mt-2">ابدأ اختبارك الأول للحصول على النتائج</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('bg-white rounded-xl shadow-sm p-6', className)}>
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-gray-900">نتائج آخر اختبار</h2>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-8">
        {/* Overall Score - Larger */}
        <ScoreCircle score={scores.overall} label="الإجمالي" size="lg" />

        {/* Section Scores */}
        <div className="flex gap-8">
          <ScoreCircle score={scores.quantitative} label="كمي" size="md" />
          <ScoreCircle score={scores.verbal} label="لفظي" size="md" />
        </div>
      </div>

      {/* Score Legend */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex flex-wrap justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-300"></span>
            <span className="text-gray-500">ممتاز (85%+)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-300"></span>
            <span className="text-gray-500">جيد جداً (70-84%)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-orange-300"></span>
            <span className="text-gray-500">جيد (50-69%)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-gray-300"></span>
            <span className="text-gray-500">يحتاج تحسين (&lt;50%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
