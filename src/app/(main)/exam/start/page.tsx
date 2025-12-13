'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, FileText, Clock, CheckCircle2 } from 'lucide-react'

export default function ExamStartPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eligibilityInfo, setEligibilityInfo] = useState<{
    exams_taken?: number
    max_exams?: number
  } | null>(null)

  const startExam = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          setEligibilityInfo({
            exams_taken: data.exams_taken,
            max_exams: data.max_exams,
          })
        }
        throw new Error(data.error || 'فشل في بدء الاختبار')
      }

      // Redirect to the exam page
      router.push(`/exam/${data.session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">اختبار تجريبي كامل</CardTitle>
          <CardDescription>
            اختبار يحاكي اختبار القدرات العامة الحقيقي
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Exam Info */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">عدد الأسئلة</p>
                <p className="font-semibold">96 سؤال</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">المدة</p>
                <p className="font-semibold">120 دقيقة</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">الأقسام</p>
                <p className="font-semibold">لفظي + كمي</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <h3 className="font-semibold">تعليمات مهمة:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>تأكد من توفر اتصال مستقر بالإنترنت قبل بدء الاختبار</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>لا يمكن إيقاف المؤقت بعد بدء الاختبار</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>يمكنك التنقل بين الأسئلة والعودة لها لاحقاً</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>ستظهر النتائج فور انتهاء الاختبار</span>
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
              {eligibilityInfo && (
                <p className="mt-2 text-sm">
                  لقد استخدمت {eligibilityInfo.exams_taken} من {eligibilityInfo.max_exams} اختبارات هذا الأسبوع.
                  قم بالترقية للحصول على اختبارات غير محدودة.
                </p>
              )}
            </div>
          )}

          {/* Start Button */}
          <Button
            onClick={startExam}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                جاري تحضير الاختبار...
              </>
            ) : (
              'بدء الاختبار الآن'
            )}
          </Button>

          {/* Back Link */}
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => router.push('/dashboard')}
            disabled={isLoading}
          >
            العودة للرئيسية
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
