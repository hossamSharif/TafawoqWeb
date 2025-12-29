import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/keys'
import { useAuth } from '@/contexts/AuthContext'
import type { UserLimits } from '@/types/subscription'

/**
 * Hook to fetch and cache subscription limits
 * Limits are cached for 1 minute and refetched on mount for accuracy after pause/resume operations
 */
export function useSubscriptionLimits() {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.subscription.limits(user?.id ?? 'anonymous'),
    queryFn: async (): Promise<UserLimits | null> => {
      const response = await fetch('/api/subscription/limits')
      if (!response.ok) {
        console.error('Failed to fetch subscription limits')
        return null
      }
      return response.json()
    },
    enabled: !!user,
    staleTime: 1000 * 5, // 5 seconds - short enough to catch updates quickly
    gcTime: 1000 * 60 * 15, // 15 minutes cache
    refetchOnMount: true, // Refetch on mount for accurate limits
    refetchOnWindowFocus: true, // Refetch on window focus
    refetchOnReconnect: true, // Refetch when network reconnects
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
      console.log('[useInvalidateLimits] Invalidating and refetching limits for user:', user.id)

      // Invalidate to mark as stale
      await queryClient.invalidateQueries({
        queryKey: queryKeys.subscription.limits(user.id),
      })

      // Force immediate refetch, bypassing stale time
      await queryClient.refetchQueries({
        queryKey: queryKeys.subscription.limits(user.id),
        type: 'active'
      })

      console.log('[useInvalidateLimits] Limits refresh complete')
    }
  }
}
