'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { DEFAULT_MAINTENANCE_MESSAGE } from '@/types'

interface MaintenanceBannerProps {
  message?: string | null
  dismissible?: boolean
  variant?: 'full' | 'inline' | 'compact'
  onDismiss?: () => void
}

export function MaintenanceBanner({
  message,
  dismissible = true,
  variant = 'full',
  onDismiss,
}: MaintenanceBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  // Reset dismissed state if message changes
  useEffect(() => {
    setIsDismissed(false)
  }, [message])

  if (isDismissed) {
    return null
  }

  const displayMessage = message || DEFAULT_MAINTENANCE_MESSAGE.ar

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-800 text-sm rounded-lg">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{displayMessage}</span>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="mr-auto p-1 hover:bg-amber-200 rounded transition-colors"
            aria-label="إغلاق"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="p-2 bg-amber-100 rounded-full flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-amber-800">النظام قيد الصيانة</h4>
          <p className="text-sm text-amber-700 mt-1">{displayMessage}</p>
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-amber-100 rounded-lg transition-colors"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4 text-amber-600" />
          </button>
        )}
      </div>
    )
  }

  // Full width banner (default)
  return (
    <div className="w-full bg-gradient-to-l from-amber-500 to-amber-400 text-white py-3 px-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white/20 rounded-full">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <span className="font-semibold block sm:inline">وضع الصيانة مفعل</span>
            <span className="hidden sm:inline mx-2">-</span>
            <span className="text-sm text-amber-50 block sm:inline">{displayMessage}</span>
          </div>
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Client-side hook to check maintenance status and show banner
 */
export function useMaintenanceStatus() {
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await fetch('/api/admin/maintenance')
        if (response.ok) {
          const data = await response.json()
          setIsMaintenanceActive(data.enabled)
          setMaintenanceMessage(data.message)
        }
      } catch (error) {
        console.error('Failed to check maintenance status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkStatus()

    // Check periodically
    const interval = setInterval(checkStatus, 60000) // Every minute
    return () => clearInterval(interval)
  }, [])

  return {
    isMaintenanceActive,
    maintenanceMessage,
    isLoading,
  }
}

/**
 * Full-page maintenance block component
 * Used when a write operation is blocked
 */
interface MaintenanceBlockProps {
  message?: string | null
  operation?: string
  onGoBack?: () => void
}

export function MaintenanceBlock({
  message,
  operation,
  onGoBack,
}: MaintenanceBlockProps) {
  const displayMessage = message || DEFAULT_MAINTENANCE_MESSAGE.ar

  const operationLabels: Record<string, string> = {
    exam_generation: 'توليد الاختبارات',
    practice_creation: 'إنشاء التمارين',
    subscription_change: 'تغيير الاشتراك',
    content_sharing: 'مشاركة المحتوى',
    forum_post_creation: 'النشر في المنتدى',
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="p-4 bg-amber-100 rounded-full w-fit mx-auto">
          <AlertTriangle className="h-12 w-12 text-amber-600" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900">النظام قيد الصيانة</h2>
          {operation && operationLabels[operation] && (
            <p className="text-sm text-amber-600 font-medium">
              {operationLabels[operation]} غير متاحة حالياً
            </p>
          )}
          <p className="text-muted-foreground">{displayMessage}</p>
        </div>

        <div className="flex flex-col gap-3">
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              العودة
            </button>
          )}
          <p className="text-xs text-muted-foreground">
            يمكنك تصفح المحتوى الموجود أثناء الصيانة
          </p>
        </div>
      </div>
    </div>
  )
}
