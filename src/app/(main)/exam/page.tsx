'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Target, Clock, BookOpen, Plus, ChevronLeft, Play, Pause } from 'lucide-react'
import { ExamHistory } from '@/components/profile/ExamHistory'
import { ExamInstructionsModal } from '@/components/exam'

interface ExamSession {
  id: string
  status: 'in_progress' | 'paused' | 'completed' | 'abandoned'
  track: 'scientific' | 'literary'
  total_questions: number
  questions_answered: number
  start_time: string
  end_time?: string
  verbal_score?: number
  quantitative_score?: number
  overall_score?: number
  time_spent_seconds?: number
}

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

const trackLabels = {
  scientific: 'علمي',
  literary: 'أدبي',
}

export default function ExamPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<ExamSession[]>([])
  const [examHistory, setExamHistory] = useState<ExamHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInstructionsModal, setShowInstructionsModal] = useState(false)

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true)
      const [allSessionsRes, completedSessionsRes] = await Promise.all([
        fetch('/api/exams?limit=20'),
        fetch('/api/exams?status=completed&limit=20')
      ])

      if (!allSessionsRes.ok) {
        throw new Error('فشل في جلب الجلسات')
      }

      const allSessionsData = await allSessionsRes.json()
      setSessions(allSessionsData.sessions || [])

      // Fetch and transform exam history
      if (completedSessionsRes.ok) {
        const completedData = await completedSessionsRes.json()
        if (completedData.sessions) {
          const historyItems: ExamHistoryItem[] = completedData.sessions
            .filter((session: ExamSession) => session.status === 'completed')
            .map((session: ExamSession) => ({
              id: session.id,
              date: session.end_time || session.start_time,
              verbal: session.verbal_score || 0,
              quantitative: session.quantitative_score || 0,
              overall: session.overall_score || 0,
              timeSpentMinutes: session.time_spent_seconds ? Math.round(session.time_spent_seconds / 60) : undefined,
              track: session.track,
              total_questions: session.total_questions,
              isShared: false, // Will be updated from forum posts if needed
              isLibraryExam: false, // Personal exams are not library exams
            }))
          setExamHistory(historyItems)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ غير متوقع')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const handleExamShare = async (examId: string, data: { title: string; body: string }) => {
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

      // Refresh sessions to update shared status
      await fetchSessions()
    } catch (err) {
      console.error('Exam share error:', err)
      throw err
    }
  }

  const handleRetake = async (examId: string) => {
    try {
      const response = await fetch('/api/exams/retake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'فشل في إعادة الاختبار')
      }

      const data = await response.json()
      router.push(`/exam/${data.session.id}`)
    } catch (err) {
      console.error('Retake error:', err)
      setError(err instanceof Error ? err.message : 'خطأ في إعادة الاختبار')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const pausedSessions = sessions.filter(s => s.status === 'paused')
  const inProgressSessions = sessions.filter(s => s.status === 'in_progress')
  const activeSessions = [...inProgressSessions, ...pausedSessions]
  const completedCount = sessions.filter(s => s.status === 'completed').length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الاختبارات التجريبية</h1>
          <p className="text-muted-foreground">
            اختبارات كاملة محاكية لاختبار القدرات مع تقييم شامل
          </p>
        </div>
        <Button onClick={() => setShowInstructionsModal(true)}>
          <Plus className="h-4 w-4 ml-2" />
          اختبار جديد
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الاختبارات</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/10">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الاختبارات المكتملة</p>
                <p className="text-2xl font-bold">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">جلسات متوقفة</p>
                <p className="text-2xl font-bold">{activeSessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      {/* Paused Sessions */}
      {pausedSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>جلسات متوقفة مؤقتاً</CardTitle>
            <CardDescription>استأنف اختبارك من حيث توقفت</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pausedSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/exam/${session.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-amber-500/10">
                      <Pause className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        اختبار {trackLabels[session.track]}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.questions_answered} من {session.total_questions} سؤال
                        {session.time_spent_seconds && (
                          <> • {Math.round(session.time_spent_seconds / 60)} دقيقة</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">
                      متوقف مؤقتاً
                    </span>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* In Progress Sessions */}
      {inProgressSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>جلسات قيد التقدم</CardTitle>
            <CardDescription>استمر في الاختبار الحالي</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inProgressSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/exam/${session.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-blue-500/10">
                      <Play className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        اختبار {trackLabels[session.track]}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.questions_answered} من {session.total_questions} سؤال
                        {session.time_spent_seconds && (
                          <> • {Math.round(session.time_spent_seconds / 60)} دقيقة</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                      قيد التقدم
                    </span>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exam History with Sharing */}
      {examHistory.length > 0 ? (
        <ExamHistory
          history={examHistory}
          maxItems={20}
          variant="full"
          showActions={true}
          onShare={handleExamShare}
          onRetake={handleRetake}
        />
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">لم تكمل أي اختبارات بعد</p>
              <Button onClick={() => setShowInstructionsModal(true)}>
                <Plus className="h-4 w-4 ml-2" />
                ابدأ اختبارك الأول
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back Button */}
      <div className="text-center">
        <Button variant="ghost" onClick={() => router.push('/dashboard')}>
          العودة للرئيسية
        </Button>
      </div>

      {/* Exam Instructions Modal */}
      <ExamInstructionsModal
        open={showInstructionsModal}
        onOpenChange={setShowInstructionsModal}
      />
    </div>
  )
}
