'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageLoadingSkeleton } from '@/components/shared'
import { SubscriptionGate } from '@/components/shared/SubscriptionGate'
import {
  ScoreDisplay,
  StrengthsWeaknesses,
  TrendChart,
  PracticeShortcut,
  type TrendDataPoint,
} from '@/components/analytics'
import { getScoreColor, getScoreLabel, formatTimeArabic } from '@/lib/utils/scoring'
import {
  User,
  Mail,
  BookOpen,
  Clock,
  TrendingUp,
  Crown,
  Settings,
  ChevronLeft,
  Calendar,
  Target,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileData {
  id: string
  email: string
  academicTrack: 'scientific' | 'literary'
  subscriptionTier: 'free' | 'premium'
  onboardingCompleted: boolean
  totalPracticeHours: number
  lastExamScores: {
    verbal: number
    quantitative: number
    overall: number
  } | null
  createdAt: string
}

interface PerformanceData {
  examHistory: TrendDataPoint[]
  categoryScores: Record<string, number>
  totalExams: number
  totalQuestions: number
  totalCorrect: number
  weeklyExamCount: number
  strengths: string[]
  weaknesses: string[]
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [performance, setPerformance] = useState<PerformanceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch profile and performance data in parallel
        const [profileRes, performanceRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/profile/performance'),
        ])

        const profileData = await profileRes.json()

        if (!profileRes.ok) {
          throw new Error(profileData.error || 'فشل في تحميل الملف الشخصي')
        }

        setProfile(profileData)

        // Performance data is optional
        if (performanceRes.ok) {
          const performanceData = await performanceRes.json()
          setPerformance(performanceData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <PageLoadingSkeleton />
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6" dir="rtl">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">حدث خطأ</h2>
          <p className="text-gray-600 mb-6">{error || 'لم يتم العثور على الملف الشخصي'}</p>
          <Button onClick={() => router.push('/dashboard')}>
            العودة للوحة التحكم
          </Button>
        </div>
      </div>
    )
  }

  const practiceHoursFormatted = formatTimeArabic(profile.totalPracticeHours * 3600)
  const memberSince = new Date(profile.createdAt).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">الملف الشخصي</h1>
                <p className="text-gray-500 text-sm">{profile.email}</p>
              </div>
            </div>
            <Link href="/settings">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                الإعدادات
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">معلومات الحساب</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                  <p className="font-medium">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">المسار الأكاديمي</p>
                  <p className="font-medium">
                    {profile.academicTrack === 'scientific' ? 'علمي' : 'أدبي'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Crown className={cn(
                  'w-5 h-5',
                  profile.subscriptionTier === 'premium' ? 'text-yellow-500' : 'text-gray-400'
                )} />
                <div>
                  <p className="text-sm text-gray-500">الاشتراك</p>
                  <p className="font-medium">
                    {profile.subscriptionTier === 'premium' ? 'مميز' : 'مجاني'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">عضو منذ</p>
                  <p className="font-medium">{memberSince}</p>
                </div>
              </div>
            </div>
          </div>

          {profile.subscriptionTier === 'free' && (
            <div className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">ترقية للمميز</h3>
                  <p className="text-sm text-gray-600">احصل على اختبارات غير محدودة وتحليلات متقدمة</p>
                </div>
                <Link href="/settings#subscription">
                  <Button size="sm" className="gap-1">
                    ترقية الآن
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Last Exam Scores */}
        {profile.lastExamScores && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-gray-900">نتائج آخر اختبار</h2>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              {/* Overall Score */}
              <div className="text-center">
                <ScoreDisplay
                  score={profile.lastExamScores.overall}
                  label="الإجمالي"
                  size="xl"
                />
              </div>

              {/* Section Scores */}
              <div className="flex gap-6">
                <div className="text-center">
                  <ScoreDisplay
                    score={profile.lastExamScores.quantitative}
                    label="كمي"
                    size="md"
                  />
                </div>
                <div className="text-center">
                  <ScoreDisplay
                    score={profile.lastExamScores.verbal}
                    label="لفظي"
                    size="md"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Practice Stats */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-gray-900">إحصائيات التدريب</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary">
                {profile.totalPracticeHours.toFixed(1)}
              </p>
              <p className="text-sm text-gray-500">ساعات التدريب</p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary">
                {performance?.totalExams || 0}
              </p>
              <p className="text-sm text-gray-500">اختبارات مكتملة</p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary">
                {performance?.totalQuestions || 0}
              </p>
              <p className="text-sm text-gray-500">أسئلة مجابة</p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary">
                {performance?.totalQuestions
                  ? Math.round((performance.totalCorrect / performance.totalQuestions) * 100)
                  : 0}%
              </p>
              <p className="text-sm text-gray-500">معدل الصحة</p>
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        {performance && (performance.strengths.length > 0 || performance.weaknesses.length > 0) && (
          <div className="mb-6">
            <StrengthsWeaknesses
              strengths={performance.strengths}
              weaknesses={performance.weaknesses}
              maxItems={3}
              variant="card"
            />
          </div>
        )}

        {/* Practice Shortcuts for Weak Areas */}
        {performance && performance.weaknesses.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <PracticeShortcut
              weakAreas={performance.weaknesses}
              maxItems={3}
              variant="card"
            />
          </div>
        )}

        {/* Trend Chart - Premium Only */}
        <SubscriptionGate
          requiredTier="premium"
          fallback={
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-gray-900">تطور الأداء</h2>
              </div>
              <TrendChart
                data={performance?.examHistory || []}
                isLocked={true}
                onUnlockClick={() => router.push('/settings#subscription')}
              />
            </div>
          }
        >
          {performance && performance.examHistory.length >= 2 && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-gray-900">تطور الأداء</h2>
              </div>
              <TrendChart
                data={performance.examHistory}
                height={300}
                showVerbal={true}
                showQuantitative={true}
                showOverall={true}
              />
            </div>
          )}
        </SubscriptionGate>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              العودة للوحة التحكم
            </Button>
          </Link>
          <Link href="/settings">
            <Button size="lg" className="gap-2">
              <Settings className="w-4 h-4" />
              إدارة الإعدادات
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
