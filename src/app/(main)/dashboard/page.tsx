'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useInvalidateLimits } from '@/hooks/useSubscriptionLimits'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OnboardingTutorial } from '@/components/shared/OnboardingTutorial'
import { MaintenanceBanner } from '@/components/shared/MaintenanceBanner'
import { MySessionsSection } from '@/components/dashboard/MySessionsSection'
import { PerformanceInsights } from '@/components/dashboard/PerformanceInsights'
import { ExamHistory, PracticeHistory } from '@/components/profile'
import { FileText, Target, TrendingUp, Clock, Award, ChevronLeft, Library, Loader2, RefreshCw } from 'lucide-react'
import { brand } from '@/lib/brand'
import type { UserLimits } from '@/types/subscription'

interface ExamHistoryItem {
  id: string
  date: string
  verbal: number
  quantitative: number
  overall: number
  timeSpentMinutes?: number
  track?: 'scientific' | 'literary'
  total_questions?: number
  questions?: Array<{
    section?: string
    difficulty?: string
    topic?: string
  }>
  isShared?: boolean
  isLibraryExam?: boolean
}

interface PracticeHistoryItem {
  id: string
  date: string
  section: 'verbal' | 'quantitative'
  sectionLabel: string
  categories: string[]
  categoryLabels: string[]
  difficulty: string
  difficultyLabel: string
  questionCount: number
  score: number
  timeSpentSeconds?: number
  timeSpentFormatted?: string
  isShared?: boolean
}

export default function DashboardPage() {
  const { profile, subscription, isLoading, user, refreshSubscription } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const invalidateLimits = useInvalidateLimits()
  const [showTutorial, setShowTutorial] = useState(false)
  const [limits, setLimits] = useState<UserLimits | null>(null)
  const [limitsLoading, setLimitsLoading] = useState(true)
  const [showMaintenanceBanner, setShowMaintenanceBanner] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState<string | null>(null)
  const [examHistory, setExamHistory] = useState<ExamHistoryItem[]>([])
  const [practiceHistory, setPracticeHistory] = useState<PracticeHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [isRetaking, setIsRetaking] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [totalPracticeHours, setTotalPracticeHours] = useState<number>(0)
  const [lastResult, setLastResult] = useState<number | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentProcessingMessage, setPaymentProcessingMessage] = useState('')
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [showSkipButton, setShowSkipButton] = useState(false)

  // Check for maintenance redirect params
  useEffect(() => {
    const isMaintenance = searchParams.get('maintenance') === 'true'
    const message = searchParams.get('message')

    if (isMaintenance) {
      setShowMaintenanceBanner(true)
      setMaintenanceMessage(message)

      // Clear URL params after showing banner
      const url = new URL(window.location.href)
      url.searchParams.delete('maintenance')
      url.searchParams.delete('message')
      url.searchParams.delete('blocked_operation')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  useEffect(() => {
    // Show tutorial for first-time users
    if (profile && !localStorage.getItem('tutorialCompleted')) {
      setShowTutorial(true)
    }
  }, [profile])

  const fetchLimits = useCallback(async () => {
    if (!user) {
      setLimitsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/subscription/limits')
      if (response.ok) {
        const data = await response.json()
        setLimits(data)
      }
    } catch (error) {
      console.error('Error fetching limits:', error)
    } finally {
      setLimitsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchLimits()
  }, [fetchLimits])

  // Check for payment success redirect and refetch subscription with polling
  useEffect(() => {
    const subscriptionStatus = searchParams.get('subscription')

    // Guard: Only run if we have the success param, user exists, and not already polling
    if (subscriptionStatus === 'success' && user && !isPolling) {
      console.log('[Dashboard] 🎉 Payment success detected! User ID:', user.id)
      console.log('[Dashboard] Starting webhook polling...')

      setIsPolling(true)
      setIsProcessingPayment(true)
      setPaymentProcessingMessage('جاري تحديث اشتراكك...')
      setShowSkipButton(false)

      // Show skip button after 10 seconds
      const skipButtonTimer = setTimeout(() => {
        console.log('[Dashboard] Showing skip button after 10 seconds')
        setShowSkipButton(true)
      }, 10000)

      // Poll database until subscription is updated to premium
      const pollForPremiumStatus = async () => {
        try {
        const maxRetries = 10 // Poll up to 10 times
        const delayBetweenRetries = 2000 // 2 seconds between each poll

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`[Dashboard] Poll attempt ${attempt}/${maxRetries}...`)
            setPaymentProcessingMessage(`جاري التحقق من الدفع... (${attempt}/${maxRetries})`)

            // Wait before checking (first attempt waits 2 seconds, subsequent wait 2s each)
            await new Promise(resolve => setTimeout(resolve, delayBetweenRetries))

            // Double-check user still exists
            if (!user?.id) {
              console.error('[Dashboard] User ID is missing! Aborting poll.')
              break
            }

            // Fetch fresh subscription data directly from Supabase
            console.log('[Dashboard] Fetching subscription from database for user:', user.id)
            const { data: freshSubscription, error } = await supabase
              .from('user_subscriptions')
              .select('*')
              .eq('user_id', user.id)
              .single<{ tier: string; status: string }>()

            if (error) {
              if (error.code === 'PGRST116') {
                console.log('[Dashboard] No subscription found yet (still free tier), retrying...')
              } else {
                console.error('[Dashboard] Error fetching subscription:', error)
              }
              continue
            }

            console.log('[Dashboard] Fresh subscription data:', freshSubscription)

            // Check if we got premium status
            if (freshSubscription?.tier === 'premium' && freshSubscription?.status === 'active') {
              console.log('[Dashboard] ✅ Premium status confirmed! Refreshing limits...')
              setPaymentProcessingMessage('تم التحديث! جاري تحميل البيانات...')

              // Refresh limits to show premium counters
              await invalidateLimits()
              await fetchLimits()

              console.log('[Dashboard] ✅ All data refreshed successfully!')
              setPaymentProcessingMessage('تم بنجاح! 🎉')

              // Wait a moment to show success message
              await new Promise(resolve => setTimeout(resolve, 1000))

              // Clear skip button timer and URL params
              clearTimeout(skipButtonTimer)
              const url = new URL(window.location.href)
              url.searchParams.delete('subscription')
              window.history.replaceState({}, '', url.toString())
              setIsProcessingPayment(false)
              setIsPolling(false)
              setShowSkipButton(false)

              return // Success!
            }

            console.log(`[Dashboard] Subscription not premium yet (tier: ${freshSubscription?.tier}, status: ${freshSubscription?.status}), retrying...`)
          } catch (error) {
            console.error(`[Dashboard] Error during poll attempt ${attempt}:`, error)
            // Continue to next attempt
          }
        }

        // If we get here, polling timed out after 20 seconds
        console.error('[Dashboard] ❌ Webhook timeout! Subscription not updated after 20 seconds.')
        console.error('[Dashboard] Webhook might be slow or Stripe webhook not configured.')
        console.log('[Dashboard] Dismissing loading and showing dashboard. Subscription will update automatically.')

        setPaymentProcessingMessage('يتم التحميل...')

        // Force one final refresh attempt
        try {
          await refreshSubscription()
          await invalidateLimits()
          await fetchLimits()
        } catch (error) {
          console.error('[Dashboard] Final refresh failed:', error)
        }

        // Show brief message then dismiss
        setPaymentProcessingMessage('جاري تحميل لوحة التحكم...')
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Clear URL param and hide loading - show dashboard
        clearTimeout(skipButtonTimer)
        const url = new URL(window.location.href)
        url.searchParams.delete('subscription')
        window.history.replaceState({}, '', url.toString())
        setIsProcessingPayment(false)
        setIsPolling(false)
        setShowSkipButton(false)

        console.log('[Dashboard] Loading dismissed. Dashboard visible. Subscription will auto-update with staleTime.')
        } catch (error) {
          console.error('[Dashboard] Polling error:', error)
          // Ensure cleanup on error
          clearTimeout(skipButtonTimer)
          setIsProcessingPayment(false)
          setIsPolling(false)
          setShowSkipButton(false)
        }
      }

      pollForPremiumStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user])

  // Refetch limits when window gains focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      invalidateLimits()
      fetchLimits()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [invalidateLimits, fetchLimits])

  const fetchExamHistory = useCallback(async () => {
    if (!user) {
      setHistoryLoading(false)
      return
    }

    try {
      const response = await fetch('/api/profile/performance')
      if (!response.ok) {
        throw new Error('فشل في تحميل سجل الاختبارات')
      }

      const data = await response.json()

      // Set total practice hours and last result
      setTotalPracticeHours(data.totalPracticeHours || 0)
      setLastResult(data.lastResult)

      // Transform exam history data
      if (data.examHistory) {
        const historyItems: ExamHistoryItem[] = data.examHistory
          .filter((item: any) => item.id) // Only include items with valid IDs
          .map(
            (item: {
              id: string
              date: string
              verbal: number
              quantitative: number
              overall: number
              timeSpentMinutes?: number
            }) => ({
              id: item.id,
              date: item.date,
              verbal: item.verbal,
              quantitative: item.quantitative,
              overall: item.overall,
              timeSpentMinutes: item.timeSpentMinutes,
            })
          )
        setExamHistory(historyItems)
      }
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'حدث خطأ')
      console.error('Error fetching exam history:', err)
    } finally {
      setHistoryLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchExamHistory()
    fetchPracticeHistory()
  }, [fetchExamHistory])

  const fetchPracticeHistory = useCallback(async () => {
    if (!user) {
      return
    }

    try {
      const response = await fetch('/api/practice/history?limit=5')
      if (!response.ok) {
        throw new Error('فشل في تحميل سجل التمارين')
      }

      const data = await response.json()

      // Transform practice history data
      if (data.sessions) {
        const historyItems: PracticeHistoryItem[] = data.sessions.map(
          (session: any) => ({
            id: session.id,
            date: session.completedAt || session.startedAt,
            section: session.section,
            sectionLabel: session.sectionLabel,
            categories: session.categories,
            categoryLabels: session.categoryLabels,
            difficulty: session.difficulty,
            difficultyLabel: session.difficultyLabel,
            questionCount: session.questionCount,
            score: session.result?.score || 0,
            timeSpentSeconds: session.timeSpentSeconds,
            timeSpentFormatted: session.timeSpentFormatted,
            isShared: session.isShared,
          })
        )
        setPracticeHistory(historyItems)
      }
    } catch (err) {
      console.error('Error fetching practice history:', err)
    }
  }, [user])

  const handleTutorialComplete = () => {
    localStorage.setItem('tutorialCompleted', 'true')
    setShowTutorial(false)
  }

  const handleManualRefresh = async () => {
    if (!user || isManualRefreshing) return

    setIsManualRefreshing(true)
    console.log('[Dashboard] Manual refresh triggered by user')

    try {
      await refreshSubscription()
      await invalidateLimits()
      await fetchLimits()
      console.log('[Dashboard] Manual refresh complete')
    } catch (error) {
      console.error('[Dashboard] Manual refresh error:', error)
    } finally {
      setIsManualRefreshing(false)
    }
  }

  const handleSkipPaymentLoading = () => {
    console.log('[Dashboard] User skipped payment loading')
    const url = new URL(window.location.href)
    url.searchParams.delete('subscription')
    window.history.replaceState({}, '', url.toString())
    setIsProcessingPayment(false)
    setIsPolling(false)
    setShowSkipButton(false)

    // Trigger manual refresh in background
    refreshSubscription()
    invalidateLimits()
    fetchLimits()
  }

  const handleRetake = async (examId: string) => {
    try {
      setIsRetaking(true)

      // Call retake API
      const response = await fetch('/api/exams/retake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceExamId: examId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إنشاء الاختبار')
      }

      // Redirect to the new exam
      router.push(`/exam/${data.sessionId}`)
    } catch (err) {
      console.error('Retake error:', err)
      alert(err instanceof Error ? err.message : 'فشل في إنشاء الاختبار')
    } finally {
      setIsRetaking(false)
    }
  }

  const handleExport = async (examId: string) => {
    try {
      setIsExporting(true)

      // Call export API (JSON format for now)
      const response = await fetch(`/api/exams/${examId}/export?format=json`)

      if (!response.ok) {
        const data = await response.json()
        if (data.upgradeRequired) {
          // Redirect to subscription page
          router.push('/settings#subscription')
          return
        }
        throw new Error(data.error || 'فشل في تصدير النتائج')
      }

      // Download the file
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `exam-${examId.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
      alert(err instanceof Error ? err.message : 'فشل في تصدير النتائج')
    } finally {
      setIsExporting(false)
    }
  }

  const handleShare = async (examId: string, data: { title: string; body: string }) => {
    try {
      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_type: 'exam_share',
          title: data.title,
          body: data.body,
          shared_exam_id: examId,
          is_library_visible: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.message || errorData.error || 'فشل في المشاركة'
        throw new Error(errorMessage)
      }

      // Refresh exam history to update shared status
      await fetchExamHistory()
    } catch (err) {
      console.error('Share error:', err)
      throw err // Re-throw to let the ShareExamModal handle the error
    }
  }

  const handlePracticeShare = async (practiceId: string, data: { title: string; body: string }) => {
    try {
      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_type: 'exam_share',
          title: data.title,
          body: data.body,
          shared_practice_id: practiceId,
          is_library_visible: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.message || errorData.error || 'فشل في المشاركة'
        throw new Error(errorMessage)
      }

      // Refresh practice history to update shared status
      await fetchPracticeHistory()
    } catch (err) {
      console.error('Practice share error:', err)
      throw err // Re-throw to let the ShareExamModal handle the error
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const isPremium = subscription?.tier === 'premium' && subscription?.status === 'active'
  const trackLabel = profile?.academic_track === 'scientific' ? 'علمي' : 'أدبي'

  return (
    <>
      {showTutorial && <OnboardingTutorial onComplete={handleTutorialComplete} />}

      <div className="space-y-6">
        {/* Maintenance Banner */}
        {showMaintenanceBanner && (
          <MaintenanceBanner
            message={maintenanceMessage}
            variant="inline"
            onDismiss={() => setShowMaintenanceBanner(false)}
          />
        )}

        {/* Welcome Section */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold">مرحباً بك في {brand.name.arabic}</h1>
          <p className="text-muted-foreground">
            المسار: <span className="font-medium text-foreground">{trackLabel}</span>
          </p>

          {/* Manual Refresh Button */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isManualRefreshing}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`h-3 w-3 ml-1 ${isManualRefreshing ? 'animate-spin' : ''}`} />
              {isManualRefreshing ? 'جاري التحديث...' : 'تحديث البيانات'}
            </Button>
          </div>
        </div>

        {/* 1. Analytics Section - Performance Insights */}
        {examHistory.length > 0 && (
          <PerformanceInsights examHistory={examHistory} />
        )}

        {/* 2. Quick Actions - Create Exam & Practice */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Start Full Exam */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">اختبار تجريبي كامل</CardTitle>
                  <CardDescription>96 سؤال في 120 دقيقة</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                اختبار يحاكي اختبار القدرات الحقيقي مع تغذية راجعة فورية بعد كل سؤال.
              </p>
              <Link href="/exam/start">
                <Button className="w-full" size="lg">
                  بدء الاختبار
                  <ChevronLeft className="h-4 w-4 mr-2" />
                </Button>
              </Link>
              {!isPremium && limits && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  متبقي لك {limits.generation.exams.remaining} اختبارات هذا الشهر
                </p>
              )}
            </CardContent>
          </Card>

          {/* Customized Practice */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-xl">تمارين مخصصة</CardTitle>
                  <CardDescription>اختر القسم والفئة والصعوبة</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                تدرب على مهارات محددة مع اختيار عدد الأسئلة ومستوى الصعوبة.
              </p>
              <Link href="/practice/new">
                <Button variant="outline" className="w-full" size="lg">
                  إنشاء تمرين
                  <ChevronLeft className="h-4 w-4 mr-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Exam Library */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Library className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">مكتبة الاختبارات</CardTitle>
                  <CardDescription>اختبارات من المجتمع</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                تصفح اختبارات أنشأها مستخدمون آخرون وشارك اختباراتك معهم.
              </p>
              <Link href="/library">
                <Button variant="outline" className="w-full" size="lg">
                  تصفح المكتبة
                  <ChevronLeft className="h-4 w-4 mr-2" />
                </Button>
              </Link>
              {!isPremium && limits && limits.library.accessLimit && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  متبقي لك {limits.library.accessLimit - limits.library.accessUsed} وصول للمكتبة
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 3. Active Sessions - Expandable Section */}
        <MySessionsSection />

        {/* 4. Exam History Section */}
        {!historyLoading && examHistory.length > 0 && (
          <ExamHistory
            history={examHistory}
            maxItems={5}
            variant="compact"
            showActions={true}
            onRetake={handleRetake}
            onExport={handleExport}
            onShare={handleShare}
          />
        )}

        {/* 5. Practice History Section */}
        {!historyLoading && practiceHistory.length > 0 && (
          <PracticeHistory
            history={practiceHistory}
            maxItems={5}
            variant="compact"
            showActions={true}
            onShare={handlePracticeShare}
          />
        )}

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">آخر نتيجة</p>
                  {historyLoading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                  ) : (
                    <p className="text-2xl font-bold">
                      {lastResult !== null ? `${lastResult}%` : '--'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ساعات التمرين</p>
                  {historyLoading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                  ) : (
                    <p className="text-2xl font-bold">{totalPracticeHours}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الاشتراك</p>
                  <p className="text-2xl font-bold">{isPremium ? 'مميز' : 'مجاني'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upgrade Banner (for free users) */}
        {!isPremium && (
          <Card className="bg-gradient-to-l from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold mb-1">ترقية إلى الحساب المميز</h3>
                  <p className="text-sm text-muted-foreground">
                    احصل على اختبارات غير محدودة وشروحات فورية وتحليل أداء متقدم
                  </p>
                </div>
                <Link href="/subscription">
                  <Button>
                    ترقية الآن - 49 ر.س/شهر
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading overlay for payment processing */}
        {isProcessingPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-8 shadow-2xl max-w-md w-full mx-4">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">جاري معالجة الدفع</h3>
                  <p className="text-muted-foreground">{paymentProcessingMessage}</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '70%' }} />
                </div>
                {showSkipButton && (
                  <Button
                    variant="outline"
                    onClick={handleSkipPaymentLoading}
                    className="mt-2"
                  >
                    تخطي والمتابعة إلى لوحة التحكم
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading overlay for retake/export */}
        {(isRetaking || isExporting) && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="font-medium">
                {isRetaking ? 'جاري إنشاء الاختبار...' : 'جاري التصدير...'}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
