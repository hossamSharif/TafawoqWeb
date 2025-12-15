'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Gift, X, ChevronLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RewardSummary {
  unreadCount: number
  totalCreditsEarned: number
  latestRewardTitle: string | null
}

interface NotificationBannerProps {
  className?: string
  onDismiss?: () => void
  autoHideAfter?: number // milliseconds, 0 to disable
}

export function NotificationBanner({
  className,
  onDismiss,
  autoHideAfter = 0,
}: NotificationBannerProps) {
  const [summary, setSummary] = useState<RewardSummary | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  const fetchRewardSummary = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/rewards?summary=true')
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
        if (data.unreadCount > 0) {
          setIsVisible(true)
        }
      }
    } catch (error) {
      console.error('Failed to fetch reward summary:', error)
    }
  }, [])

  useEffect(() => {
    fetchRewardSummary()

    // Poll for new rewards every 30 seconds
    const interval = setInterval(fetchRewardSummary, 30000)
    return () => clearInterval(interval)
  }, [fetchRewardSummary])

  useEffect(() => {
    if (autoHideAfter > 0 && isVisible) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, autoHideAfter)
      return () => clearTimeout(timer)
    }
  }, [autoHideAfter, isVisible])

  const handleDismiss = () => {
    setIsDismissed(true)
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible || isDismissed || !summary || summary.unreadCount === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg',
        'bg-gradient-to-r from-amber-500 via-amber-400 to-orange-400',
        'shadow-lg shadow-amber-500/20',
        className
      )}
    >
      {/* Decorative sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Sparkles className="absolute top-2 left-4 w-4 h-4 text-white/30 animate-pulse" />
        <Sparkles className="absolute bottom-3 left-1/4 w-3 h-3 text-white/20 animate-pulse delay-100" />
        <Sparkles className="absolute top-1/2 right-1/3 w-3 h-3 text-white/25 animate-pulse delay-200" />
      </div>

      <div className="relative flex items-center justify-between gap-4 p-4">
        {/* Content */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white">
              {summary.unreadCount === 1
                ? 'لديك مكافأة جديدة!'
                : `لديك ${summary.unreadCount} مكافآت جديدة!`}
            </p>
            {summary.latestRewardTitle && (
              <p className="text-sm text-white/90">{summary.latestRewardTitle}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link href="/notifications?filter=rewards">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/90 hover:bg-white text-amber-700 gap-1"
            >
              عرض المكافآت
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDismiss}
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
            <span className="sr-only">إغلاق</span>
          </Button>
        </div>
      </div>

      {/* Progress bar showing total credits earned */}
      {summary.totalCreditsEarned > 0 && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-xs text-white/80 mb-1">
            <span>إجمالي الرصيد المكتسب</span>
            <span className="font-bold text-white">+{summary.totalCreditsEarned}</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${Math.min((summary.totalCreditsEarned / 50) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Minimal floating variant for dashboard
export function FloatingRewardBanner({ className }: { className?: string }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/notifications/rewards?summary=true')
        if (response.ok) {
          const data = await response.json()
          setUnreadCount(data.unreadCount)
          if (data.unreadCount > 0) {
            setIsVisible(true)
          }
        }
      } catch (error) {
        console.error('Failed to fetch reward count:', error)
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!isVisible || unreadCount === 0) {
    return null
  }

  return (
    <Link href="/notifications?filter=rewards">
      <div
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-full',
          'bg-gradient-to-r from-amber-500 to-orange-500',
          'text-white font-medium text-sm',
          'shadow-lg shadow-amber-500/30',
          'hover:shadow-xl hover:scale-105 transition-all duration-200',
          'cursor-pointer',
          className
        )}
      >
        <Gift className="w-4 h-4" />
        <span>
          {unreadCount === 1 ? 'مكافأة جديدة' : `${unreadCount} مكافآت جديدة`}
        </span>
        <ChevronLeft className="w-4 h-4" />
      </div>
    </Link>
  )
}
