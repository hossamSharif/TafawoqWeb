'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle2,
  Clock,
  FileText,
  Target,
  AlertCircle,
  Loader2,
  Trophy,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ExamInstructionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExamInstructionsModal({ open, onOpenChange }: ExamInstructionsModalProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eligibility, setEligibility] = useState<{
    canCreate: boolean
    examsTaken: number
    maxExams: number
    nextEligibleAt?: string
    creditsAvailable: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch eligibility when modal opens
  useEffect(() => {
    if (open) {
      fetchEligibility()
    }
  }, [open])

  const fetchEligibility = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/subscription/limits')
      if (response.ok) {
        const data = await response.json()
        setEligibility({
          canCreate: data.limits.examsRemaining > 0 || data.limits.examCredits > 0,
          examsTaken: data.limits.examsTaken || 0,
          maxExams: data.limits.maxExamsPerWeek || 3,
          nextEligibleAt: data.limits.nextExamEligibleAt,
          creditsAvailable: data.limits.examCredits || 0,
        })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'فشل في التحقق من الأهلية')
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartExam = async () => {
    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          // Exam limit reached
          setError(
            data.error ||
              `لقد تجاوزت الحد الأسبوعي للاختبارات (${data.exams_taken}/${data.max_exams})`
          )
          setIsCreating(false)
          return
        }
        throw new Error(data.error || 'فشل في إنشاء الاختبار')
      }

      // Navigate to exam session
      router.push(`/exam/${data.session.id}`)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ غير متوقع')
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            اختبار تفوّق التجريبي
          </DialogTitle>
          <DialogDescription>
            اختبار كامل محاكي لاختبار القدرات مع نظام تقييم شامل
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Exam Overview */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="p-2 rounded-full bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">عدد الأسئلة</p>
                <p className="text-2xl font-bold text-blue-900">96 سؤال</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="p-2 rounded-full bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-amber-600 font-medium">المدة الزمنية</p>
                <p className="text-2xl font-bold text-amber-900">120 دقيقة</p>
              </div>
            </div>
          </div>

          {/* Eligibility Status */}
          {isLoading ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : eligibility ? (
            <div className={cn(
              "p-4 rounded-lg border",
              eligibility.canCreate
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            )}>
              <div className="flex items-start gap-3">
                {eligibility.canCreate ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={cn(
                    "font-medium mb-1",
                    eligibility.canCreate ? "text-green-900" : "text-red-900"
                  )}>
                    {eligibility.canCreate ? 'يمكنك إنشاء اختبار جديد' : 'وصلت للحد الأسبوعي'}
                  </p>
                  <p className={cn(
                    "text-sm",
                    eligibility.canCreate ? "text-green-700" : "text-red-700"
                  )}>
                    الاختبارات المستخدمة: {eligibility.examsTaken} من {eligibility.maxExams} هذا الأسبوع
                  </p>
                  {eligibility.creditsAvailable > 0 && (
                    <p className="text-sm text-blue-700 mt-2 flex items-center gap-1">
                      <Trophy className="h-4 w-4" />
                      لديك {eligibility.creditsAvailable} رصيد اختبار متاح
                    </p>
                  )}
                  {!eligibility.canCreate && eligibility.nextEligibleAt && (
                    <p className="text-sm text-gray-600 mt-2">
                      الاختبار القادم متاح في: {new Date(eligibility.nextEligibleAt).toLocaleDateString('ar-SA')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {/* Instructions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              تعليمات الاختبار
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">
                  <strong>التكوين:</strong> 96 سؤال موزعة بين القسم اللفظي والكمي حسب مسارك الدراسي
                </p>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">
                  <strong>الوقت:</strong> 120 دقيقة (ساعتان) للاختبار الكامل مع عداد تنازلي
                </p>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">
                  <strong>الإيقاف المؤقت:</strong> يمكنك إيقاف الاختبار مؤقتاً واستئنافه لاحقاً
                </p>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">
                  <strong>التقييم:</strong> سيتم حساب درجات القسم اللفظي والكمي والدرجة الإجمالية
                </p>
              </div>

              <div className="flex items-start gap-2">
                <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">
                  <strong>الهدف:</strong> حقق أعلى درجة ممكنة لتقييم مستواك وتحديد نقاط القوة والضعف
                </p>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>ملاحظة هامة:</strong> بمجرد بدء الاختبار، سيبدأ العداد التنازلي. تأكد من وجودك في بيئة هادئة ومناسبة للتركيز.
            </AlertDescription>
          </Alert>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleStartExam}
            disabled={isCreating || !eligibility?.canCreate || isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري الإنشاء...
              </>
            ) : (
              <>
                <Trophy className="h-4 w-4 ml-2" />
                ابدأ الاختبار
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
