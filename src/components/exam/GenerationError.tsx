'use client'

import { AlertCircle, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export interface GenerationErrorProps {
  /** Error message to display */
  message?: string
  /** Called when user clicks retry */
  onRetry?: () => void
  /** Called when user clicks cancel/dismiss */
  onCancel?: () => void
  /** Whether retry is in progress */
  isRetrying?: boolean
  /** Additional CSS classes */
  className?: string
  /** Whether to show as a dismissible toast-style alert */
  variant?: 'inline' | 'modal' | 'toast'
}

/**
 * GenerationError - Display generation failure with cancel/retry options
 * Used when question batch generation fails (503 Service Unavailable)
 */
export function GenerationError({
  message = 'خدمة التوليد غير متاحة حالياً',
  onRetry,
  onCancel,
  isRetrying = false,
  className,
  variant = 'inline',
}: GenerationErrorProps) {
  if (variant === 'toast') {
    return (
      <div
        className={cn(
          'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50',
          'animate-in slide-in-from-bottom-2 duration-300',
          className
        )}
        dir="rtl"
      >
        <Alert variant="destructive" className="shadow-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-sm font-semibold">
            خطأ في تحميل الأسئلة
          </AlertTitle>
          <AlertDescription className="text-sm mt-1">
            {message}
          </AlertDescription>
          <div className="flex gap-2 mt-3">
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                disabled={isRetrying}
                className="flex-1"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="h-3 w-3 ml-1 animate-spin" />
                    جاري المحاولة...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 ml-1" />
                    إعادة المحاولة
                  </>
                )}
              </Button>
            )}
            {onCancel && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancel}
                disabled={isRetrying}
                className="px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Alert>
      </div>
    )
  }

  if (variant === 'modal') {
    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center bg-black/50',
          className
        )}
        dir="rtl"
      >
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4 animate-in zoom-in-95 duration-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 bg-red-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                فشل تحميل الأسئلة
              </h3>
              <p className="text-gray-600 text-sm mb-4">{message}</p>
              <p className="text-gray-500 text-xs mb-4">
                يمكنك إعادة المحاولة أو إلغاء الاختبار والعودة لاحقاً.
              </p>
              <div className="flex gap-3">
                {onRetry && (
                  <Button
                    onClick={onRetry}
                    disabled={isRetrying}
                    className="flex-1"
                  >
                    {isRetrying ? (
                      <>
                        <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                        جاري المحاولة...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 ml-2" />
                        إعادة المحاولة
                      </>
                    )}
                  </Button>
                )}
                {onCancel && (
                  <Button
                    variant="outline"
                    onClick={onCancel}
                    disabled={isRetrying}
                  >
                    إلغاء الاختبار
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default inline variant
  return (
    <Alert
      variant="destructive"
      className={cn('animate-in fade-in duration-300', className)}
      dir="rtl"
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="text-sm font-semibold">
        خطأ في تحميل الأسئلة
      </AlertTitle>
      <AlertDescription className="text-sm mt-1">
        <p className="mb-3">{message}</p>
        <div className="flex gap-2">
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-3 w-3 ml-1 animate-spin" />
                  جاري المحاولة...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 ml-1" />
                  إعادة المحاولة
                </>
              )}
            </Button>
          )}
          {onCancel && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              disabled={isRetrying}
            >
              إلغاء
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

export default GenerationError
