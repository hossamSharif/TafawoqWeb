'use client'

import { cn } from '@/lib/utils'
import { Crown, Clock, Star } from 'lucide-react'

export type SubscriptionTier = 'free' | 'premium' | 'trial'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'

interface SubscriptionBadgeProps {
  tier: string
  status?: string
  isTrialing?: boolean
  daysRemaining?: number | null
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const tierConfig = {
  free: {
    label: 'مجاني',
    labelEn: 'Free',
    icon: Star,
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
  },
  premium: {
    label: 'مميز',
    labelEn: 'Premium',
    icon: Crown,
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
  },
  trial: {
    label: 'تجريبي',
    labelEn: 'Trial',
    icon: Clock,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
  },
}

const sizeConfig = {
  sm: {
    container: 'px-2 py-0.5 text-xs gap-1',
    icon: 'h-3 w-3',
  },
  md: {
    container: 'px-3 py-1 text-sm gap-1.5',
    icon: 'h-4 w-4',
  },
  lg: {
    container: 'px-4 py-1.5 text-base gap-2',
    icon: 'h-5 w-5',
  },
}

export function SubscriptionBadge({
  tier,
  status,
  isTrialing = false,
  daysRemaining,
  showDetails = false,
  size = 'md',
  className,
}: SubscriptionBadgeProps) {
  // Determine effective tier for display
  const effectiveTier = isTrialing ? 'trial' : (tier as keyof typeof tierConfig)
  const config = tierConfig[effectiveTier] || tierConfig.free
  const sizeStyles = sizeConfig[size]
  const Icon = config.icon

  // Determine status indicator
  const isPastDue = status === 'past_due'
  const isCanceled = status === 'canceled'

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeStyles.container,
        className
      )}
    >
      <Icon className={cn(sizeStyles.icon, 'flex-shrink-0')} />
      <span>{config.label}</span>

      {showDetails && (
        <>
          {isTrialing && daysRemaining !== null && daysRemaining !== undefined && (
            <span className="mr-1 opacity-80">
              ({daysRemaining} {daysRemaining === 1 ? 'يوم' : 'أيام'})
            </span>
          )}

          {isPastDue && (
            <span className="mr-1 text-red-600 text-xs">
              (متأخر)
            </span>
          )}

          {isCanceled && (
            <span className="mr-1 text-slate-500 text-xs">
              (ملغي)
            </span>
          )}
        </>
      )}
    </div>
  )
}

// Export a simpler component for inline usage
export function SubscriptionBadgeInline({
  tier,
  isTrialing,
}: {
  tier: string
  isTrialing?: boolean
}) {
  const effectiveTier = isTrialing ? 'trial' : tier
  const config = tierConfig[effectiveTier as keyof typeof tierConfig] || tierConfig.free

  return (
    <span className={cn('font-medium', config.textColor)}>
      {config.label}
    </span>
  )
}
