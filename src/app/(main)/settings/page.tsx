'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoadingSkeleton, OnboardingTutorial } from '@/components/shared'
import { SubscriptionBadge } from '@/components/subscription/SubscriptionBadge'
import { TrialCountdown } from '@/components/subscription/TrialCountdown'
import { PricingComparison } from '@/components/subscription/PricingComparison'
import { useSubscription, type Invoice } from '@/hooks/useSubscription'
import {
  Settings,
  Crown,
  CreditCard,
  Receipt,
  User,
  BookOpen,
  ChevronLeft,
  ExternalLink,
  AlertTriangle,
  Check,
  Loader2,
  RefreshCw,
  Calendar,
  Download,
  HelpCircle,
  Play,
  MessageCircle,
  FileQuestion,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const activeSection = searchParams.get('section') || 'subscription'

  const {
    subscription,
    features,
    invoices,
    isLoading,
    isPremium,
    isTrialing,
    refetch,
    fetchInvoices,
    createPortalSession,
    cancelSubscription,
    reactivateSubscription,
  } = useSubscription()

  const [profile, setProfile] = useState<{
    email: string
    academicTrack: 'scientific' | 'literary'
  } | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)
  const [isReactivating, setIsReactivating] = useState(false)
  const [isLoadingPortal, setIsLoadingPortal] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)

  // Check for subscription success/cancel in URL
  useEffect(() => {
    const subscriptionStatus = searchParams.get('subscription')
    if (subscriptionStatus === 'success') {
      // Refresh subscription data after successful checkout
      refetch()
    }
  }, [searchParams, refetch])

  // Fetch profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('/api/profile')
        if (response.ok) {
          const data = await response.json()
          setProfile({
            email: data.profile?.email || data.email,
            academicTrack: data.profile?.academic_track || 'scientific',
          })
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setProfileLoading(false)
      }
    }
    fetchProfile()
  }, [])

  // Fetch invoices when subscription section is active
  useEffect(() => {
    if (activeSection === 'subscription' && isPremium) {
      fetchInvoices()
    }
  }, [activeSection, isPremium, fetchInvoices])

  const handleManageSubscription = async () => {
    setIsLoadingPortal(true)
    try {
      const url = await createPortalSession()
      if (url) {
        window.location.href = url
      }
    } finally {
      setIsLoadingPortal(false)
    }
  }

  const handleCancelSubscription = async () => {
    setIsCanceling(true)
    try {
      await cancelSubscription()
      setShowCancelDialog(false)
    } finally {
      setIsCanceling(false)
    }
  }

  const handleReactivate = async () => {
    setIsReactivating(true)
    try {
      await reactivateSubscription()
    } finally {
      setIsReactivating(false)
    }
  }

  const isCanceled = subscription?.canceledAt !== null

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <PageLoadingSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">الإعدادات</h1>
                <p className="text-gray-500 text-sm">إدارة حسابك واشتراكك</p>
              </div>
            </div>
            <Link href="/profile">
              <Button variant="outline" size="sm" className="gap-2">
                <User className="w-4 h-4" />
                الملف الشخصي
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Subscription Section */}
        <section id="subscription" className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className={cn(
                    'w-6 h-6',
                    isPremium ? 'text-amber-500' : 'text-gray-400'
                  )} />
                  <div>
                    <CardTitle>الاشتراك</CardTitle>
                    <CardDescription>إدارة خطة اشتراكك</CardDescription>
                  </div>
                </div>
                <SubscriptionBadge
                  tier={subscription?.tier || 'free'}
                  status={subscription?.status}
                  isTrialing={isTrialing}
                  daysRemaining={subscription?.daysRemaining}
                  showDetails
                  size="md"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Trial Countdown */}
              {isTrialing && subscription?.trialEndAt && (
                <TrialCountdown
                  trialEndAt={subscription.trialEndAt}
                  variant="banner"
                />
              )}

              {/* Current Plan Info */}
              {isPremium && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-amber-900 mb-1">الباقة المميزة</h3>
                      <p className="text-sm text-amber-700">49 ر.س/شهر</p>

                      {subscription?.currentPeriodEnd && (
                        <p className="text-sm text-amber-700 mt-2">
                          {isCanceled ? (
                            <>
                              <span className="text-red-600">سينتهي في: </span>
                              {new Date(subscription.currentPeriodEnd).toLocaleDateString('ar-SA')}
                            </>
                          ) : (
                            <>
                              التجديد التالي:{' '}
                              {new Date(subscription.currentPeriodEnd).toLocaleDateString('ar-SA')}
                            </>
                          )}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {subscription?.stripeCustomerId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleManageSubscription}
                          disabled={isLoadingPortal}
                          className="gap-1"
                        >
                          {isLoadingPortal ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4" />
                              إدارة الدفع
                              <ExternalLink className="w-3 h-3" />
                            </>
                          )}
                        </Button>
                      )}

                      {isCanceled ? (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleReactivate}
                          disabled={isReactivating}
                          className="gap-1"
                        >
                          {isReactivating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              إعادة التفعيل
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCancelDialog(true)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          إلغاء الاشتراك
                        </Button>
                      )}
                    </div>
                  </div>

                  {isCanceled && (
                    <div className="mt-4 p-3 bg-red-100 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          تم جدولة إلغاء اشتراكك. ستفقد المميزات في{' '}
                          {new Date(subscription?.currentPeriodEnd || '').toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Free Plan / Upgrade */}
              {!isPremium && (
                <div className="space-y-4">
                  <div className="rounded-lg border p-4 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-1">الباقة المجانية</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      استمتع بالميزات الأساسية مجاناً
                    </p>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {features?.featureList.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    onClick={() => setShowUpgrade(!showUpgrade)}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                  >
                    <Crown className="w-4 h-4 ml-2" />
                    ترقية للمميز
                  </Button>

                  {showUpgrade && (
                    <PricingComparison currentTier="free" />
                  )}
                </div>
              )}

              {/* Features List for Premium */}
              {isPremium && features && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">ميزات اشتراكك</h4>
                  <ul className="grid md:grid-cols-2 gap-2">
                    {features.featureList.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-amber-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Billing History - Premium Only */}
        {isPremium && invoices.length > 0 && (
          <section id="billing" className="mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Receipt className="w-6 h-6 text-gray-400" />
                  <div>
                    <CardTitle>سجل الفواتير</CardTitle>
                    <CardDescription>عرض وتحميل الفواتير السابقة</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <InvoiceRow key={invoice.id} invoice={invoice} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Account Section */}
        <section id="account" className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 text-gray-400" />
                <div>
                  <CardTitle>الحساب</CardTitle>
                  <CardDescription>معلومات حسابك الأساسية</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                  <p className="font-medium">{profile?.email || '—'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">المسار الأكاديمي</p>
                    <p className="font-medium">
                      {profile?.academicTrack === 'scientific' ? 'علمي' : 'أدبي'}
                    </p>
                  </div>
                </div>
                <Link href="/profile">
                  <Button variant="ghost" size="sm">
                    تعديل
                    <ChevronLeft className="w-4 h-4 mr-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Help Section */}
        <section id="help" className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <HelpCircle className="w-6 h-6 text-gray-400" />
                <div>
                  <CardTitle>المساعدة</CardTitle>
                  <CardDescription>موارد مساعدة وإرشادات</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Replay Tutorial */}
              <button
                onClick={() => setShowTutorial(true)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-right"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Play className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">إعادة مشاهدة الدليل التعريفي</p>
                    <p className="text-sm text-gray-500">تعرف على ميزات المنصة والنظام</p>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>

              {/* FAQ Link */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileQuestion className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">الأسئلة الشائعة</p>
                    <p className="text-sm text-gray-500">إجابات لأكثر الأسئلة شيوعاً</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">قريباً</span>
              </div>

              {/* Contact Support */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">تواصل معنا</p>
                    <p className="text-sm text-gray-500">للدعم الفني والاستفسارات</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">قريباً</span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Back to Dashboard */}
        <div className="flex justify-center">
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              العودة للوحة التحكم
            </Button>
          </Link>
        </div>
      </main>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>إلغاء الاشتراك</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إلغاء اشتراكك المميز؟ ستستمر في الوصول للميزات المميزة حتى نهاية فترة الفوترة الحالية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={isCanceling}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCanceling ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : null}
              تأكيد الإلغاء
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Onboarding Tutorial Replay */}
      {showTutorial && (
        <OnboardingTutorial
          onComplete={() => setShowTutorial(false)}
          isReplay
        />
      )}
    </div>
  )
}

// Invoice Row Component
function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const statusColors: Record<string, string> = {
    paid: 'text-green-600 bg-green-50',
    open: 'text-blue-600 bg-blue-50',
    draft: 'text-gray-600 bg-gray-50',
    void: 'text-red-600 bg-red-50',
    uncollectible: 'text-red-600 bg-red-50',
  }

  const statusLabels: Record<string, string> = {
    paid: 'مدفوعة',
    open: 'مفتوحة',
    draft: 'مسودة',
    void: 'ملغاة',
    uncollectible: 'غير قابلة للتحصيل',
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <Calendar className="w-5 h-5 text-gray-400" />
        <div>
          <p className="font-medium text-sm">
            {invoice.description}
          </p>
          <p className="text-sm text-gray-500">
            {new Date(invoice.createdAt).toLocaleDateString('ar-SA')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className={cn(
          'text-sm font-medium px-2 py-1 rounded',
          statusColors[invoice.status || ''] || 'text-gray-600 bg-gray-50'
        )}>
          {statusLabels[invoice.status || ''] || invoice.status}
        </span>

        <span className="font-bold text-gray-900">
          {invoice.amount} {invoice.currency}
        </span>

        {invoice.invoicePdfUrl && (
          <a
            href={invoice.invoicePdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80"
          >
            <Download className="w-5 h-5" />
          </a>
        )}
      </div>
    </div>
  )
}
