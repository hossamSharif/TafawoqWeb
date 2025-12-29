import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/keys'
import type {
  Notification,
  NotificationListResponse,
  NotificationCountResponse,
} from '@/lib/notifications/types'

interface UseNotificationsOptions {
  unreadOnly?: boolean
  limit?: number
}

export function useNotifications(
  userId: string,
  options: UseNotificationsOptions = {}
) {
  const { unreadOnly = false, limit = 20 } = options

  return useInfiniteQuery({
    queryKey: queryKeys.notifications.list(userId, { unreadOnly }),
    queryFn: async ({
      pageParam,
    }: { pageParam: string | undefined }): Promise<NotificationListResponse> => {
      const params = new URLSearchParams()
      if (pageParam) params.set('cursor', pageParam)
      params.set('limit', limit.toString())
      if (unreadOnly) params.set('unread_only', 'true')

      const response = await fetch(`/api/notifications?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      return response.json()
    },
    enabled: !!userId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    staleTime: 1000 * 60 * 1, // 1 minute (notifications should be fresh)
    gcTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnMount: true, // Always refetch on mount for fresh notifications
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  })
}

export function useUnreadCount(userId: string) {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(userId),
    queryFn: async (): Promise<number> => {
      const response = await fetch(`/api/notifications/count`)
      if (!response.ok) {
        throw new Error('Failed to fetch unread count')
      }

      const data: NotificationCountResponse = await response.json()
      return data.unread_count
    },
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds (update frequently)
    gcTime: 1000 * 60 * 2,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60, // Poll every minute
  })
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: 'POST',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate notifications list and unread count
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
  })
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/notifications/read-all`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate notifications list and unread count
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
  })
}

export function useMarkAllRewardsAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/notifications/rewards/read-all`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to mark all reward notifications as read')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate notifications list and unread count
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
  })
}
