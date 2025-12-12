'use client'

import { useState, useEffect, useCallback } from 'react'

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

  const createCheckoutSession = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إنشاء جلسة الدفع')
      }

      return data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في إنشاء جلسة الدفع')
      return null
    }
  }, [])

  const createPortalSession = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/subscription/portal', {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إنشاء جلسة إدارة الاشتراك')
      }

      return data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في إنشاء جلسة إدارة الاشتراك')
      return null
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

      // Refetch subscription data
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

      // Refetch subscription data
      await fetchSubscription()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في إعادة تفعيل الاشتراك')
      return false
    }
  }, [fetchSubscription])

  // Initial fetch
  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  return {
    subscription,
    features,
    usage,
    invoices,
    isLoading,
    error,
    isPremium: subscription?.isPremium ?? false,
    isTrialing: subscription?.isTrialing ?? false,
    refetch: fetchSubscription,
    fetchUsage,
    fetchInvoices,
    createCheckoutSession,
    createPortalSession,
    cancelSubscription,
    reactivateSubscription,
  }
}
