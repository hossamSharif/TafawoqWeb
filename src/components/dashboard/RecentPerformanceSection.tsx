'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExamHistory } from '@/components/profile/ExamHistory'
import { PerformanceInsights } from './PerformanceInsights'
import { Loader2, AlertCircle } from 'lucide-react'

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

export function RecentPerformanceSection() {
  const router = useRouter()
  const [examHistory, setExamHistory] = useState<ExamHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRetaking, setIsRetaking] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    fetchExamHistory()
  }, [])

  async function fetchExamHistory() {
    try {
      const response = await fetch('/api/profile/performance')
      if (!response.ok) {
        throw new Error('فشل في تحميل سجل الاختبارات')
      }

      const data = await response.json()

      // Transform exam history data
      if (data.examHistory) {
        const historyItems: ExamHistoryItem[] = data.examHistory.map(
          (item: {
            id?: string
            date: string
            verbal: number
            quantitative: number
            overall: number
            timeSpentMinutes?: number
          }) => ({
            id: item.id || `exam-${item.date}`,
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
      setError(err instanceof Error ? err.message : 'حدث خطأ')
      console.error('Error fetching exam history:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRetake(examId: string) {
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
        // Handle error
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

  async function handleExport(examId: string) {
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="mr-2 text-gray-600">جاري التحميل...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (examHistory.length === 0) {
    return null // Don't show section if no exams
  }

  return (
    <div className="space-y-6">
      {/* Performance Insights Widget */}
      <PerformanceInsights examHistory={examHistory} />

      {/* Recent Exam History */}
      <ExamHistory
        history={examHistory}
        maxItems={5}
        variant="compact"
        showActions={true}
        onRetake={handleRetake}
        onExport={handleExport}
      />

      {/* Loading overlay */}
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
  )
}
