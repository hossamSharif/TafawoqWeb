'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LibraryAccessButton } from '@/components/library/LibraryAccessButton'
import {
  ArrowRight,
  FileText,
  Users,
  Clock,
  Target,
  User,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import type { LibraryExamDetail, UserLibraryAccess } from '@/types/library'

interface LibraryExamResponse {
  exam: LibraryExamDetail
  userAccess: UserLibraryAccess
}

export default function LibraryExamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const postId = params.postId as string

  const [exam, setExam] = useState<LibraryExamDetail | null>(null)
  const [userAccess, setUserAccess] = useState<UserLibraryAccess | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchExamDetail = useCallback(async () => {
    try {
      const response = await fetch(`/api/library/${postId}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('الاختبار غير موجود في المكتبة')
        }
        throw new Error('فشل في تحميل بيانات الاختبار')
      }

      const data: LibraryExamResponse = await response.json()
      setExam(data.exam)
      setUserAccess(data.userAccess)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setIsLoading(false)
    }
  }, [postId])

  useEffect(() => {
    if (!authLoading && user) {
      fetchExamDetail()
    } else if (!authLoading && !user) {
      setIsLoading(false)
      setError('يرجى تسجيل الدخول للوصول للمكتبة')
    }
  }, [authLoading, user, fetchExamDetail])

  const handleAccessGranted = () => {
    fetchExamDetail()
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !exam || !userAccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {error || 'حدث خطأ غير متوقع'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {!user
                ? 'يرجى تسجيل الدخول للوصول لمكتبة الاختبارات'
                : 'تعذر تحميل بيانات الاختبار'}
            </p>
            <div className="flex gap-3">
              <Link href="/library">
                <Button variant="outline" className="gap-2">
                  <ArrowRight className="w-4 h-4" />
                  العودة للمكتبة
                </Button>
              </Link>
              {!user && (
                <Link href="/auth/login?redirect=/library">
                  <Button>تسجيل الدخول</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const timeAgo = formatDistanceToNow(new Date(exam.createdAt), {
    addSuffix: true,
    locale: ar,
  })

  const sectionLabel =
    exam.section === 'verbal'
      ? 'لفظي'
      : exam.section === 'quantitative'
      ? 'كمي'
      : 'مختلط'

  const sectionColor =
    exam.section === 'verbal'
      ? 'bg-blue-100 text-blue-700'
      : exam.section === 'quantitative'
      ? 'bg-purple-100 text-purple-700'
      : 'bg-gray-100 text-gray-700'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <Link href="/library">
        <Button variant="ghost" className="gap-2">
          <ArrowRight className="w-4 h-4" />
          العودة للمكتبة
        </Button>
      </Link>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Badge variant="secondary" className={sectionColor}>
                {sectionLabel}
              </Badge>
              <CardTitle className="text-2xl">{exam.title}</CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Description */}
          {exam.description && (
            <p className="text-muted-foreground">{exam.description}</p>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">عدد الأسئلة</p>
                <p className="font-semibold">{exam.questionCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">الوقت المتوقع</p>
                <p className="font-semibold">
                  {exam.estimatedTime ? `${exam.estimatedTime} دقيقة` : '--'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Target className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">الصعوبة</p>
                <p className="font-semibold">
                  {exam.difficulty === 'easy'
                    ? 'سهل'
                    : exam.difficulty === 'medium'
                    ? 'متوسط'
                    : exam.difficulty === 'hard'
                    ? 'صعب'
                    : 'مختلط'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">مرات الإكمال</p>
                <p className="font-semibold">{exam.completionCount}</p>
              </div>
            </div>
          </div>

          {/* Creator Info */}
          <div className="flex items-center gap-3 p-4 rounded-lg border border-border">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">
                {exam.creator.displayName || 'مستخدم مجهول'}
              </p>
              <p className="text-sm text-muted-foreground">{timeAgo}</p>
            </div>
          </div>

          {/* Access Button */}
          <div className="pt-4 border-t border-border">
            <LibraryAccessButton
              postId={exam.postId}
              userHasAccess={exam.userHasAccess}
              userCompleted={exam.userCompleted}
              userAccess={userAccess}
              onAccessGranted={handleAccessGranted}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
