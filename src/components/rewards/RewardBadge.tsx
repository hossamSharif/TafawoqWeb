'use client'

import { Gift, Sparkles, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface RewardBadgeProps {
  count: number
  variant?: 'default' | 'compact' | 'detailed'
  showTooltip?: boolean
  animated?: boolean
  className?: string
}

export function RewardBadge({
  count,
  variant = 'default',
  showTooltip = true,
  animated = false,
  className,
}: RewardBadgeProps) {
  if (count === 0) return null

  const badge = (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        variant === 'compact' && 'px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700',
        variant === 'default' && 'px-2 py-1 text-sm bg-amber-100 text-amber-700',
        variant === 'detailed' && 'px-3 py-1.5 text-sm bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200',
        animated && 'animate-pulse',
        className
      )}
    >
      {variant === 'detailed' ? (
        <Sparkles className="w-4 h-4" />
      ) : (
        <Gift className={cn(
          variant === 'compact' ? 'w-3 h-3' : 'w-4 h-4'
        )} />
      )}
      <span>{count}</span>
      {variant === 'detailed' && (
        <span className="text-amber-600">مكافأة جديدة</span>
      )}
    </div>
  )

  if (!showTooltip) {
    return badge
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent dir="rtl">
          <p>لديك {count} مكافأة جديدة</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Notification dot for navigation
interface RewardNotificationDotProps {
  hasNew: boolean
  className?: string
}

export function RewardNotificationDot({ hasNew, className }: RewardNotificationDotProps) {
  if (!hasNew) return null

  return (
    <span
      className={cn(
        'absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500',
        'animate-pulse',
        className
      )}
    />
  )
}

// Reward earned celebration badge
interface RewardEarnedBadgeProps {
  creditType: 'exam' | 'practice'
  amount: number
  className?: string
}

export function RewardEarnedBadge({
  creditType,
  amount,
  className,
}: RewardEarnedBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
        'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg',
        className
      )}
      dir="rtl"
    >
      <Star className="w-5 h-5 fill-white" />
      <span className="font-medium">
        +{amount} رصيد {creditType === 'exam' ? 'اختبار' : 'تمرين'}
      </span>
    </div>
  )
}

// Milestone badge for sharing achievements
interface MilestoneBadgeProps {
  milestone: number
  label: string
  achieved?: boolean
  className?: string
}

export function MilestoneBadge({
  milestone,
  label,
  achieved = false,
  className,
}: MilestoneBadgeProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 p-3 rounded-lg border',
        achieved
          ? 'bg-amber-50 border-amber-200'
          : 'bg-gray-50 border-gray-200 opacity-60',
        className
      )}
      dir="rtl"
    >
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          achieved ? 'bg-amber-500 text-white' : 'bg-gray-300 text-gray-500'
        )}
      >
        {achieved ? (
          <Star className="w-5 h-5 fill-white" />
        ) : (
          <span className="text-lg font-bold">{milestone}</span>
        )}
      </div>
      <span
        className={cn(
          'text-xs font-medium',
          achieved ? 'text-amber-800' : 'text-gray-500'
        )}
      >
        {label}
      </span>
    </div>
  )
}
