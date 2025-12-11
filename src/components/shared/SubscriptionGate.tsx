'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from './LoadingSkeleton'

interface SubscriptionGateProps {
  children: ReactNode
  fallback?: ReactNode
  showUpgradePrompt?: boolean
}

/**
 * SubscriptionGate component
 * Controls access to premium features based on subscription status
 */
export function SubscriptionGate({
  children,
  fallback,
  showUpgradePrompt = true,
}: SubscriptionGateProps) {
  const { isPremium, isLoading, isAuthenticated } = useAuth()

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>تسجيل الدخول مطلوب</CardTitle>
          <CardDescription>
            يرجى تسجيل الدخول للوصول إلى هذه الميزة
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link href="/auth/login">تسجيل الدخول</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Has premium access - show content
  if (isPremium) {
    return <>{children}</>
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>
  }

  // Show upgrade prompt
  if (showUpgradePrompt) {
    return <UpgradePrompt />
  }

  // Default: hide content
  return null
}

/**
 * Upgrade prompt component for free users
 */
export function UpgradePrompt() {
  return (
    <Card className="max-w-lg mx-auto border-accent">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
          <svg
            className="h-8 w-8 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <CardTitle className="text-xl">ميزة مميزة</CardTitle>
        <CardDescription className="text-base">
          هذه الميزة متاحة فقط للمشتركين في الباقة المميزة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            اختبارات قياسية غير محدودة
          </li>
          <li className="flex items-center gap-2">
            <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            تمارين مخصصة غير محدودة
          </li>
          <li className="flex items-center gap-2">
            <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            تحليل مفصل للأداء
          </li>
          <li className="flex items-center gap-2">
            <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            نصائح تحسين مخصصة
          </li>
        </ul>
        <Button asChild className="w-full">
          <Link href="/subscription?upgrade=true">ترقية الآن</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

/**
 * Hook to check if user can access a premium feature
 */
export function usePremiumAccess() {
  const { isPremium, isLoading, isAuthenticated } = useAuth()

  return {
    canAccess: isPremium,
    isLoading,
    isAuthenticated,
    shouldShowUpgrade: isAuthenticated && !isPremium && !isLoading,
  }
}

/**
 * Feature limit indicator for free users
 */
interface FeatureLimitProps {
  currentUsage: number
  maxUsage: number
  label: string
}

export function FeatureLimitIndicator({ currentUsage, maxUsage, label }: FeatureLimitProps) {
  const { isPremium } = useAuth()

  if (isPremium) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-primary">∞</span>
        <span>{label} غير محدود</span>
      </div>
    )
  }

  const usagePercent = Math.min((currentUsage / maxUsage) * 100, 100)
  const isAtLimit = currentUsage >= maxUsage

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={isAtLimit ? 'text-destructive' : 'text-foreground'}>
          {currentUsage}/{maxUsage}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${isAtLimit ? 'bg-destructive' : 'bg-primary'}`}
          style={{ width: `${usagePercent}%` }}
        />
      </div>
      {isAtLimit && (
        <p className="text-xs text-destructive">
          لقد وصلت للحد الأقصى.{' '}
          <Link href="/subscription" className="underline">
            ترقية للمزيد
          </Link>
        </p>
      )}
    </div>
  )
}
