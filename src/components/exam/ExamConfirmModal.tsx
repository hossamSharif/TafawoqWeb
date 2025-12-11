'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Clock, FileQuestion, AlertTriangle, CheckCircle2 } from 'lucide-react'

export interface ExamConfirmModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Called when modal should close */
  onClose: () => void
  /** Called when exam is confirmed to start */
  onConfirm: () => void
  /** Whether confirm action is loading */
  isLoading?: boolean
  /** User's academic track */
  track?: 'scientific' | 'literary'
  /** Weekly exam limit info */
  examsRemaining?: number
  /** Error message if any */
  error?: string
  className?: string
}

const TRACK_LABELS = {
  scientific: 'علمي',
  literary: 'أدبي',
}

const EXAM_INFO = {
  questions: 96,
  duration: 120, // minutes
  sections: ['كمي', 'لفظي'],
}

/**
 * ExamConfirmModal - Confirmation dialog before starting exam
 */
export function ExamConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  track = 'scientific',
  examsRemaining,
  error,
  className,
}: ExamConfirmModalProps) {
  const [acknowledged, setAcknowledged] = useState(false)

  const handleConfirm = () => {
    if (!acknowledged && !error) return
    onConfirm()
  }

  const handleClose = () => {
    setAcknowledged(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn('sm:max-w-md', className)}
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="text-xl text-right">
            بدء اختبار قدرات كامل
          </DialogTitle>
          <DialogDescription className="text-right">
            تأكد من قراءة المعلومات التالية قبل البدء
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="py-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-800">لا يمكن بدء الاختبار</h4>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            {/* Exam Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileQuestion className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-sm text-gray-500">عدد الأسئلة</p>
                  <p className="font-semibold">{EXAM_INFO.questions} سؤال</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-sm text-gray-500">المدة</p>
                  <p className="font-semibold">{EXAM_INFO.duration} دقيقة</p>
                </div>
              </div>
            </div>

            {/* Track Info */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">المسار: </span>
                {TRACK_LABELS[track]}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                سيتم توزيع الأسئلة وفقاً لمسارك الأكاديمي
              </p>
            </div>

            {/* Exams Remaining */}
            {examsRemaining !== undefined && (
              <div
                className={cn(
                  'p-3 rounded-lg border',
                  examsRemaining > 1
                    ? 'bg-green-50 border-green-200'
                    : examsRemaining === 1
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-red-50 border-red-200'
                )}
              >
                <p
                  className={cn(
                    'text-sm',
                    examsRemaining > 1
                      ? 'text-green-800'
                      : examsRemaining === 1
                        ? 'text-yellow-800'
                        : 'text-red-800'
                  )}
                >
                  <span className="font-semibold">الاختبارات المتبقية هذا الأسبوع: </span>
                  {examsRemaining}
                </p>
              </div>
            )}

            {/* Important Notes */}
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-800">ملاحظات مهمة:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>لا يمكن إيقاف الاختبار مؤقتاً بعد البدء</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>ستظهر الإجابة الصحيحة فوراً بعد كل سؤال</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>تأكد من استقرار اتصالك بالإنترنت</span>
                </li>
              </ul>
            </div>

            {/* Acknowledgment Checkbox */}
            <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">
                قرأت الملاحظات أعلاه وأنا مستعد لبدء الاختبار
              </span>
            </label>
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            إلغاء
          </Button>
          {!error && (
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={!acknowledged || isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  جاري التحضير...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  بدء الاختبار
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ExamConfirmModal
