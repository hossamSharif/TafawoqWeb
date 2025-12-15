'use client'

import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Gift, Clock, Sparkles, BookOpen, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { RewardNotification } from '@/types/rewards'

interface RewardNotificationCardProps {
  notification: RewardNotification
  onMarkAsRead?: (id: string) => Promise<void>
  variant?: 'default' | 'compact' | 'banner'
  className?: string
}

const CREDIT_TYPE_CONFIG = {
  exam: {
    icon: BookOpen,
    label: 'رصيد اختبار',
    color: 'text-blue-600 bg-blue-100',
  },
  practice: {
    icon: Brain,
    label: 'رصيد تمرين',
    color: 'text-purple-600 bg-purple-100',
  },
}

export function RewardNotificationCard({
  notification,
  onMarkAsRead,
  variant = 'default',
  className,
}: RewardNotificationCardProps) {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: ar,
  })

  const creditConfig = CREDIT_TYPE_CONFIG[notification.metadata.creditType]
  const CreditIcon = creditConfig.icon

  const handleClick = async () => {
    if (!notification.isRead && onMarkAsRead) {
      await onMarkAsRead(notification.id)
    }
  }

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-4 p-4 rounded-lg',
          'bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200',
          className
        )}
        onClick={handleClick}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center">
            <Gift className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <p className="font-medium text-amber-900">{notification.title}</p>
            <p className="text-sm text-amber-700">{notification.message}</p>
          </div>
        </div>
        <Link href="/profile">
          <Button size="sm" variant="outline" className="border-amber-300 hover:bg-amber-200">
            عرض الرصيد
          </Button>
        </Link>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer',
          notification.isRead
            ? 'bg-background hover:bg-muted/50'
            : 'bg-amber-50 hover:bg-amber-100',
          className
        )}
        onClick={handleClick}
      >
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
            'text-amber-600 bg-amber-100'
          )}
        >
          <Gift className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{notification.title}</p>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
        <div className={cn('text-xs font-medium px-2 py-1 rounded', creditConfig.color)}>
          +{notification.metadata.amount}
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 rounded-lg transition-colors cursor-pointer',
        notification.isRead
          ? 'bg-background hover:bg-muted/50'
          : 'bg-amber-50/50 hover:bg-amber-50',
        className
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
          'bg-gradient-to-br from-amber-100 to-amber-200'
        )}
      >
        <Gift className="w-6 h-6 text-amber-700" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-semibold text-foreground">{notification.title}</p>
          {!notification.isRead && (
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-3">{notification.message}</p>

        {/* Credit Badge */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
              creditConfig.color
            )}
          >
            <CreditIcon className="w-4 h-4" />
            <span>+{notification.metadata.amount} {creditConfig.label}</span>
          </div>
        </div>

        {/* Source info if available */}
        {notification.metadata.sourceContentType && (
          <p className="text-xs text-muted-foreground mt-2">
            من {notification.metadata.sourceContentType === 'exam' ? 'اختبار' : 'تمرين'} مشارك
          </p>
        )}

        {/* Time */}
        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{timeAgo}</span>
        </div>
      </div>
    </div>
  )
}
