'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Target, Clock, BookOpen, Plus, ChevronLeft } from 'lucide-react'
import { PracticeHistory } from '@/components/profile/PracticeHistory'

interface PracticeSession {
  id: string
  section: 'quantitative' | 'verbal'
  categories: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  total_questions: number
  correct_answers: number
  status: 'in_progress' | 'completed'
  created_at: string
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

const difficultyLabels = {
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب',
}

const sectionLabels = {
  quantitative: 'القسم الكمي',
  verbal: 'القسم اللفظي',
}

export default function PracticePage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<PracticeSession[]>([])
  const [practiceHistory, setPracticeHistory] = useState<PracticeHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true)
      const [sessionsRes, historyRes] = await Promise.all([
        fetch('/api/practice?limit=10'),
        fetch('/api/practice/history?limit=20')
      ])

      if (!sessionsRes.ok) {
        throw new Error('فشل في جلب الجلسات')
      }

      const sessionsData = await sessionsRes.json()
      setSessions(sessionsData.sessions || [])

      // Fetch and transform practice history for sharing
      if (historyRes.ok) {
        const historyData = await historyRes.json()
        if (historyData.sessions) {
          const historyItems: PracticeHistoryItem[] = historyData.sessions
            .filter((session: any) => session.status === 'completed')
            .map((session: any) => ({
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
            }))
          setPracticeHistory(historyItems)
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
      await fetchSessions()
    } catch (err) {
      console.error('Practice share error:', err)
      throw err // Re-throw to let the ShareExamModal handle the error
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">تمارين مخصصة</h1>
          <p className="text-muted-foreground">
            اختر التصنيفات والصعوبة التي تريد التدرب عليها
          </p>
        </div>
        <Button onClick={() => router.push('/practice/new')}>
          <Plus className="h-4 w-4 ml-2" />
          تمرين جديد
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
                <p className="text-sm text-muted-foreground">إجمالي الجلسات</p>
                <p className="text-2xl font-bold">{practiceHistory.length + sessions.filter(s => s.status === 'in_progress').length}</p>
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
                <p className="text-sm text-muted-foreground">الجلسات المكتملة</p>
                <p className="text-2xl font-bold">
                  {practiceHistory.length}
                </p>
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
                <p className="text-sm text-muted-foreground">قيد التقدم</p>
                <p className="text-2xl font-bold">
                  {sessions.filter(s => s.status === 'in_progress').length}
                </p>
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

      {/* Active Sessions (In Progress) */}
      {sessions.filter(s => s.status === 'in_progress').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>جلسات قيد التقدم</CardTitle>
            <CardDescription>استمر في التمرين من حيث توقفت</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessions
                .filter(s => s.status === 'in_progress')
                .map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/practice/${session.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-amber-500/10">
                        <Clock className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {sectionLabels[session.section]} - {difficultyLabels[session.difficulty]}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {session.total_questions} سؤال
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">
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

      {/* Practice History with Sharing */}
      {practiceHistory.length > 0 ? (
        <PracticeHistory
          history={practiceHistory}
          maxItems={20}
          variant="full"
          showActions={true}
          onShare={handlePracticeShare}
        />
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">لم تكمل أي جلسات تمرين بعد</p>
              <Button onClick={() => router.push('/practice/new')}>
                <Plus className="h-4 w-4 ml-2" />
                ابدأ تمرينك الأول
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
    </div>
  )
}
