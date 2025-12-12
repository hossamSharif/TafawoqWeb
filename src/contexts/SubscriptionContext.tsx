'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { SubscriptionData, SubscriptionFeatures, UsageData, Invoice } from '@/hooks/useSubscription'

interface SubscriptionContextValue {
  // Subscription data
  subscription: SubscriptionData | null
  features: SubscriptionFeatures | null
  usage: UsageData | null
  invoices: Invoice[]

  // Status
  isLoading: boolean
  error: string | null

  // Computed values
  isPremium: boolean
  isTrialing: boolean
  isFree: boolean

  // Actions
  refetch: () => Promise<void>
  fetchUsage: () => Promise<void>
  fetchInvoices: () => Promise<void>
  upgrade: () => Promise<void>
  manageSubscription: () => Promise<void>
  cancelSubscription: () => Promise<boolean>
  reactivateSubscription: () => Promise<boolean>

  // Feature checks
  canTakeExam: () => boolean
  canAccessUnlimitedPractice: () => boolean
  canAccessAnalytics: () => boolean
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

interface SubscriptionProviderProps {
  children: React.ReactNode
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [features, setFeatures] = useState<SubscriptionFeatures | null>(null)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/subscription')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في جلب بيانات الاشتراك')
      }

      setSubscription(data.subscription)
      setFeatures(data.features)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchUsage = useCallback(async () => {
    try {
      const response = await fetch('/api/subscription/usage')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في جلب بيانات الاستخدام')
      }

      setUsage(data.usage)
    } catch (err) {
      console.error('Usage fetch error:', err)
    }
  }, [])

  const fetchInvoices = useCallback(async () => {
    try {
      const response = await fetch('/api/subscription/invoices')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في جلب الفواتير')
      }

      setInvoices(data.invoices)
    } catch (err) {
      console.error('Invoices fetch error:', err)
    }
  }, [])

  const upgrade = useCallback(async () => {
    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إنشاء جلسة الدفع')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في إنشاء جلسة الدفع')
    }
  }, [])

  const manageSubscription = useCallback(async () => {
    try {
      const response = await fetch('/api/subscription/portal', {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في فتح إدارة الاشتراك')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في فتح إدارة الاشتراك')
    }
  }, [])

  const cancelSubscription = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إلغاء الاشتراك')
      }

      await fetchSubscription()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في إلغاء الاشتراك')
      return false
    }
  }, [fetchSubscription])

  const reactivateSubscription = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/subscription/reactivate', {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إعادة تفعيل الاشتراك')
      }

      await fetchSubscription()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في إعادة تفعيل الاشتراك')
      return false
    }
  }, [fetchSubscription])

  // Feature check functions
  const canTakeExam = useCallback((): boolean => {
    if (subscription?.isPremium) return true
    if (!usage) return true // Assume yes if usage not loaded
    return usage.exams.isEligible
  }, [subscription, usage])

  const canAccessUnlimitedPractice = useCallback((): boolean => {
    return subscription?.isPremium ?? false
  }, [subscription])

  const canAccessAnalytics = useCallback((): boolean => {
    return subscription?.isPremium ?? false
  }, [subscription])

  // Initial fetch
  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  // Computed values
  const isPremium = subscription?.isPremium ?? false
  const isTrialing = subscription?.isTrialing ?? false
  const isFree = !isPremium

  const value: SubscriptionContextValue = {
    subscription,
    features,
    usage,
    invoices,
    isLoading,
    error,
    isPremium,
    isTrialing,
    isFree,
    refetch: fetchSubscription,
    fetchUsage,
    fetchInvoices,
    upgrade,
    manageSubscription,
    cancelSubscription,
    reactivateSubscription,
    canTakeExam,
    canAccessUnlimitedPractice,
    canAccessAnalytics,
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider')
  }
  return context
}

// Re-export for convenience
export type { SubscriptionData, SubscriptionFeatures, UsageData, Invoice }
