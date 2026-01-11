import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/query/keys'
import type { Tables } from '@/lib/supabase/types'

type UserProfile = Tables<'user_profiles'>
type UserSubscription = Tables<'user_subscriptions'>

/**
 * Hook to fetch and cache auth session
 * Aggressively cached (30 min stale time) since sessions are long-lived
 */
export function useAuthSession() {
  return useQuery({
    queryKey: queryKeys.auth.session(),
    queryFn: async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[useAuthSession] Fetching session...')
      }

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Session fetch timeout')), 10000)
      )

      const sessionPromise = supabase.auth.getSession()

      try {
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise])

        if (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[useAuthSession] Error fetching session:', error)
          }
          throw error
        }

        return session
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[useAuthSession] Failed to fetch session:', error)
        }
        // Return null instead of throwing to prevent infinite loading
        return null
      }
    },
    staleTime: 1000 * 60 * 30, // 30 minutes - sessions are long-lived
    gcTime: 1000 * 60 * 60, // 1 hour cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false, // Don't retry on error
  })
}

/**
 * Hook to fetch and cache user profile
 * Only fetches if userId is provided (session exists)
 */
export function useUserProfile(userId?: string) {
  return useQuery({
    queryKey: queryKeys.auth.profile(userId!),
    queryFn: async (): Promise<UserProfile | null> => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[useUserProfile] Fetching profile for user:', userId)
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId!)
          .single()

        if (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[useUserProfile] Error fetching profile:', error)
          }
          return null
        }

        return data
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[useUserProfile] Exception fetching profile:', error)
        }
        return null
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes cache
    refetchOnMount: false,
    retry: false, // Don't retry on error
  })
}

/**
 * Hook to fetch and cache user subscription
 * Only fetches if userId is provided (session exists)
 * OPTIMIZED: Longer cache time to prevent excessive refetching on navigation
 * Use invalidateQueries after payment/subscription changes to update immediately
 */
export function useUserSubscription(userId?: string) {
  return useQuery({
    queryKey: queryKeys.subscription.current(userId!),
    queryFn: async (): Promise<UserSubscription | null> => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[useUserSubscription] Fetching subscription for user:', userId)
      }

      try {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId!)
          .single()

        if (error) {
          // No subscription is not necessarily an error - user might be on free tier
          if (error.code !== 'PGRST116' && process.env.NODE_ENV === 'development') {
            console.error('[useUserSubscription] Error fetching subscription:', error)
          }
          return null
        }

        return data
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[useUserSubscription] Exception fetching subscription:', error)
        }
        return null
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes - balanced for performance and freshness
    gcTime: 1000 * 60 * 30, // 30 minutes cache
    refetchOnMount: false, // Don't refetch on every mount - use cache
    refetchOnWindowFocus: false, // Don't refetch on window focus - use cache
    refetchOnReconnect: true, // Only refetch on network reconnect
    retry: false, // Don't retry on error
  })
}

/**
 * Mutation to refresh the auth session
 * Invalidates session, profile, and subscription queries on success
 */
export function useRefreshSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<Session | null> => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[useRefreshSession] Attempting to refresh session...')
      }

      // Try to refresh the current session
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession()

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[useRefreshSession] Session refresh error:', error)
        }

        // If refresh fails, try to get session from storage
        const { data: { session: storedSession } } = await supabase.auth.getSession()

        if (storedSession) {
          return storedSession
        }

        throw new Error('Failed to refresh session')
      }

      return refreshedSession
    },
    onSuccess: (session) => {
      // Invalidate all auth-related queries to force refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all })
      if (session?.user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.subscription.current(session.user.id) })
      }
    },
  })
}

/**
 * Mutation to refresh user profile
 */
export function useRefreshProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string): Promise<UserProfile | null> => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }
      return data
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile(userId) })
    },
  })
}

/**
 * Mutation to refresh user subscription
 * CRITICAL: Uses refetchQueries to force immediate refetch, bypassing stale time
 */
export function useRefreshSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string): Promise<UserSubscription | null> => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[useRefreshSubscription] Forcing subscription refetch for user:', userId)
      }
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        if (process.env.NODE_ENV === 'development') {
          console.error('[useRefreshSubscription] Error fetching subscription:', error)
        }
        return null
      }
      return data || null
    },
    onSuccess: async (freshData, userId) => {
      // CRITICAL: Use refetchQueries to force immediate refetch, ignoring stale time

      // Invalidate first to mark as stale
      await queryClient.invalidateQueries({ queryKey: queryKeys.subscription.current(userId) })

      // Force refetch immediately, bypassing stale time
      await queryClient.refetchQueries({
        queryKey: queryKeys.subscription.current(userId),
        type: 'active'
      })

      // Also invalidate any subscription-related queries (limits, usage, etc.)
      await queryClient.invalidateQueries({ queryKey: queryKeys.subscription.all })
    },
  })
}
