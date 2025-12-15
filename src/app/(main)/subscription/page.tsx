'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MaintenanceBanner } from '@/components/shared/MaintenanceBanner'
import { Loader2, Check, Crown, Zap, X } from 'lucide-react'

interface MaintenanceStatus {
  enabled: boolean
  message: string | null
}

const features = {
  free: [
    { text: '3 اختبارات تجريبية أسبوعياً', included: true },
    { text: 'تمارين مخصصة (5 أسئلة، فئتين)', included: true },
    { text: 'نتائج الاختبار الأساسية', included: true },
    { text: 'الشروحات بعد 24 ساعة', included: true },
    { text: 'اختبارات غير محدودة', included: false },
    { text: 'شروحات فورية', included: false },
    { text: 'تحليل الأداء المتقدم', included: false },
  ],
  premium: [
    { text: 'اختبارات تجريبية غير محدودة', included: true },
    { text: 'تمارين مخصصة (100 سؤال، جميع الفئات)', included: true },
    { text: 'شروحات فورية بعد كل سؤال', included: true },
    { text: 'تحليل الأداء المتقدم', included: true },
    { text: 'تتبع التقدم والإحصائيات', included: true },
    { text: 'دعم فني أولوية', included: true },
    { text: '3 أيام تجربة مجانية', included: true },
  ],
}

export default function SubscriptionPage() {
  const router = useRouter()
  const { subscription, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatus | null>(null)

  const isPremium = subscription?.tier === 'premium' && subscription?.status === 'active'
  const isTrialing = subscription?.tier === 'premium' && subscription?.status === 'trialing'
  const isCanceled = subscription?.status === 'canceled'

  // T082: Check maintenance status on mount
  useEffect(() => {
    async function checkMaintenance() {
      try {
        const response = await fetch('/api/admin/maintenance')
        if (response.ok) {
          const data = await response.json()
          setMaintenanceStatus(data)
        }
      } catch (error) {
        console.error('Error checking maintenance status:', error)
      }
    }
    checkMaintenance()
  }, [])

  const handleUpgrade = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إنشاء جلسة الدفع')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/subscription/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في فتح بوابة الاشتراك')
      }

      // Redirect to Stripe Customer Portal
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* T082: Maintenance Banner */}
      {maintenanceStatus?.enabled && (
        <MaintenanceBanner
          message={maintenanceStatus.message}
          variant="inline"
          dismissible={false}
        />
      )}

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">خطط الاشتراك</h1>
        <p className="text-muted-foreground">
          اختر الخطة المناسبة لاحتياجاتك
        </p>
      </div>

      {/* Current Subscription Status */}
      {(isPremium || isTrialing) && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold">
                    {isTrialing ? 'أنت في فترة التجربة المجانية' : 'أنت مشترك في الخطة المميزة'}
                  </p>
                  {isTrialing && subscription?.trial_end_at && (
                    <p className="text-sm text-muted-foreground">
                      تنتهي التجربة في: {new Date(subscription.trial_end_at).toLocaleDateString('ar-SA')}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={isLoading || maintenanceStatus?.enabled}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : maintenanceStatus?.enabled ? (
                  'غير متاح أثناء الصيانة'
                ) : (
                  'إدارة الاشتراك'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isCanceled && (
        <Card className="border-amber-500 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-800">تم إلغاء اشتراكك</p>
                <p className="text-sm text-amber-700">
                  يمكنك إعادة الاشتراك في أي وقت للاستفادة من جميع المميزات
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Free Plan */}
        <Card className={!isPremium && !isTrialing ? 'border-primary' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>الخطة المجانية</CardTitle>
              {!isPremium && !isTrialing && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                  الخطة الحالية
                </span>
              )}
            </div>
            <CardDescription>للمبتدئين</CardDescription>
            <div className="pt-2">
              <span className="text-3xl font-bold">مجاني</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {features.free.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  {feature.included ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className={!feature.included ? 'text-muted-foreground' : ''}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className={isPremium || isTrialing ? 'border-primary' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                الخطة المميزة
              </CardTitle>
              {(isPremium || isTrialing) && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                  الخطة الحالية
                </span>
              )}
            </div>
            <CardDescription>للطلاب الجادين</CardDescription>
            <div className="pt-2">
              <span className="text-3xl font-bold">49</span>
              <span className="text-muted-foreground"> ر.س/شهر</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {features.premium.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {!isPremium && !isTrialing && (
              <Button
                onClick={handleUpgrade}
                disabled={isLoading || maintenanceStatus?.enabled}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    جاري التحميل...
                  </>
                ) : maintenanceStatus?.enabled ? (
                  'غير متاح أثناء الصيانة'
                ) : (
                  <>
                    <Crown className="ml-2 h-5 w-5" />
                    ابدأ التجربة المجانية
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Back Button */}
      <div className="text-center">
        <Button variant="ghost" onClick={() => router.push('/dashboard')}>
          العودة للرئيسية
        </Button>
      </div>
    </div>
  )
}
