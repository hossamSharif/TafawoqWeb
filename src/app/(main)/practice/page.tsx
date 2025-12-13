'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Target, Clock, BookOpen, Plus, ChevronLeft } from 'lucide-react'

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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSessions() {
      try {
        const response = await fetch('/api/practice?limit=10')
        if (!response.ok) {
          throw new Error('فشل في جلب الجلسات')
        }
        const data = await response.json()
        setSessions(data.sessions || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطأ غير متوقع')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSessions()
  }, [])

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
                <p className="text-sm text-muted-foreground">الجلسات المكتملة</p>
                <p className="text-2xl font-bold">
                  {sessions.filter(s => s.status === 'completed').length}
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

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>الجلسات الأخيرة</CardTitle>
          <CardDescription>آخر 10 جلسات تمرين</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">لم تبدأ أي جلسات تمرين بعد</p>
              <Button onClick={() => router.push('/practice/new')}>
                <Plus className="h-4 w-4 ml-2" />
                ابدأ تمرينك الأول
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    if (session.status === 'completed') {
                      router.push(`/practice/results/${session.id}`)
                    } else {
                      router.push(`/practice/${session.id}`)
                    }
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      session.status === 'completed'
                        ? 'bg-green-500/10'
                        : 'bg-amber-500/10'
                    }`}>
                      {session.status === 'completed' ? (
                        <Target className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {sectionLabels[session.section]} - {difficultyLabels[session.difficulty]}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.total_questions} سؤال
                        {session.status === 'completed' && (
                          <> - النتيجة: {session.correct_answers}/{session.total_questions}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      session.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {session.status === 'completed' ? 'مكتمل' : 'قيد التقدم'}
                    </span>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="text-center">
        <Button variant="ghost" onClick={() => router.push('/dashboard')}>
          العودة للرئيسية
        </Button>
      </div>
    </div>
  )
}
