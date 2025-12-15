'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import {
  Bell,
  MessageSquare,
  Reply,
  Flag,
  Gift,
  FileText,
  Clock,
  Circle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Notification, NotificationType } from '@/lib/notifications/types'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (id: string) => Promise<void>
}

const NOTIFICATION_ICONS: Record<NotificationType, typeof Bell> = {
  exam_completed: FileText,
  new_comment: MessageSquare,
  comment_reply: Reply,
  report_resolved: Flag,
  reward_earned: Gift,
}

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  exam_completed: 'text-green-600 bg-green-100',
  new_comment: 'text-blue-600 bg-blue-100',
  comment_reply: 'text-purple-600 bg-purple-100',
  report_resolved: 'text-orange-600 bg-orange-100',
  reward_earned: 'text-amber-600 bg-amber-100',
}

function getNotificationLink(notification: Notification): string | null {
  if (!notification.target_type || !notification.target_id) {
    return null
  }

  switch (notification.target_type) {
    case 'post':
      return `/forum/post/${notification.target_id}`
    case 'comment':
      // Comments link to their parent post - we'll need to handle this differently
      // For now, link to notifications page
      return `/notifications`
    case 'report':
      return `/notifications` // Reports resolved don't have a specific page
    case 'reward':
      return `/profile` // Rewards can be viewed in profile
    default:
      return null
  }
}

export function NotificationItem({
  notification,
  onMarkAsRead,
}: NotificationItemProps) {
  const [isMarking, setIsMarking] = useState(false)

  const Icon = NOTIFICATION_ICONS[notification.type] || Bell
  const colorClass = NOTIFICATION_COLORS[notification.type] || 'text-gray-600 bg-gray-100'

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: ar,
  })

  const link = getNotificationLink(notification)

  const handleClick = async () => {
    if (!notification.is_read && onMarkAsRead && !isMarking) {
      setIsMarking(true)
      try {
        await onMarkAsRead(notification.id)
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      } finally {
        setIsMarking(false)
      }
    }
  }

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg transition-colors cursor-pointer',
        notification.is_read
          ? 'bg-background hover:bg-muted/50'
          : 'bg-primary/5 hover:bg-primary/10'
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          colorClass
        )}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p
              className={cn(
                'font-medium',
                notification.is_read ? 'text-foreground' : 'text-foreground'
              )}
            >
              {notification.title}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {notification.message}
            </p>
          </div>

          {/* Unread indicator */}
          {!notification.is_read && (
            <Circle className="w-2.5 h-2.5 fill-primary text-primary flex-shrink-0 mt-2" />
          )}
        </div>

        {/* Time */}
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{timeAgo}</span>
        </div>
      </div>
    </div>
  )

  if (link) {
    return (
      <Link href={link} className="block">
        {content}
      </Link>
    )
  }

  return content
}
