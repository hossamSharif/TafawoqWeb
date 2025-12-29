'use client'

import Link from 'next/link'
import { brand, formatPriceWithOriginal, getLimitText } from '@/lib/brand'
import { Button } from '@/components/ui/button'
import { Check, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

interface PlanFeature {
  text: string
  included: boolean
}

interface PlanCardProps {
  name: string
  nameAr: string
  price: number
  originalPrice?: number
  currency: string
  features: PlanFeature[]
  isPopular?: boolean
  isCurrentPlan?: boolean
  isAuthenticated?: boolean
  ctaText: string
  ctaHref: string
}

function PlanCard({
  name,
  nameAr,
  price,
  originalPrice,
  currency,
  features,
  isPopular,
  isCurrentPlan,
  isAuthenticated,
  ctaText,
  ctaHref,
}: PlanCardProps) {
  const priceDisplay = formatPriceWithOriginal(name.toLowerCase() === 'premium' ? 'premium' : 'free')

  return (
    <div
      className={cn(
        'relative p-8 rounded-2xl border-2 transition-all',
        isCurrentPlan
          ? 'border-primary bg-primary/5 shadow-xl scale-105'
          : isPopular
          ? 'border-primary bg-primary/5 shadow-xl scale-105'
          : 'border-border bg-background hover:border-primary/50'
      )}
    >
      {isCurrentPlan && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 rounded-full bg-primary text-white text-sm font-medium flex items-center gap-1">
            <Crown className="h-3 w-3" />
            الخطة الحالية
          </span>
        </div>
      )}
      {!isCurrentPlan && isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 rounded-full bg-primary text-white text-sm font-medium">
            الأكثر شعبية
          </span>
        </div>
      )}

      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2">{nameAr}</h3>
        <div className="flex items-center justify-center gap-2">
          {priceDisplay.original && (
            <span className="text-lg text-muted-foreground line-through">
              {priceDisplay.original}
            </span>
          )}
          <span className="text-4xl font-bold text-primary">
            {priceDisplay.current}
          </span>
          {price > 0 && (
            <span className="text-muted-foreground">/شهرياً</span>
          )}
        </div>
      </div>

      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li
            key={index}
            className={cn(
              'flex items-center gap-3',
              !feature.included && 'text-muted-foreground'
            )}
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center',
                feature.included
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-400'
              )}
            >
              <Check className="h-3 w-3" />
            </div>
            <span>{feature.text}</span>
          </li>
        ))}
      </ul>

      {isCurrentPlan ? (
        <Button
          className="w-full"
          variant="outline"
          size="lg"
          disabled
        >
          الخطة الحالية
        </Button>
      ) : (
        <Button
          asChild
          className="w-full"
          variant={isPopular ? 'default' : 'outline'}
          size="lg"
        >
          <Link href={ctaHref}>{ctaText}</Link>
        </Button>
      )}
    </div>
  )
}

export function PricingSection() {
  const { isAuthenticated, isPremium, subscription } = useAuth()
  const freePlan = brand.subscription.free
  const premiumPlan = brand.subscription.premium

  // Determine current plan
  const isFreeUser = isAuthenticated && !isPremium
  const isPremiumUser = isAuthenticated && isPremium

  const freeFeatures: PlanFeature[] = [
    { text: `${freePlan.limits.examsPerMonth} اختبارات شهرياً`, included: true },
    { text: `${freePlan.limits.practicesPerMonth} تمارين شهرياً`, included: true },
    { text: `${freePlan.limits.examSharesPerMonth} مشاركات اختبار شهرياً`, included: true },
    { text: `${freePlan.limits.libraryAccessCount} وصول للمكتبة`, included: true },
    { text: 'تحليل الأداء الأساسي', included: true },
    { text: 'وصول غير محدود للمكتبة', included: false },
    { text: 'تحليل تفصيلي للأداء', included: false },
  ]

  const premiumFeatures: PlanFeature[] = [
    { text: `${premiumPlan.limits.examsPerMonth} اختبارات شهرياً`, included: true },
    { text: `${premiumPlan.limits.practicesPerMonth} تمارين شهرياً`, included: true },
    { text: `${premiumPlan.limits.examSharesPerMonth} مشاركات اختبار شهرياً`, included: true },
    { text: 'وصول غير محدود للمكتبة', included: true },
    { text: 'تحليل الأداء الأساسي', included: true },
    { text: 'تحليل تفصيلي للأداء', included: true },
    { text: 'أولوية في الدعم الفني', included: true },
  ]

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            خطط تناسب احتياجاتك
          </h2>
          <p className="text-muted-foreground text-lg">
            ابدأ مجاناً أو اختر الخطة المميزة للحصول على كل المزايا
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <PlanCard
            name="Free"
            nameAr={freePlan.name}
            price={freePlan.price}
            currency={freePlan.currency}
            features={freeFeatures}
            isCurrentPlan={isFreeUser}
            isAuthenticated={isAuthenticated}
            ctaText="ابدأ مجاناً"
            ctaHref="/register"
          />
          <PlanCard
            name="Premium"
            nameAr={premiumPlan.name}
            price={premiumPlan.price}
            originalPrice={premiumPlan.originalPrice}
            currency={premiumPlan.currency}
            features={premiumFeatures}
            isPopular={!isAuthenticated}
            isCurrentPlan={isPremiumUser}
            isAuthenticated={isAuthenticated}
            ctaText="اشترك الآن"
            ctaHref={isAuthenticated ? "/subscription" : "/register?plan=premium"}
          />
        </div>

        {/* Money back guarantee */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            ضمان استرداد الأموال خلال 7 أيام - بدون أي أسئلة
          </p>
        </div>
      </div>
    </section>
  )
}
