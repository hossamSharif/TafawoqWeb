'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X, Crown, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PricingComparisonProps {
  currentTier?: string
  onSelectPlan?: (plan: 'free' | 'premium') => void
  className?: string
}

const plans = {
  free: {
    name: 'مجاني',
    price: 0,
    description: 'للبدء في رحلة التحضير',
    features: [
      { name: 'اختبار قياسي واحد أسبوعياً', included: true },
      { name: 'تمارين محدودة (5 أسئلة)', included: true },
      { name: 'فئتان للتمارين كحد أقصى', included: true },
      { name: 'نتائج أساسية', included: true },
      { name: 'اختبارات غير محدودة', included: false },
      { name: 'تمارين غير محدودة', included: false },
      { name: 'تحليل مفصل للأداء', included: false },
      { name: 'نصائح تحسين مخصصة', included: false },
      { name: 'تتبع التقدم المتقدم', included: false },
      { name: 'مقارنة مع الآخرين', included: false },
    ],
  },
  premium: {
    name: 'مميز',
    price: 49,
    description: 'للتحضير الجاد والشامل',
    features: [
      { name: 'اختبارات قياسية غير محدودة', included: true },
      { name: 'تمارين غير محدودة (حتى 100 سؤال)', included: true },
      { name: 'جميع الفئات متاحة', included: true },
      { name: 'نتائج مفصلة وشاملة', included: true },
      { name: 'تحليل نقاط القوة والضعف', included: true },
      { name: 'نصائح تحسين مخصصة', included: true },
      { name: 'تتبع التقدم المتقدم', included: true },
      { name: 'رسوم بيانية للأداء', included: true },
      { name: 'مقارنة مع الآخرين', included: true },
      { name: 'دعم فني أولوية', included: true },
    ],
  },
}

export function PricingComparison({
  currentTier = 'free',
  onSelectPlan,
  className,
}: PricingComparisonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleSelectPlan = async (plan: 'free' | 'premium') => {
    if (onSelectPlan) {
      onSelectPlan(plan)
      return
    }

    if (plan === 'free' || currentTier === 'premium') return

    setIsLoading(true)
    setLoadingPlan(plan)

    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setIsLoading(false)
      setLoadingPlan(null)
    }
  }

  return (
    <div className={cn('grid gap-6 md:grid-cols-2', className)} dir="rtl">
      {/* Free Plan */}
      <Card className={cn(
        'relative',
        currentTier === 'free' && 'ring-2 ring-slate-400'
      )}>
        {currentTier === 'free' && (
          <div className="absolute -top-3 right-4 bg-slate-600 text-white text-xs px-2 py-1 rounded-full">
            خطتك الحالية
          </div>
        )}
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            {plans.free.name}
          </CardTitle>
          <CardDescription>{plans.free.description}</CardDescription>
          <div className="pt-4">
            <span className="text-4xl font-bold">مجاني</span>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {plans.free.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                {feature.included ? (
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-slate-300 flex-shrink-0" />
                )}
                <span className={cn(
                  'text-sm',
                  !feature.included && 'text-slate-400'
                )}>
                  {feature.name}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            disabled={currentTier === 'free'}
          >
            {currentTier === 'free' ? 'خطتك الحالية' : 'الخطة المجانية'}
          </Button>
        </CardFooter>
      </Card>

      {/* Premium Plan */}
      <Card className={cn(
        'relative border-amber-200',
        currentTier === 'premium' ? 'ring-2 ring-amber-400' : 'bg-gradient-to-b from-amber-50 to-white'
      )}>
        {currentTier === 'premium' ? (
          <div className="absolute -top-3 right-4 bg-amber-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Crown className="h-3 w-3" />
            خطتك الحالية
          </div>
        ) : (
          <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            الأكثر شعبية
          </div>
        )}
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-amber-800">
            <Crown className="h-5 w-5" />
            {plans.premium.name}
          </CardTitle>
          <CardDescription>{plans.premium.description}</CardDescription>
          <div className="pt-4">
            <span className="text-4xl font-bold text-amber-800">49</span>
            <span className="text-amber-700 mr-1">ر.س/شهر</span>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {plans.premium.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span className="text-sm">{feature.name}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          <Button
            className={cn(
              'w-full',
              currentTier !== 'premium' && 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
            )}
            disabled={currentTier === 'premium' || isLoading}
            onClick={() => handleSelectPlan('premium')}
          >
            {isLoading && loadingPlan === 'premium' ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري التحميل...
              </>
            ) : currentTier === 'premium' ? (
              'خطتك الحالية'
            ) : (
              <>
                <Sparkles className="ml-2 h-4 w-4" />
                ترقية الآن
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// Compact version for embedding in smaller spaces
export function PricingCompact({
  currentTier = 'free',
  onUpgradeClick,
  className,
}: {
  currentTier?: string
  onUpgradeClick?: () => void
  className?: string
}) {
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
      console.error('Checkout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (currentTier === 'premium') {
    return null
  }

  const keyFeatures = [
    'اختبارات غير محدودة',
    'تمارين غير محدودة',
    'تحليل مفصل للأداء',
  ]

  return (
    <div
      className={cn(
        'rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4',
        className
      )}
      dir="rtl"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-5 w-5 text-amber-600" />
            <span className="font-semibold text-amber-800">الباقة المميزة</span>
            <span className="text-amber-700 text-sm">49 ر.س/شهر</span>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {keyFeatures.map((feature, i) => (
              <li key={i} className="flex items-center gap-1 text-sm text-amber-900">
                <Check className="h-3.5 w-3.5 text-amber-600" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <Button
          onClick={handleUpgrade}
          disabled={isLoading}
          className="bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ترقية'}
        </Button>
      </div>
    </div>
  )
}
