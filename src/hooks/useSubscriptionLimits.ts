import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/keys'
import { useAuth } from '@/contexts/AuthContext'
import type { UserLimits } from '@/types/subscription'

/**
 * Hook to fetch and cache subscription limits
 * OPTIMIZED: Longer cache time to prevent excessive refetching on navigation
 * Use useInvalidateLimits() after operations that change limits
 */
export function useSubscriptionLimits() {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.subscription.limits(user?.id ?? 'anonymous'),
    queryFn: async (): Promise<UserLimits | null> => {
      const response = await fetch('/api/subscription/limits')
      if (!response.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch subscription limits')
        }
        return null
      }
      return response.json()
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 3, // 3 minutes - balanced for performance and freshness
    gcTime: 1000 * 60 * 15, // 15 minutes cache
    refetchOnMount: false, // Don't refetch on every mount - use cache
    refetchOnWindowFocus: false, // Don't refetch on window focus - use cache
    refetchOnReconnect: true, // Only refetch on network reconnect
  })
}

/**
 * Hook to invalidate and refetch subscription limits cache
 * Call this after pause/resume/start/payment operations to update counters immediately
 */
export function useInvalidateLimits() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return async () => {
    if (user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[useInvalidateLimits] Invalidating and refetching limits for user:', user.id)
      }

      // Invalidate to mark as stale
      await queryClient.invalidateQueries({
        queryKey: queryKeys.subscription.limits(user.id),
      })

      // Force immediate refetch, bypassing stale time
      await queryClient.refetchQueries({
        queryKey: queryKeys.subscription.limits(user.id),
        type: 'active'
      })
    }
  }
}
