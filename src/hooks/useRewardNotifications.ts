'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, getCurrentUser } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { RewardNotification } from '@/types/rewards'

interface UseRewardNotificationsOptions {
  enabled?: boolean
  onNewReward?: (notification: RewardNotification) => void
  pollInterval?: number // milliseconds, 0 to disable polling
}

interface UseRewardNotificationsReturn {
  notifications: RewardNotification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refetch: () => Promise<void>
}

export function useRewardNotifications(
  options: UseRewardNotificationsOptions = {}
): UseRewardNotificationsReturn {
  const { enabled = true, onNewReward, pollInterval = 30000 } = options

  const [notifications, setNotifications] = useState<RewardNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const userIdRef = useRef<string | null>(null)

  // Fetch reward notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/rewards')
      if (!response.ok) {
        throw new Error('Failed to fetch reward notifications')
      }

      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
      setError(null)
    } catch (err) {
      console.error('Error fetching reward notifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Set up Supabase Realtime subscription
  useEffect(() => {
    if (!enabled) return

    const setupRealtimeSubscription = async () => {
      const user = await getCurrentUser()
      if (!user) return

      userIdRef.current = user.id

      // Subscribe to reward_earned notifications for this user
      const channel = supabase
        .channel(`reward-notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotification = payload.new as {
              id: string
              user_id: string
              type: string
              title: string
              message: string
              target_type: string | null
              target_id: string | null
              is_read: boolean
              created_at: string
              metadata?: Record<string, unknown>
            }

            // Only handle reward_earned notifications
            if (newNotification.type === 'reward_earned') {
              const rewardNotification: RewardNotification = {
                id: newNotification.id,
                userId: newNotification.user_id,
                type: 'reward_earned',
                title: newNotification.title,
                message: newNotification.message,
                metadata: {
                  creditType: (newNotification.metadata?.credit_type as 'exam' | 'practice') || 'exam',
                  amount: (newNotification.metadata?.amount as number) || 1,
                  sourceContentType: newNotification.metadata?.source_content_type as 'exam' | 'practice' | undefined,
                  completerId: newNotification.metadata?.completer_id as string | undefined,
                },
                isRead: newNotification.is_read,
                createdAt: newNotification.created_at,
              }

              // Add to notifications list
              setNotifications((prev) => [rewardNotification, ...prev])
              setUnreadCount((prev) => prev + 1)

              // Call callback if provided
              onNewReward?.(rewardNotification)
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Subscribed to reward notifications')
          }
        })

      channelRef.current = channel
    }

    setupRealtimeSubscription()

    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [enabled, onNewReward])

  // Initial fetch and polling
  useEffect(() => {
    if (!enabled) return

    fetchNotifications()

    // Set up polling if enabled
    if (pollInterval > 0) {
      const interval = setInterval(fetchNotifications, pollInterval)
      return () => clearInterval(interval)
    }
  }, [enabled, fetchNotifications, pollInterval])

  // Mark a notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }, [])

  // Mark all reward notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/rewards/read-all', {
        method: 'POST',
      })

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }, [])

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  }
}

// Hook for just tracking reward badge count (lightweight)
export function useRewardBadgeCount(): { count: number; isLoading: boolean } {
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/notifications/rewards?summary=true')
        if (response.ok) {
          const data = await response.json()
          setCount(data.unreadCount || 0)
        }
      } catch (error) {
        console.error('Failed to fetch reward count:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCount()

    // Poll every 30 seconds
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  return { count, isLoading }
}
