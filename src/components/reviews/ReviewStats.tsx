'use client'

import { Star } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { ReviewStats } from '@/lib/reviews/types'

interface ReviewStatsProps {
  stats: ReviewStats
  className?: string
}

export function ReviewStats({ stats, className }: ReviewStatsProps) {
  const { total_reviews, average_rating, rating_distribution } = stats

  if (total_reviews === 0) {
    return (
      <div className={cn('text-center p-8', className)}>
        <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">لا توجد مراجعات بعد</h3>
        <p className="text-muted-foreground">كن أول من يراجع التطبيق!</p>
      </div>
    )
  }

  const getRatingPercentage = (rating: number) => {
    const count = rating_distribution[String(rating) as keyof typeof rating_distribution] || 0
    return total_reviews > 0 ? (count / total_reviews) * 100 : 0
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overall Rating */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-5xl font-bold">{average_rating.toFixed(1)}</span>
          <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
        </div>
        <p className="text-muted-foreground">
          بناءً على {total_reviews} {total_reviews === 1 ? 'مراجعة' : 'مراجعات'}
        </p>
      </div>

      {/* Rating Distribution */}
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const percentage = getRatingPercentage(rating)
          const count = rating_distribution[String(rating) as keyof typeof rating_distribution] || 0

          return (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-16">
                <span className="text-sm font-medium">{rating}</span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              </div>
              <Progress value={percentage} className="flex-1" />
              <span className="text-sm text-muted-foreground w-12 text-left">
                {count}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
