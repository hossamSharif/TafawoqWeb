'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Bell, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface NotificationBadgeProps {
  className?: string
  showRewardIndicator?: boolean
}

export function NotificationBadge({ className, showRewardIndicator = true }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [rewardCount, setRewardCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUnreadCount = useCallback(async () => {
    try {
      // Fetch both total notifications and reward notifications in parallel
      const [notifResponse, rewardResponse] = await Promise.all([
        fetch('/api/notifications/count'),
        showRewardIndicator ? fetch('/api/notifications/rewards?summary=true') : Promise.resolve(null),
      ])

      if (notifResponse.ok) {
        const data = await notifResponse.json()
        setUnreadCount(data.unread_count)
      }

      if (rewardResponse?.ok) {
        const rewardData = await rewardResponse.json()
        setRewardCount(rewardData.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch notification count:', error)
    } finally {
      setIsLoading(false)
    }
  }, [showRewardIndicator])

  useEffect(() => {
    fetchUnreadCount()

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  const hasRewards = showRewardIndicator && rewardCount > 0

  const badgeContent = (
    <Link href={hasRewards ? '/notifications?filter=rewards' : '/notifications'}>
      <Button
        variant="ghost"
        size="icon"
        className={cn('relative h-9 w-9', className)}
        aria-label={`الإشعارات${unreadCount > 0 ? ` (${unreadCount} غير مقروءة)` : ''}${hasRewards ? ` - لديك ${rewardCount} مكافآت` : ''}`}
      >
        <Bell className={cn('h-5 w-5', hasRewards && 'text-amber-600')} />
        {!isLoading && unreadCount > 0 && (
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
              hasRewards
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                : 'bg-destructive text-destructive-foreground'
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {/* Reward sparkle indicator */}
        {hasRewards && (
          <span className="absolute -bottom-0.5 -left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-white animate-pulse">
            <Gift className="h-2.5 w-2.5" />
          </span>
        )}
      </Button>
    </Link>
  )

  if (hasRewards) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
          <TooltipContent side="bottom" className="bg-amber-50 text-amber-900 border-amber-200">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-amber-600" />
              <span>لديك {rewardCount} مكافآت جديدة!</span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return badgeContent
}
