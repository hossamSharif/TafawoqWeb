'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { Tables } from '@/lib/supabase/types'

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
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
  }, [])

  const fetchSubscription = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      // No subscription is not necessarily an error - user might be on free tier
      if (error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error)
      }
      return null
    }
    return data
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return
    const profileData = await fetchProfile(user.id)
    setProfile(profileData)
  }, [user?.id, fetchProfile])

  const refreshSubscription = useCallback(async () => {
    if (!user?.id) return
    const subscriptionData = await fetchSubscription(user.id)
    setSubscription(subscriptionData)
  }, [user?.id, fetchSubscription])

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()

        setSession(initialSession)
        setUser(initialSession?.user ?? null)

        if (initialSession?.user) {
          const [profileData, subscriptionData] = await Promise.all([
            fetchProfile(initialSession.user.id),
            fetchSubscription(initialSession.user.id),
          ])
          setProfile(profileData)
          setSubscription(subscriptionData)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (event === 'SIGNED_IN' && newSession?.user) {
          const [profileData, subscriptionData] = await Promise.all([
            fetchProfile(newSession.user.id),
            fetchSubscription(newSession.user.id),
          ])
          setProfile(profileData)
          setSubscription(subscriptionData)
        } else if (event === 'SIGNED_OUT') {
          setProfile(null)
          setSubscription(null)
        }

        setIsLoading(false)
      }
    )

    return () => {
      authSubscription.unsubscribe()
    }
  }, [fetchProfile, fetchSubscription])

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
      session,
      profile,
      subscription,
      isLoading,
      isAuthenticated,
      isPremium,
      refreshProfile,
      refreshSubscription,
    }),
    [user, session, profile, subscription, isLoading, isAuthenticated, isPremium, refreshProfile, refreshSubscription]
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
      window.location.href = '/auth/login'
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
