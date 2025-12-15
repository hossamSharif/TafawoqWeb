'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageLoadingSkeleton } from '@/components/shared'
import { SubscriptionGate } from '@/components/shared/SubscriptionGate'
import {
  StrengthsWeaknesses,
  TrendChart,
  PracticeShortcut,
  type TrendDataPoint,
} from '@/components/analytics'
import {
  ProfileHeader,
  LastExamScores,
  PracticeHoursDisplay,
  AcademicTrackSwitcher,
  ExamHistory,
  DeleteAccountModal,
} from '@/components/profile'
import { RewardsSection } from '@/components/rewards'
import { SharingStats } from '@/components/forum/SharingStats'
import {
  Settings,
  BarChart3,
  Download,
  Trash2,
  Loader2,
} from 'lucide-react'

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

interface ExamHistoryItem {
  id: string
  date: string
  verbal: number
  quantitative: number
  overall: number
  timeSpentMinutes?: number
  track?: 'scientific' | 'literary'
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [performance, setPerformance] = useState<PerformanceData | null>(null)
  const [examHistoryData, setExamHistoryData] = useState<ExamHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const fetchData = useCallback(async () => {
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

      // Transform API response to expected shape
      const transformedProfile: ProfileData = {
        id: profileData.profile?.id || '',
        email: profileData.profile?.email || '',
        academicTrack: profileData.profile?.academic_track || 'scientific',
        subscriptionTier: profileData.subscription?.tier || 'free',
        onboardingCompleted: profileData.profile?.onboarding_completed || false,
        totalPracticeHours: profileData.profile?.total_practice_hours || 0,
        lastExamScores: profileData.analytics ? {
          verbal: profileData.analytics.last_exam_verbal_score,
          quantitative: profileData.analytics.last_exam_quantitative_score,
          overall: profileData.analytics.last_exam_overall_average,
        } : null,
        createdAt: profileData.profile?.created_at || new Date().toISOString(),
      }

      setProfile(transformedProfile)

      // Performance data is optional
      if (performanceRes.ok) {
        const performanceData = await performanceRes.json()
        setPerformance(performanceData)

        // Transform exam history for ExamHistory component
        if (performanceData.examHistory) {
          const historyItems: ExamHistoryItem[] = performanceData.examHistory.map(
            (item: TrendDataPoint & { id?: string; timeSpentMinutes?: number }) => ({
              id: item.id || `exam-${item.date}`,
              date: item.date,
              verbal: item.verbal,
              quantitative: item.quantitative,
              overall: item.overall,
              timeSpentMinutes: item.timeSpentMinutes,
            })
          )
          setExamHistoryData(historyItems)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleTrackChange = async (newTrack: 'scientific' | 'literary') => {
    const response = await fetch('/api/profile/track', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track: newTrack }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'فشل تغيير المسار')
    }

    // Update local state
    if (profile) {
      setProfile({ ...profile, academicTrack: newTrack })
    }
  }

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/profile/export')

      if (!response.ok) {
        const data = await response.json()
        if (data.upgradeRequired) {
          router.push('/settings#subscription')
          return
        }
        throw new Error(data.error || 'فشل تصدير البيانات')
      }

      // Download the file
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tafawoq-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
      alert(err instanceof Error ? err.message : 'فشل تصدير البيانات')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async (email: string, reason?: string) => {
    const response = await fetch('/api/profile/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmEmail: email, reason }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'فشل جدولة حذف الحساب')
    }
  }

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
            <div>
              <h1 className="text-xl font-bold text-gray-900">الملف الشخصي</h1>
              <p className="text-gray-500 text-sm">{profile.email}</p>
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
        {/* Profile Header */}
        <ProfileHeader
          email={profile.email}
          academicTrack={profile.academicTrack}
          subscriptionTier={profile.subscriptionTier}
          memberSince={memberSince}
          className="mb-6"
        />

        {/* Upgrade Banner (Free users only) */}
        {profile.subscriptionTier === 'free' && (
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">ترقية للمميز</h3>
              <p className="text-sm text-gray-600">احصل على اختبارات غير محدودة وتحليلات متقدمة</p>
            </div>
            <Link href="/settings#subscription">
              <Button size="sm">ترقية الآن</Button>
            </Link>
          </div>
        )}

        {/* Rewards Section */}
        <RewardsSection className="mb-6" />

        {/* Sharing Stats */}
        {profile.id && (
          <SharingStats userId={profile.id} className="mb-6" />
        )}

        {/* Last Exam Scores */}
        <LastExamScores
          scores={profile.lastExamScores}
          className="mb-6"
        />

        {/* Practice Stats */}
        <PracticeHoursDisplay
          stats={{
            totalPracticeHours: profile.totalPracticeHours,
            totalExams: performance?.totalExams || 0,
            totalQuestions: performance?.totalQuestions || 0,
            totalCorrect: performance?.totalCorrect || 0,
            weeklyExamCount: performance?.weeklyExamCount,
          }}
          className="mb-6"
        />

        {/* Academic Track Switcher */}
        <AcademicTrackSwitcher
          currentTrack={profile.academicTrack}
          onTrackChange={handleTrackChange}
          className="mb-6"
        />

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

        {/* Exam History */}
        <ExamHistory
          history={examHistoryData}
          maxItems={5}
          className="mb-6"
        />

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

        {/* Data Management Section (Premium) */}
        <SubscriptionGate requiredTier="premium">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">إدارة البيانات</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleExportData}
                disabled={isExporting}
                className="gap-2 flex-1"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري التصدير...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    تصدير بياناتي
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              قم بتحميل جميع بياناتك بصيغة JSON وفقاً لنظام حماية البيانات الشخصية
            </p>
          </div>
        </SubscriptionGate>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-red-100">
          <h2 className="text-lg font-bold text-red-600 mb-4">منطقة الخطر</h2>
          <p className="text-sm text-gray-600 mb-4">
            حذف الحساب سيؤدي إلى إزالة جميع بياناتك بشكل نهائي. يتم جدولة الحذف خلال 30 يوماً ويمكنك إلغاؤه في أي وقت.
          </p>
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(true)}
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            حذف الحساب
          </Button>
        </div>

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

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        userEmail={profile.email}
        hasActiveSubscription={profile.subscriptionTier === 'premium'}
        onConfirmDelete={handleDeleteAccount}
      />
    </div>
  )
}
