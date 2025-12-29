'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageLoadingSkeleton } from '@/components/shared'
import { SubscriptionGate } from '@/components/shared/SubscriptionGate'
import { ExamHistory } from '@/components/profile/ExamHistory'
import { PerformanceStats } from '@/components/performance/PerformanceStats'
import { PerformanceFilters } from '@/components/performance/PerformanceFilters'
import { TrendChart, type TrendDataPoint } from '@/components/analytics'
import { ExportOptionsModal } from '@/components/exam/ExportOptionsModal'
import {
  ArrowRight,
  BarChart3,
  Download,
  Crown,
  AlertCircle,
} from 'lucide-react'

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

export default function PerformancePage() {
  const router = useRouter()
  const [examHistory, setExamHistory] = useState<ExamHistoryItem[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPremium, setIsPremium] = useState(false)

  // Filters
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('all')
  const [trackFilter, setTrackFilter] = useState<'all' | 'scientific' | 'literary'>('all')
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100])

  // Export modal
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [isRetaking, setIsRetaking] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, performanceRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/profile/performance'),
      ])

      // Check subscription status
      const profileData = await profileRes.json()
      if (profileRes.ok && profileData.subscription) {
        setIsPremium(
          profileData.subscription.tier === 'premium' &&
          ['active', 'trialing'].includes(profileData.subscription.status)
        )
      }

      // Get performance data
      if (performanceRes.ok) {
        const performanceData = await performanceRes.json()
        setPerformanceData(performanceData)

        // Transform exam history
        if (performanceData.examHistory) {
          const historyItems: ExamHistoryItem[] = performanceData.examHistory.map(
            (item: TrendDataPoint & { id?: string; timeSpentMinutes?: number; track?: string }) => ({
              id: item.id || `exam-${item.date}`,
              date: item.date,
              verbal: item.verbal,
              quantitative: item.quantitative,
              overall: item.overall,
              timeSpentMinutes: item.timeSpentMinutes,
              track: item.track as 'scientific' | 'literary',
            })
          )
          setExamHistory(historyItems)
        }
      } else {
        throw new Error('فشل في تحميل بيانات الأداء')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleRetake = async (examId: string) => {
    try {
      setIsRetaking(true)
      const response = await fetch('/api/exams/retake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceExamId: examId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إنشاء الاختبار')
      }

      router.push(`/exam/${data.sessionId}`)
    } catch (err) {
      console.error('Retake error:', err)
      alert(err instanceof Error ? err.message : 'فشل في إنشاء الاختبار')
    } finally {
      setIsRetaking(false)
    }
  }

  const handleExportClick = (examId: string) => {
    setSelectedExamId(examId)
    setExportModalOpen(true)
  }

  const handleExport = async (format: 'json' | 'pdf', includeQuestions: boolean) => {
    if (!selectedExamId) return

    try {
      const response = await fetch(
        `/api/exams/${selectedExamId}/export?format=${format}&includeQuestions=${includeQuestions}`
      )

      if (!response.ok) {
        const data = await response.json()
        if (data.upgradeRequired) {
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
      a.download = `exam-${selectedExamId.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
      alert(err instanceof Error ? err.message : 'فشل في تصدير النتائج')
    }
  }

  // Filter exam history
  const filteredHistory = examHistory.filter((exam) => {
    // Date filter
    if (dateRange !== 'all') {
      const examDate = new Date(exam.date)
      const now = new Date()
      const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      if (examDate < cutoffDate) return false
    }

    // Track filter
    if (trackFilter !== 'all' && exam.track !== trackFilter) {
      return false
    }

    // Score range filter
    if (exam.overall < scoreRange[0] || exam.overall > scoreRange[1]) {
      return false
    }

    return true
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <PageLoadingSkeleton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6" dir="rtl">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-600 mb-4">حدث خطأ</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/dashboard')}>
            العودة للوحة التحكم
          </Button>
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">الأداء والإحصائيات</h1>
              <p className="text-gray-500 mt-1">
                تتبع تقدمك وحلل أداءك في الاختبارات
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" className="gap-2">
                <ArrowRight className="w-4 h-4" />
                العودة للوحة التحكم
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Performance Stats Overview */}
        {performanceData && (
          <PerformanceStats
            totalExams={performanceData.totalExams}
            totalQuestions={performanceData.totalQuestions}
            totalCorrect={performanceData.totalCorrect}
            weeklyExamCount={performanceData.weeklyExamCount}
            averageScore={
              examHistory.length > 0
                ? examHistory.reduce((sum, e) => sum + e.overall, 0) / examHistory.length
                : 0
            }
            bestScore={examHistory.length > 0 ? Math.max(...examHistory.map(e => e.overall)) : 0}
            className="mb-6"
          />
        )}

        {/* Trend Chart - Premium */}
        <SubscriptionGate
          requiredTier="premium"
          fallback={
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-gray-900">تطور الأداء</h2>
                </div>
                <div className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                  <Crown className="w-3 h-3" />
                  <span>مميز</span>
                </div>
              </div>
              <TrendChart
                data={performanceData?.examHistory || []}
                isLocked={true}
                onUnlockClick={() => router.push('/settings#subscription')}
              />
            </div>
          }
        >
          {performanceData && performanceData.examHistory.length >= 2 && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-gray-900">تطور الأداء</h2>
              </div>
              <TrendChart
                data={performanceData.examHistory}
                height={300}
                showVerbal={true}
                showQuantitative={true}
                showOverall={true}
              />
            </div>
          )}
        </SubscriptionGate>

        {/* Filters */}
        <PerformanceFilters
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          trackFilter={trackFilter}
          onTrackFilterChange={setTrackFilter}
          scoreRange={scoreRange}
          onScoreRangeChange={setScoreRange}
          className="mb-6"
        />

        {/* Exam History Table */}
        <ExamHistory
          history={filteredHistory}
          maxItems={20}
          variant="full"
          showActions={true}
          onRetake={handleRetake}
          onExport={handleExportClick}
          className="mb-6"
        />

        {/* No results message */}
        {filteredHistory.length === 0 && examHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-500">لا توجد نتائج تطابق الفلاتر المحددة</p>
            <Button
              variant="outline"
              onClick={() => {
                setDateRange('all')
                setTrackFilter('all')
                setScoreRange([0, 100])
              }}
              className="mt-4"
            >
              إعادة تعيين الفلاتر
            </Button>
          </div>
        )}

        {/* Bulk Export - Premium */}
        <SubscriptionGate requiredTier="premium">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">تصدير جميع البيانات</h3>
                <p className="text-sm text-gray-500 mt-1">
                  قم بتنزيل سجل كامل لجميع اختباراتك بصيغة JSON
                </p>
              </div>
              <Link href="/api/profile/export">
                <Button className="gap-2">
                  <Download className="w-4 h-4" />
                  تصدير الكل
                </Button>
              </Link>
            </div>
          </div>
        </SubscriptionGate>
      </main>

      {/* Export Modal */}
      {selectedExamId && (
        <ExportOptionsModal
          open={exportModalOpen}
          onOpenChange={setExportModalOpen}
          examId={selectedExamId}
          isPremium={isPremium}
          onExport={handleExport}
        />
      )}

      {/* Loading overlay */}
      {isRetaking && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">جاري إنشاء الاختبار...</span>
          </div>
        </div>
      )}
    </div>
  )
}
