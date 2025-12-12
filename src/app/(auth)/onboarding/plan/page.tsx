'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Check, Crown, Loader2 } from 'lucide-react'

type SubscriptionPlan = 'free' | 'premium'

export default function PlanSelectionPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('free')
  const [academicTrack, setAcademicTrack] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const track = sessionStorage.getItem('selectedTrack')
    if (!track) {
      router.push('/onboarding/track')
      return
    }
    setAcademicTrack(track)
  }, [router])

  const handleComplete = async () => {
    if (!academicTrack) return
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/profile/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicTrack,
          subscriptionPlan: selectedPlan,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'فشل إكمال التسجيل')

      sessionStorage.removeItem('selectedTrack')
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setIsLoading(false)
    }
  }

  const freeFeatures = [
    '3 اختبارات تجريبية أسبوعياً',
    'تمارين مخصصة (5 أسئلة، فئتين)',
    'نتائج الاختبار الأساسية',
    'الشروحات بعد 24 ساعة',
  ]

  const premiumFeatures = [
    'اختبارات تجريبية غير محدودة',
    'تمارين مخصصة (100 سؤال، جميع الفئات)',
    'شروحات فورية بعد كل سؤال',
    'تحليل الأداء المتقدم',
    'تتبع التقدم والإحصائيات',
    '3 أيام تجربة مجانية',
  ]

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">اختر خطتك</CardTitle>
        <CardDescription>ابدأ مجاناً أو احصل على جميع المميزات</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">{error}</div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {/* Free Plan */}
          <button
            onClick={() => setSelectedPlan('free')}
            className={cn(
              'relative p-6 rounded-xl border-2 text-right transition-all',
              selectedPlan === 'free' ? 'border-primary bg-primary/5' : 'border-border bg-white hover:border-primary/50'
            )}
          >
            <h3 className="text-xl font-bold mb-2">الخطة المجانية</h3>
            <p className="text-3xl font-bold mb-4">مجاني</p>
            <ul className="space-y-3">
              {freeFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />{feature}
                </li>
              ))}
            </ul>
          </button>

          {/* Premium Plan */}
          <button
            onClick={() => setSelectedPlan('premium')}
            className={cn(
              'relative p-6 rounded-xl border-2 text-right transition-all',
              selectedPlan === 'premium' ? 'border-primary bg-primary/5' : 'border-border bg-white hover:border-primary/50'
            )}
          >
            <div className="absolute -top-3 right-4 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Crown className="h-3 w-3" />موصى به
            </div>
            <h3 className="text-xl font-bold mb-2">الخطة المميزة</h3>
            <p className="text-3xl font-bold mb-1">49 ر.س<span className="text-sm font-normal text-muted-foreground">/شهر</span></p>
            <p className="text-xs text-green-600 mb-4">3 أيام تجربة مجانية</p>
            <ul className="space-y-3">
              {premiumFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />{feature}
                </li>
              ))}
            </ul>
          </button>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        <Button onClick={handleComplete} className="w-full" disabled={isLoading} size="lg">
          {isLoading ? (
            <><Loader2 className="ml-2 h-4 w-4 animate-spin" />جاري الإكمال...</>
          ) : selectedPlan === 'premium' ? (
            'بدء التجربة المجانية'
          ) : (
            'البدء بالخطة المجانية'
          )}
        </Button>
        {selectedPlan === 'premium' && (
          <p className="text-xs text-center text-muted-foreground">
            لن يتم خصم أي مبلغ خلال فترة التجربة. يمكنك الإلغاء في أي وقت.
          </p>
        )}
      </CardFooter>
    </Card>
  )
}
