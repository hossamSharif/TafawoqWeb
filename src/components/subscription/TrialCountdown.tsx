'use client'

import { useEffect, useState } from 'react'
import { Clock, AlertTriangle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TrialCountdownProps {
  trialEndAt: string | null
  onUpgradeClick?: () => void
  className?: string
  variant?: 'banner' | 'compact' | 'inline'
}

function calculateTimeRemaining(endDate: string) {
  const end = new Date(endDate)
  const now = new Date()
  const diff = end.getTime() - now.getTime()

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return { days, hours, minutes, expired: false }
}

export function TrialCountdown({
  trialEndAt,
  onUpgradeClick,
  className,
  variant = 'banner',
}: TrialCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState(() =>
    trialEndAt ? calculateTimeRemaining(trialEndAt) : null
  )
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!trialEndAt) return

    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(trialEndAt))
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [trialEndAt])

  if (!trialEndAt || !timeRemaining) return null

  const handleUpgrade = async () => {
    if (onUpgradeClick) {
      onUpgradeClick()
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Upgrade error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const isUrgent = timeRemaining.days <= 1
  const { days, hours, expired } = timeRemaining

  if (expired) {
    return (
      <div
        className={cn(
          'rounded-lg border border-red-200 bg-red-50 p-4',
          className
        )}
        dir="rtl"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900">انتهت الفترة التجريبية</p>
              <p className="text-sm text-red-700">
                ترقّ الآن للاستمرار في استخدام الميزات المميزة
              </p>
            </div>
          </div>
          <Button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            ترقية الآن
          </Button>
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <span className={cn('text-sm', isUrgent ? 'text-orange-600' : 'text-blue-600', className)}>
        {days > 0 ? `${days} ${days === 1 ? 'يوم' : 'أيام'}` : `${hours} ساعة`} متبقية
      </span>
    )
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm',
          isUrgent
            ? 'bg-orange-100 text-orange-800 border border-orange-200'
            : 'bg-blue-100 text-blue-800 border border-blue-200',
          className
        )}
        dir="rtl"
      >
        <Clock className="h-3.5 w-3.5" />
        <span>
          {days > 0
            ? `${days} ${days === 1 ? 'يوم' : 'أيام'} متبقية`
            : `${hours} ساعة متبقية`}
        </span>
      </div>
    )
  }

  // Banner variant (default)
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        isUrgent
          ? 'border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50'
          : 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50',
        className
      )}
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'h-12 w-12 rounded-full flex items-center justify-center',
              isUrgent ? 'bg-orange-100' : 'bg-blue-100'
            )}
          >
            <Clock className={cn('h-6 w-6', isUrgent ? 'text-orange-600' : 'text-blue-600')} />
          </div>
          <div>
            <p className={cn('font-semibold', isUrgent ? 'text-orange-900' : 'text-blue-900')}>
              الفترة التجريبية
            </p>
            <p className={cn('text-sm', isUrgent ? 'text-orange-700' : 'text-blue-700')}>
              متبقي{' '}
              <span className="font-bold">
                {days > 0
                  ? `${days} ${days === 1 ? 'يوم' : 'أيام'}`
                  : `${hours} ساعة`}
              </span>
              {' '}على انتهاء الفترة التجريبية
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-2 w-8 rounded-full',
                  i < (3 - Math.min(days, 3))
                    ? isUrgent
                      ? 'bg-orange-400'
                      : 'bg-blue-400'
                    : 'bg-gray-200'
                )}
              />
            ))}
          </div>
          <Button
            onClick={handleUpgrade}
            disabled={isLoading}
            size="sm"
            className={cn(
              isUrgent
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'bg-blue-500 hover:bg-blue-600',
              'text-white'
            )}
          >
            <Sparkles className="ml-1.5 h-3.5 w-3.5" />
            ترقية الآن
          </Button>
        </div>
      </div>
    </div>
  )
}
