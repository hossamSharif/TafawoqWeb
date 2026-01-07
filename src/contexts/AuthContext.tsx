'use client'

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { Tables } from '@/lib/supabase/types'
import { useAuthSession, useUserProfile, useUserSubscription, useRefreshSession, useRefreshProfile, useRefreshSubscription } from '@/hooks/useAuthQuery'
import { queryKeys } from '@/lib/query/keys'

type UserProfile = Tables<'user_profiles'>
type UserSubscription = Tables<'user_subscriptions'>

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  subscription: UserSubscription | null
  isLoading: boolean
  isAuthenticated: boolean
  isPremium: boolean
  refreshProfile: () => Promise<void>
  refreshSubscription: () => Promise<void>
  refreshSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient()

  // Use React Query hooks for cached data
  const { data: session, isLoading: sessionLoading } = useAuthSession()
  const { data: profile, isLoading: profileLoading } = useUserProfile(session?.user?.id)
  const { data: subscription, isLoading: subscriptionLoading } = useUserSubscription(session?.user?.id)

  // Mutations for refresh operations
  const refreshSessionMutation = useRefreshSession()
  const refreshProfileMutation = useRefreshProfile()
  const refreshSubscriptionMutation = useRefreshSubscription()

  // Wrapper functions to maintain API compatibility
  const refreshProfile = async () => {
    if (!session?.user?.id) return
    await refreshProfileMutation.mutateAsync(session.user.id)
  }

  const refreshSubscription = async () => {
    if (!session?.user?.id) return
    await refreshSubscriptionMutation.mutateAsync(session.user.id)
  }

  const refreshSession = async (): Promise<boolean> => {
    try {
      await refreshSessionMutation.mutateAsync()
      return true
    } catch (error) {
      console.error('[AuthContext] Session refresh failed:', error)
      return false
    }
  }

  // Listen for auth state changes and update React Query cache
  useEffect(() => {
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, newSession: Session | null) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AuthContext] Auth state changed:', event, { hasSession: !!newSession })
        }

        // Update session in cache
        queryClient.setQueryData(queryKeys.auth.session(), newSession)

        if (event === 'SIGNED_IN' && newSession?.user) {
          // Invalidate profile and subscription to force refetch
          queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile(newSession.user.id) })
          queryClient.invalidateQueries({ queryKey: queryKeys.subscription.current(newSession.user.id) })
        } else if (event === 'SIGNED_OUT') {
          // Clear all cached data
          queryClient.clear()
        } else if (event === 'TOKEN_REFRESHED' && newSession?.user) {
          // Revalidate to ensure data is current
          queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile(newSession.user.id) })
          queryClient.invalidateQueries({ queryKey: queryKeys.subscription.current(newSession.user.id) })
        }
      }
    )

    return () => {
      authSubscription.unsubscribe()
    }
  }, [queryClient])

  // Computed values from React Query data
  const user = useMemo(() => session?.user ?? null, [session])
  const isLoading = sessionLoading || profileLoading || subscriptionLoading

  const isAuthenticated = useMemo(() => !!user && !!session, [user, session])

  const isPremium = useMemo(() => {
    if (!subscription) return false
    return (
      subscription.status === 'active' &&
      subscription.tier === 'premium' &&
      (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date())
    )
  }, [subscription])

  const value = useMemo(
    () => ({
      user,
      session: session ?? null,
      profile: profile ?? null,
      subscription: subscription ?? null,
      isLoading,
      isAuthenticated,
      isPremium,
      refreshProfile,
      refreshSubscription,
      refreshSession,
    }),
    [user, session, profile, subscription, isLoading, isAuthenticated, isPremium]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Hook to require authentication - redirects to login if not authenticated
 */
export function useRequireAuth() {
  const auth = useAuth()

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Redirect to login page
      window.location.href = '/login'
    }
  }, [auth.isLoading, auth.isAuthenticated])

  return auth
}

/**
 * Hook to require premium subscription - shows upgrade prompt if not premium
 */
export function useRequirePremium() {
  const auth = useAuth()

  return {
    ...auth,
    canAccess: auth.isPremium,
  }
}
