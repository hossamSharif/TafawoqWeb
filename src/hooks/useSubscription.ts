'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/keys'
import { useAuth } from '@/contexts/AuthContext'

export interface SubscriptionData {
  tier: string
  status: string
  isPremium: boolean
  isTrialing: boolean
  daysRemaining: number | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  trialEndAt: string | null
  canceledAt: string | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}

export interface SubscriptionFeatures {
  name: string
  examsPerWeek: number | string
  practiceUnlimited: boolean
  featureList: string[]
}

export interface UsageData {
  exams: {
    used: number
    limit: number | null
    remaining: number | null
    isEligible: boolean
    nextEligibleAt: string | null
    reason: string | null
  }
  practice: {
    maxCategories: number | null
    maxQuestions: number
    totalHours: number
    totalCompleted: number
  }
  totals: {
    examsCompleted: number
    practicesCompleted: number
    practiceHours: number
  }
}

export interface Invoice {
  id: string
  number: string | null
  status: string | null
  amount: number
  currency: string
  description: string
  createdAt: string
  paidAt: string | null
  invoicePdfUrl: string | null
  hostedInvoiceUrl: string | null
  periodStart: string | null
  periodEnd: string | null
}

interface UseSubscriptionReturn {
  subscription: SubscriptionData | null
  features: SubscriptionFeatures | null
  usage: UsageData | null
  invoices: Invoice[]
  isLoading: boolean
  error: string | null
  isPremium: boolean
  isTrialing: boolean
  refetch: () => Promise<void>
  fetchUsage: () => Promise<void>
  fetchInvoices: () => Promise<void>
  createCheckoutSession: () => Promise<string | null>
  createPortalSession: () => Promise<string | null>
  cancelSubscription: () => Promise<boolean>
  reactivateSubscription: () => Promise<boolean>
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Parallel queries for subscription, usage, and invoices - fetched simultaneously instead of sequentially
  const subscriptionQuery = useQuery({
    queryKey: queryKeys.subscription.current(user?.id ?? 'anonymous'),
    queryFn: async () => {
      const response = await fetch('/api/subscription')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في جلب بيانات الاشتراك')
      }

      return { subscription: data.subscription as SubscriptionData, features: data.features as SubscriptionFeatures }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes cache
    refetchOnMount: false,
  })

  const usageQuery = useQuery({
    queryKey: queryKeys.subscription.usage(user?.id ?? 'anonymous'),
    queryFn: async () => {
      const response = await fetch('/api/subscription/usage')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في جلب بيانات الاستخدام')
      }

      return data.usage as UsageData
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes - usage changes more frequently
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    refetchOnMount: false,
  })

  const invoicesQuery = useQuery({
    queryKey: queryKeys.subscription.invoices(user?.id ?? 'anonymous'),
    queryFn: async () => {
      const response = await fetch('/api/subscription/invoices')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في جلب الفواتير')
      }

      return data.invoices as Invoice[]
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // 10 minutes - invoices rarely change
    gcTime: 1000 * 60 * 30, // 30 minutes cache
    refetchOnMount: false,
  })

  // Manual fetch functions for backward compatibility
  const fetchUsage = useCallback(async () => {
    if (!user) return
    await queryClient.invalidateQueries({ queryKey: queryKeys.subscription.usage(user.id) })
  }, [user, queryClient])

  const fetchInvoices = useCallback(async () => {
    if (!user) return
    await queryClient.invalidateQueries({ queryKey: queryKeys.subscription.invoices(user.id) })
  }, [user, queryClient])

  // Mutations for subscription operations
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/subscription/cancel', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'فشل في إلغاء الاشتراك')
      return data
    },
    onSuccess: () => {
      if (!user) return
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription.current(user.id) })
    },
  })

  const reactivateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/subscription/reactivate', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'فشل في إعادة تفعيل الاشتراك')
      return data
    },
    onSuccess: () => {
      if (!user) return
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription.current(user.id) })
    },
  })

  // Wrapper functions to maintain API compatibility
  const createCheckoutSession = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/subscription/checkout', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'فشل في إنشاء جلسة الدفع')
      return data.url
    } catch {
      return null
    }
  }, [])

  const createPortalSession = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/subscription/portal', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'فشل في إنشاء جلسة إدارة الاشتراك')
      return data.url
    } catch {
      return null
    }
  }, [])

  const cancelSubscription = useCallback(async (): Promise<boolean> => {
    try {
      await cancelMutation.mutateAsync()
      return true
    } catch {
      return false
    }
  }, [cancelMutation])

  const reactivateSubscription = useCallback(async (): Promise<boolean> => {
    try {
      await reactivateMutation.mutateAsync()
      return true
    } catch {
      return false
    }
  }, [reactivateMutation])

  const refetch = useCallback(async () => {
    if (!user) return
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription.current(user.id) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription.usage(user.id) }),
    ])
  }, [user, queryClient])

  // Compute values from queries
  const subscription = subscriptionQuery.data?.subscription ?? null
  const features = subscriptionQuery.data?.features ?? null
  const usage = usageQuery.data ?? null
  const invoices = invoicesQuery.data ?? []
  const isLoading = subscriptionQuery.isLoading || usageQuery.isLoading || invoicesQuery.isLoading
  const error = subscriptionQuery.error?.message || usageQuery.error?.message || invoicesQuery.error?.message || null

  return {
    subscription,
    features,
    usage,
    invoices,
    isLoading,
    error,
    isPremium: subscription?.isPremium ?? false,
    isTrialing: subscription?.isTrialing ?? false,
    refetch,
    fetchUsage,
    fetchInvoices,
    createCheckoutSession,
    createPortalSession,
    cancelSubscription,
    reactivateSubscription,
  }
}
