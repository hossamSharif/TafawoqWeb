'use client'

import { useState } from 'react'
import {
  Crown,
  Check,
  Loader2,
  Sparkles,
  GraduationCap,
  BookOpen,
  Share2,
  Library,
  Gift,
} from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { brand, formatPriceWithOriginal } from '@/lib/brand'

interface PlanCardProps {
  tier: 'free' | 'premium'
  isCurrentPlan?: boolean
  onSelect?: () => void
  isLoading?: boolean
  showAllFeatures?: boolean
  className?: string
}

const planFeatures = {
  free: [
    { icon: GraduationCap, text: `${brand.subscription.free.limits.examsPerMonth} اختبارات شهرياً`, highlight: false },
    { icon: BookOpen, text: `${brand.subscription.free.limits.practicesPerMonth} تمارين شهرياً`, highlight: false },
    { icon: Share2, text: `${brand.subscription.free.limits.examSharesPerMonth} مشاركة اختبار`, highlight: false },
    { icon: Share2, text: `${brand.subscription.free.limits.practiceSharesPerMonth} مشاركة تمرين`, highlight: false },
    { icon: Library, text: `${brand.subscription.free.limits.libraryAccessCount} وصول للمكتبة`, highlight: false },
    { icon: Gift, text: 'مكافآت عند مشاركة المحتوى', highlight: true },
  ],
  premium: [
    { icon: GraduationCap, text: `${brand.subscription.premium.limits.examsPerMonth} اختبارات شهرياً`, highlight: true },
    { icon: BookOpen, text: `${brand.subscription.premium.limits.practicesPerMonth} تمارين شهرياً`, highlight: true },
    { icon: Share2, text: `${brand.subscription.premium.limits.examSharesPerMonth} مشاركة اختبار`, highlight: true },
    { icon: Share2, text: `${brand.subscription.premium.limits.practiceSharesPerMonth} مشاركة تمرين`, highlight: true },
    { icon: Library, text: 'وصول غير محدود للمكتبة', highlight: true },
    { icon: Gift, text: 'مكافآت عند مشاركة المحتوى', highlight: true },
  ],
}

export function PlanCard({
  tier,
  isCurrentPlan = false,
  onSelect,
  isLoading = false,
  showAllFeatures = true,
  className,
}: PlanCardProps) {
  const [localLoading, setLocalLoading] = useState(false)
  const isPremium = tier === 'premium'
  const planConfig = brand.subscription[tier]
  const features = planFeatures[tier]
  const priceDisplay = formatPriceWithOriginal(tier)

  const handleSelect = async () => {
    if (onSelect) {
      onSelect()
      return
    }

    if (isCurrentPlan || tier === 'free') return

    setLocalLoading(true)
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
      setLocalLoading(false)
    }
  }

  const loading = isLoading || localLoading

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all',
        isPremium && !isCurrentPlan && 'border-amber-200 bg-gradient-to-b from-amber-50 to-white shadow-amber-100 shadow-lg',
        isCurrentPlan && isPremium && 'ring-2 ring-amber-400',
        isCurrentPlan && !isPremium && 'ring-2 ring-slate-400',
        className
      )}
      dir="rtl"
    >
      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className={cn(
          'absolute -top-0 right-4 text-white text-xs px-3 py-1 rounded-b-lg flex items-center gap-1',
          isPremium ? 'bg-amber-500' : 'bg-slate-600'
        )}>
          {isPremium && <Crown className="h-3 w-3" />}
          خطتك الحالية
        </div>
      )}

      {/* Popular Badge for Premium */}
      {isPremium && !isCurrentPlan && (
        <div className="absolute -top-0 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-3 py-1 rounded-b-lg flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          الأكثر شعبية
        </div>
      )}

      <CardHeader className="pt-8 pb-4">
        <div className="flex items-center gap-2 mb-2">
          {isPremium && <Crown className={cn('h-6 w-6', isPremium ? 'text-amber-600' : 'text-gray-600')} />}
          <h3 className={cn(
            'text-xl font-bold',
            isPremium ? 'text-amber-800' : 'text-gray-900'
          )}>
            {planConfig.name}
          </h3>
        </div>

        {/* Price Display with Strikethrough for Premium */}
        <div className="mt-4">
          {tier === 'free' ? (
            <span className="text-4xl font-bold text-gray-900">مجاناً</span>
          ) : (
            <div className="flex items-baseline gap-2">
              {priceDisplay.original && (
                <span className="text-2xl text-gray-400 line-through">
                  {brand.subscription.premium.originalPrice}
                </span>
              )}
              <span className="text-4xl font-bold text-amber-800">
                {planConfig.price}
              </span>
              <span className="text-amber-700">ر.س/شهر</span>
            </div>
          )}
        </div>

        {/* Discount Badge for Premium */}
        {isPremium && brand.subscription.premium.originalPrice && (
          <div className="mt-2 inline-flex items-center gap-1 bg-green-100 text-green-700 text-sm font-medium px-2 py-1 rounded-full">
            <span>خصم {Math.round((1 - brand.subscription.premium.price / brand.subscription.premium.originalPrice) * 100)}%</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pb-4">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <div className={cn(
                'p-1 rounded',
                feature.highlight
                  ? isPremium ? 'bg-amber-100' : 'bg-blue-100'
                  : 'bg-gray-100'
              )}>
                <feature.icon className={cn(
                  'h-4 w-4',
                  feature.highlight
                    ? isPremium ? 'text-amber-600' : 'text-blue-600'
                    : 'text-gray-500'
                )} />
              </div>
              <span className={cn(
                'text-sm',
                feature.highlight ? 'font-medium text-gray-900' : 'text-gray-600'
              )}>
                {feature.text}
              </span>
              {feature.highlight && (
                <Check className="h-4 w-4 text-green-500 mr-auto" />
              )}
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleSelect}
          disabled={isCurrentPlan || loading}
          className={cn(
            'w-full',
            isPremium && !isCurrentPlan && 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
          )}
          variant={isCurrentPlan || !isPremium ? 'outline' : 'default'}
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              جاري التحميل...
            </>
          ) : isCurrentPlan ? (
            'خطتك الحالية'
          ) : tier === 'free' ? (
            'الخطة المجانية'
          ) : (
            <>
              <Sparkles className="ml-2 h-4 w-4" />
              ترقية الآن
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

// Side by side comparison
interface PlanComparisonProps {
  currentTier?: 'free' | 'premium'
  className?: string
}

export function PlanComparison({ currentTier = 'free', className }: PlanComparisonProps) {
  return (
    <div className={cn('grid gap-6 md:grid-cols-2', className)}>
      <PlanCard tier="free" isCurrentPlan={currentTier === 'free'} />
      <PlanCard tier="premium" isCurrentPlan={currentTier === 'premium'} />
    </div>
  )
}
