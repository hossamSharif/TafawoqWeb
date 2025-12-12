'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Crown, Check, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UpgradePromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature?: string
  title?: string
  description?: string
}

const premiumFeatures = [
  'اختبارات قياسية غير محدودة',
  'تمارين غير محدودة بدون قيود',
  'تحليل مفصل للأداء',
  'نصائح تحسين مخصصة',
  'تتبع التقدم المتقدم',
  'إحصائيات مقارنة مع الآخرين',
]

export function UpgradePrompt({
  open,
  onOpenChange,
  feature,
  title = 'ترقية إلى المميز',
  description,
}: UpgradePromptProps) {
  const [isLoading, setIsLoading] = useState(false)

  const defaultDescription = feature
    ? `للوصول إلى ${feature}، يرجى الترقية إلى الاشتراك المميز.`
    : 'احصل على وصول غير محدود لجميع الميزات مع الاشتراك المميز.'

  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إنشاء جلسة الدفع')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-base">
            {description || defaultDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-bold text-amber-800">الباقة المميزة</span>
              <div className="text-left">
                <span className="text-2xl font-bold text-amber-800">49</span>
                <span className="text-amber-700 mr-1">ر.س/شهر</span>
              </div>
            </div>

            <ul className="space-y-2">
              {premiumFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-amber-900">
                  <Check className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري التحميل...
              </>
            ) : (
              <>
                <Sparkles className="ml-2 h-4 w-4" />
                ترقية الآن
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            ربما لاحقاً
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Inline banner version for embedding in pages
interface UpgradeBannerProps {
  feature?: string
  className?: string
  onUpgradeClick?: () => void
}

export function UpgradeBanner({
  feature,
  className,
  onUpgradeClick,
}: UpgradeBannerProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async () => {
    if (onUpgradeClick) {
      onUpgradeClick()
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Upgrade error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4',
        className
      )}
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Crown className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="font-medium text-amber-900">
              {feature ? `${feature} متاحة للمشتركين المميزين` : 'ترقية للحصول على المزيد'}
            </p>
            <p className="text-sm text-amber-700">
              49 ر.س/شهر فقط - اختبارات وتمارين غير محدودة
            </p>
          </div>
        </div>
        <Button
          onClick={handleUpgrade}
          disabled={isLoading}
          className="bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'ترقية'
          )}
        </Button>
      </div>
    </div>
  )
}
