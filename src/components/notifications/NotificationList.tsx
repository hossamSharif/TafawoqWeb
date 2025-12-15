'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Loader2, Bell, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationItem } from './NotificationItem'
import { NotificationListSkeleton } from './NotificationSkeleton'
import type { Notification } from '@/lib/notifications/types'

interface NotificationListProps {
  initialNotifications?: Notification[]
  initialCursor?: string | null
  initialHasMore?: boolean
  initialUnreadCount?: number
}

export function NotificationList({
  initialNotifications = [],
  initialCursor = null,
  initialHasMore = true,
  initialUnreadCount = 0,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(initialNotifications.length === 0)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)

  const loadMoreRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async (cursorId?: string | null) => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (cursorId) {
        params.append('cursor', cursorId)
      }
      params.append('limit', '20')

      const response = await fetch(`/api/notifications?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch notifications')

      const data = await response.json()

      if (cursorId) {
        setNotifications((prev) => [...prev, ...data.notifications])
      } else {
        setNotifications(data.notifications)
      }

      setCursor(data.next_cursor)
      setHasMore(data.has_more)
      setUnreadCount(data.unread_count)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
      setIsInitialLoading(false)
    }
  }, [isLoading])

  // Initial load
  useEffect(() => {
    if (initialNotifications.length === 0) {
      fetchNotifications()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchNotifications(cursor)
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [cursor, hasMore, isLoading, fetchNotifications])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (isMarkingAllRead || unreadCount === 0) return

    setIsMarkingAllRead(true)
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    } finally {
      setIsMarkingAllRead(false)
    }
  }

  if (isInitialLoading) {
    return <NotificationListSkeleton count={5} />
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Bell className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-foreground">لا توجد إشعارات</p>
        <p className="text-sm text-muted-foreground mt-1">
          ستظهر إشعاراتك هنا عندما يتفاعل الآخرون مع محتواك
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Header with Mark All Read */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between mb-4 pb-4 border-b">
          <p className="text-sm text-muted-foreground">
            {unreadCount} إشعار غير مقروء
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAllRead}
            className="gap-2"
          >
            {isMarkingAllRead ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4" />
            )}
            تحديد الكل كمقروء
          </Button>
        </div>
      )}

      {/* Notification Items */}
      <div className="space-y-2">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={handleMarkAsRead}
          />
        ))}
      </div>

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="py-4">
        {isLoading && (
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!hasMore && notifications.length > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            لا توجد إشعارات أخرى
          </p>
        )}
      </div>
    </div>
  )
}
