'use client'

import { cn } from '@/lib/utils'
import {
  Lightbulb,
  BookOpen,
  Target,
  Clock,
  TrendingUp,
  CheckCircle,
  Star,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export interface Recommendation {
  id: string
  type: 'practice' | 'strategy' | 'time' | 'focus' | 'general'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category?: string
  actionUrl?: string
  actionLabel?: string
  isCompleted?: boolean
}

interface RecommendationsListProps {
  recommendations: Recommendation[]
  maxItems?: number
  showPriority?: boolean
  variant?: 'card' | 'inline' | 'compact'
  onAction?: (recommendation: Recommendation) => void
  className?: string
}

const TYPE_ICONS: Record<Recommendation['type'], React.ReactNode> = {
  practice: <Target className="w-5 h-5" />,
  strategy: <Lightbulb className="w-5 h-5" />,
  time: <Clock className="w-5 h-5" />,
  focus: <BookOpen className="w-5 h-5" />,
  general: <Star className="w-5 h-5" />,
}

const TYPE_COLORS: Record<Recommendation['type'], string> = {
  practice: 'text-blue-600 bg-blue-50',
  strategy: 'text-yellow-600 bg-yellow-50',
  time: 'text-purple-600 bg-purple-50',
  focus: 'text-green-600 bg-green-50',
  general: 'text-gray-600 bg-gray-50',
}

const PRIORITY_BADGES: Record<Recommendation['priority'], { label: string; className: string }> = {
  high: { label: 'مهم جداً', className: 'bg-red-100 text-red-700' },
  medium: { label: 'مهم', className: 'bg-yellow-100 text-yellow-700' },
  low: { label: 'اقتراح', className: 'bg-gray-100 text-gray-700' },
}

function RecommendationCard({
  recommendation,
  showPriority,
  onAction,
}: {
  recommendation: Recommendation
  showPriority: boolean
  onAction?: (recommendation: Recommendation) => void
}) {
  const { type, title, description, priority, actionUrl, actionLabel, isCompleted } = recommendation

  return (
    <div
      className={cn(
        'bg-white rounded-lg border p-4 transition-shadow hover:shadow-md',
        isCompleted && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn('p-2 rounded-lg flex-shrink-0', TYPE_COLORS[type])}>
          {TYPE_ICONS[type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900">{title}</h4>
            {showPriority && (
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  PRIORITY_BADGES[priority].className
                )}
              >
                {PRIORITY_BADGES[priority].label}
              </span>
            )}
            {isCompleted && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
        </div>

        {/* Action */}
        {(actionUrl || onAction) && !isCompleted && (
          <div className="flex-shrink-0">
            {actionUrl ? (
              <Link href={actionUrl}>
                <Button size="sm" variant="outline" className="gap-1">
                  {actionLabel || 'ابدأ'}
                  <ArrowLeft className="w-3 h-3" />
                </Button>
              </Link>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction?.(recommendation)}
                className="gap-1"
              >
                {actionLabel || 'ابدأ'}
                <ArrowLeft className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function RecommendationCompact({
  recommendation,
}: {
  recommendation: Recommendation
}) {
  const { type, title, actionUrl, isCompleted } = recommendation

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg',
        TYPE_COLORS[type],
        isCompleted && 'opacity-60'
      )}
    >
      <span className="flex-shrink-0">{TYPE_ICONS[type]}</span>
      <span className="flex-1 text-sm truncate">{title}</span>
      {actionUrl && !isCompleted && (
        <Link href={actionUrl}>
          <ArrowLeft className="w-4 h-4 hover:translate-x-[-2px] transition-transform" />
        </Link>
      )}
      {isCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
    </div>
  )
}

/**
 * Display personalized recommendations for improvement
 */
export function RecommendationsList({
  recommendations,
  maxItems,
  showPriority = true,
  variant = 'card',
  onAction,
  className,
}: RecommendationsListProps) {
  // Sort by priority
  const sorted = [...recommendations].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  const displayed = maxItems ? sorted.slice(0, maxItems) : sorted

  if (displayed.length === 0) {
    return (
      <div className={cn('text-center py-8 text-gray-500', className)}>
        <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p>أداء ممتاز! لا توجد توصيات في الوقت الحالي</p>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-2', className)}>
        {displayed.map((rec) => (
          <RecommendationCompact key={rec.id} recommendation={rec} />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {displayed.map((rec) => (
        <RecommendationCard
          key={rec.id}
          recommendation={rec}
          showPriority={showPriority}
          onAction={onAction}
        />
      ))}
    </div>
  )
}

interface RecommendationsSummaryProps {
  recommendations: Recommendation[]
  className?: string
}

/**
 * Summary view showing recommendation counts by type
 */
export function RecommendationsSummary({
  recommendations,
  className,
}: RecommendationsSummaryProps) {
  const counts = recommendations.reduce(
    (acc, rec) => {
      acc[rec.priority]++
      return acc
    },
    { high: 0, medium: 0, low: 0 }
  )

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {counts.high > 0 && (
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-sm text-gray-600">{counts.high} مهم جداً</span>
        </div>
      )}
      {counts.medium > 0 && (
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-sm text-gray-600">{counts.medium} مهم</span>
        </div>
      )}
      {counts.low > 0 && (
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-gray-400" />
          <span className="text-sm text-gray-600">{counts.low} اقتراح</span>
        </div>
      )}
    </div>
  )
}

export default RecommendationsList
