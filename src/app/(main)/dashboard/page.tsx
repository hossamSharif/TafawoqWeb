'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OnboardingTutorial } from '@/components/shared/OnboardingTutorial'
import { CreditsDisplay } from '@/components/subscription/CreditsDisplay'
import { CreditBalance } from '@/components/rewards/CreditBalance'
import { FileText, Target, TrendingUp, Clock, Award, ChevronLeft, Library } from 'lucide-react'
import { brand } from '@/lib/brand'
import type { UserLimits } from '@/types/subscription'

export default function DashboardPage() {
  const { profile, subscription, isLoading, user } = useAuth()
  const [showTutorial, setShowTutorial] = useState(false)
  const [limits, setLimits] = useState<UserLimits | null>(null)
  const [limitsLoading, setLimitsLoading] = useState(true)

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

  const handleTutorialComplete = () => {
    localStorage.setItem('tutorialCompleted', 'true')
    setShowTutorial(false)
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
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">مرحباً بك في {brand.name.arabic}</h1>
          <p className="text-muted-foreground">
            المسار: <span className="font-medium text-foreground">{trackLabel}</span>
          </p>
        </div>

        {/* Credits and Limits Display */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* User Limits */}
          {limits && (
            <CreditsDisplay
              limits={limits}
              isLoading={limitsLoading}
              showShareCredits={true}
            />
          )}

          {/* Reward Credits */}
          {limits && (limits.rewards.examCredits > 0 || limits.rewards.practiceCredits > 0) && (
            <CreditBalance
              examCredits={limits.rewards.examCredits}
              practiceCredits={limits.rewards.practiceCredits}
              showRedeemButtons={false}
            />
          )}
        </div>

        {/* Quick Actions */}
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
                  <p className="text-2xl font-bold">--</p>
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
                  <p className="text-2xl font-bold">{profile?.total_practice_hours || 0}</p>
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
      </div>
    </>
  )
}
