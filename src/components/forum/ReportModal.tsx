'use client'

import { useState } from 'react'
import { Loader2, Flag, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import type { ReportReason, ReportContentType } from '@/lib/admin/types'
import { REPORT_REASON_LABELS, ADMIN_LIMITS } from '@/lib/admin/types'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  contentType: ReportContentType
  contentId: string
  contentPreview?: string
  onSuccess?: () => void
}

const REPORT_REASONS: ReportReason[] = [
  'spam',
  'harassment',
  'inappropriate_content',
  'misinformation',
  'other',
]

export function ReportModal({
  isOpen,
  onClose,
  contentType,
  contentId,
  contentPreview,
  onSuccess,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const contentTypeLabel = contentType === 'post' ? 'المنشور' : 'التعليق'

  const handleSubmit = async () => {
    if (!reason) {
      setError('يرجى اختيار سبب البلاغ')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          reason,
          details: details.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          setError('لقد قمت بالإبلاغ عن هذا المحتوى مسبقاً')
        } else if (response.status === 400) {
          setError(data.error || 'لا يمكنك الإبلاغ عن محتواك الخاص')
        } else {
          setError(data.error || 'حدث خطأ أثناء إرسال البلاغ')
        }
        return
      }

      setSuccess(true)
      onSuccess?.()

      // Close modal after showing success message
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch {
      setError('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('')
      setDetails('')
      setError(null)
      setSuccess(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            الإبلاغ عن {contentTypeLabel}
          </DialogTitle>
          <DialogDescription>
            ساعدنا في الحفاظ على مجتمع آمن عن طريق الإبلاغ عن المحتوى المخالف
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-foreground">تم إرسال البلاغ بنجاح</p>
            <p className="text-sm text-muted-foreground mt-1">
              سيتم مراجعة البلاغ من قبل فريق الإدارة
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Content Preview */}
            {contentPreview && (
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {contentPreview}
                </p>
              </div>
            )}

            {/* Reason Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">سبب البلاغ</Label>
              <RadioGroup
                value={reason}
                onValueChange={(value: string) => setReason(value as ReportReason)}
                className="space-y-2"
              >
                {REPORT_REASONS.map((reasonOption) => (
                  <div
                    key={reasonOption}
                    className="flex items-center space-x-2 space-x-reverse"
                  >
                    <RadioGroupItem
                      value={reasonOption}
                      id={`reason-${reasonOption}`}
                      disabled={isSubmitting}
                    />
                    <Label
                      htmlFor={`reason-${reasonOption}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {REPORT_REASON_LABELS[reasonOption]}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Additional Details */}
            <div className="space-y-2">
              <Label htmlFor="details" className="text-sm">
                تفاصيل إضافية (اختياري)
              </Label>
              <Textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="أضف أي تفاصيل قد تساعد في مراجعة البلاغ..."
                maxLength={ADMIN_LIMITS.REPORT_DETAILS_MAX_LENGTH}
                className="min-h-[80px] text-sm"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground text-left">
                {details.length}/{ADMIN_LIMITS.REPORT_DETAILS_MAX_LENGTH}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </div>
        )}

        {!success && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !reason}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Flag className="w-4 h-4 ml-2" />
                  إرسال البلاغ
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
