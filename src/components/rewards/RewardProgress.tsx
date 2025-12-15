'use client'

import {
  Trophy,
  Target,
  Sparkles,
  Gift,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getRewardProgressInfo,
  MILESTONE_REWARDS,
} from '@/lib/rewards/types'

interface RewardProgressProps {
  totalCompletions: number
  nextMilestone: number
  progressToNext: number
  isLoading?: boolean
  variant?: 'default' | 'compact' | 'card'
  className?: string
}

export function RewardProgress({
  totalCompletions,
  nextMilestone,
  progressToNext,
  isLoading,
  variant = 'default',
  className,
}: RewardProgressProps) {
  const progressInfo = getRewardProgressInfo(totalCompletions)
  const progressPercentage = progressInfo.progressPercentage

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">
              {progressToNext}/5 نحو {nextMilestone}
            </span>
            <span className="font-medium text-primary">
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        <Gift className="w-5 h-5 text-purple-500" />
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={cn('bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl p-5', className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">التقدم نحو المكافأة</h3>
            <p className="text-sm text-gray-600">
              المحطة التالية: {nextMilestone} إكمال
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-700 font-medium">
              {totalCompletions} إكمال حتى الآن
            </span>
            <span className="font-bold text-primary">
              {progressInfo.remainingCompletions} متبقي
            </span>
          </div>
          <div className="h-3 bg-white/80 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 transition-all duration-700 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Reward Preview */}
        <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-700">المكافأة عند الوصول:</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-blue-600">
              +{MILESTONE_REWARDS.exam_credits} اختبار
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-bold text-green-600">
              +{MILESTONE_REWARDS.practice_credits} تدريب
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn('bg-white rounded-xl shadow-sm', className)}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-gray-900">تقدم المكافآت</h2>
        </div>
      </div>

      {/* Progress Content */}
      <div className="p-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalCompletions}</div>
            <div className="text-xs text-gray-500">إكمال إجمالي</div>
          </div>
          <div className="text-center border-x">
            <div className="text-2xl font-bold text-primary">{nextMilestone}</div>
            <div className="text-xs text-gray-500">الهدف التالي</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{progressInfo.remainingCompletions}</div>
            <div className="text-xs text-gray-500">متبقي</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">التقدم الحالي</span>
            <span className="font-medium text-primary">{progressPercentage.toFixed(0)}%</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 transition-all duration-700 rounded-full relative"
              style={{ width: `${progressPercentage}%` }}
            >
              {progressPercentage > 10 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Milestone Markers */}
        <div className="flex justify-between text-xs text-gray-400 mb-6">
          <span>0</span>
          <span>{nextMilestone}</span>
        </div>

        {/* Reward Preview */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-5 h-5 text-amber-500" />
            <span className="font-medium text-gray-900">المكافأة القادمة</span>
          </div>
          <p className="text-sm text-gray-600">
            عند الوصول إلى {nextMilestone} إكمال ستحصل على:
          </p>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-blue-600">+{MILESTONE_REWARDS.exam_credits}</span>
              <span className="text-sm text-gray-600">رصيد اختبار</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-green-600">+{MILESTONE_REWARDS.practice_credits}</span>
              <span className="text-sm text-gray-600">رصيد تدريب</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Mini version for headers/navigation
interface RewardProgressMiniProps {
  totalCompletions: number
  className?: string
}

export function RewardProgressMini({ totalCompletions, className }: RewardProgressMiniProps) {
  const progressInfo = getRewardProgressInfo(totalCompletions)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-purple-500"
          style={{ width: `${progressInfo.progressPercentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-500">
        {progressInfo.remainingCompletions} للمكافأة
      </span>
    </div>
  )
}
