'use client'

import { useState } from 'react'
import {
  Crown,
  AlertTriangle,
  Loader2,
  GraduationCap,
  BookOpen,
  Share2,
  Library,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { brand } from '@/lib/brand'

type LimitType = 'exam' | 'practice' | 'exam_share' | 'practice_share' | 'library'

interface LimitReachedPromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  limitType: LimitType
  currentTier?: 'free' | 'premium'
}

const limitConfig: Record<LimitType, {
  icon: typeof GraduationCap
  title: string
  description: string
  upgradeMessage: string
  freeLimit: number
  premiumLimit: number | null
}> = {
  exam: {
    icon: GraduationCap,
    title: 'وصلت للحد الأقصى من الاختبارات',
    description: 'لقد استنفدت عدد الاختبارات المتاحة لك هذا الشهر.',
    upgradeMessage: 'ترقية للحصول على المزيد من الاختبارات',
    freeLimit: brand.subscription.free.limits.examsPerMonth,
    premiumLimit: brand.subscription.premium.limits.examsPerMonth,
  },
  practice: {
    icon: BookOpen,
    title: 'وصلت للحد الأقصى من التمارين',
    description: 'لقد استنفدت عدد التمارين المتاحة لك هذا الشهر.',
    upgradeMessage: 'ترقية للحصول على المزيد من التمارين',
    freeLimit: brand.subscription.free.limits.practicesPerMonth,
    premiumLimit: brand.subscription.premium.limits.practicesPerMonth,
  },
  exam_share: {
    icon: Share2,
    title: 'وصلت للحد الأقصى من مشاركات الاختبارات',
    description: 'لقد استنفدت عدد مشاركات الاختبارات المتاحة لك هذا الشهر.',
    upgradeMessage: 'ترقية لمشاركة المزيد من الاختبارات',
    freeLimit: brand.subscription.free.limits.examSharesPerMonth,
    premiumLimit: brand.subscription.premium.limits.examSharesPerMonth,
  },
  practice_share: {
    icon: Share2,
    title: 'وصلت للحد الأقصى من مشاركات التمارين',
    description: 'لقد استنفدت عدد مشاركات التمارين المتاحة لك هذا الشهر.',
    upgradeMessage: 'ترقية لمشاركة المزيد من التمارين',
    freeLimit: brand.subscription.free.limits.practiceSharesPerMonth,
    premiumLimit: brand.subscription.premium.limits.practiceSharesPerMonth,
  },
  library: {
    icon: Library,
    title: 'وصلت للحد الأقصى من وصول المكتبة',
    description: 'لقد استنفدت عدد مرات الوصول للمكتبة المتاحة لك.',
    upgradeMessage: 'ترقية للوصول غير المحدود للمكتبة',
    freeLimit: brand.subscription.free.limits.libraryAccessCount,
    premiumLimit: null, // unlimited
  },
}

export function LimitReachedPrompt({
  open,
  onOpenChange,
  limitType,
  currentTier = 'free',
}: LimitReachedPromptProps) {
  const [isLoading, setIsLoading] = useState(false)
  const config = limitConfig[limitType]
  const Icon = config.icon

  const handleUpgrade = async () => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <DialogTitle className="text-xl">{config.title}</DialogTitle>
          <DialogDescription className="text-base">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Current vs Premium comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500 mb-1">خطتك الحالية</p>
              <p className="text-2xl font-bold text-gray-700">
                {config.freeLimit}
              </p>
              <p className="text-xs text-gray-500">شهرياً</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
              <p className="text-sm text-amber-700 mb-1">الخطة المميزة</p>
              <p className="text-2xl font-bold text-amber-800">
                {config.premiumLimit === null ? 'غير محدود' : config.premiumLimit}
              </p>
              <p className="text-xs text-amber-600">شهرياً</p>
            </div>
          </div>

          {/* Price banner */}
          <div className="rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Crown className="h-5 w-5 text-amber-600" />
              <span className="font-semibold text-amber-800">الباقة المميزة</span>
            </div>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-gray-400 line-through text-lg">
                {brand.subscription.premium.originalPrice}
              </span>
              <span className="text-2xl font-bold text-amber-800">
                {brand.subscription.premium.price}
              </span>
              <span className="text-amber-700">ر.س/شهر</span>
            </div>
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
                <Crown className="ml-2 h-4 w-4" />
                {config.upgradeMessage}
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

// Alert banner version for inline display
interface LimitWarningAlertProps {
  limitType: LimitType
  remaining: number
  limit: number
  onUpgradeClick?: () => void
  className?: string
}

export function LimitWarningAlert({
  limitType,
  remaining,
  limit,
  onUpgradeClick,
  className,
}: LimitWarningAlertProps) {
  const [isLoading, setIsLoading] = useState(false)
  const config = limitConfig[limitType]
  const Icon = config.icon

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

  // Show warning when remaining is low (1 or less)
  if (remaining > 1) return null

  const isAtLimit = remaining === 0

  return (
    <Alert
      className={cn(
        isAtLimit ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50',
        className
      )}
      dir="rtl"
    >
      <Icon className={cn(
        'h-4 w-4',
        isAtLimit ? 'text-red-600' : 'text-amber-600'
      )} />
      <AlertTitle className={isAtLimit ? 'text-red-800' : 'text-amber-800'}>
        {isAtLimit ? config.title : `تنبيه: متبقي لك ${remaining} فقط`}
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span className={isAtLimit ? 'text-red-700' : 'text-amber-700'}>
          {isAtLimit
            ? config.description
            : `استخدمت ${limit - remaining} من ${limit}.`}
        </span>
        <Button
          size="sm"
          variant={isAtLimit ? 'default' : 'outline'}
          onClick={handleUpgrade}
          disabled={isLoading}
          className={cn(
            'flex-shrink-0',
            isAtLimit && 'bg-amber-500 hover:bg-amber-600 text-white'
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Crown className="h-4 w-4 ml-1" />
              ترقية
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
