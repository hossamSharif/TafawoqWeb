/**
 * ErrorReportButton.tsx
 * UI component for reporting question errors
 *
 * Features:
 * - Error type selection (mathematical/grammatical/diagram/other)
 * - Optional description input
 * - Submit error report via Server Action
 * - Success/error feedback
 *
 * @see User Story 2 (FR-009a) - Error reporting
 * @see src/app/actions/error-actions.ts - Server Action
 */

'use client';

import { useState } from 'react';
import { reportQuestionError, type ErrorType } from '@/app/actions/error-actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorReportButtonProps {
  questionId: string;
  userId?: string;
}

const errorTypeLabels: Record<ErrorType, string> = {
  mathematical: 'خطأ رياضي (Mathematical Error)',
  grammatical: 'خطأ لغوي (Grammatical Error)',
  diagram: 'خطأ في الرسم (Diagram Error)',
  other: 'خطأ آخر (Other Error)',
};

export function ErrorReportButton({ questionId, userId }: ErrorReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [errorType, setErrorType] = useState<ErrorType | ''>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    if (!errorType) {
      setErrorMessage('يرجى اختيار نوع الخطأ');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    const result = await reportQuestionError({
      questionId,
      errorType,
      description: description.trim() || undefined,
      userId,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSubmitStatus('success');
      // Reset form after short delay
      setTimeout(() => {
        setOpen(false);
        setErrorType('');
        setDescription('');
        setSubmitStatus('idle');
      }, 2000);
    } else {
      setSubmitStatus('error');
      setErrorMessage(result.error || 'حدث خطأ أثناء الإبلاغ عن المشكلة');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
          <AlertCircle className="w-4 h-4 mr-2" />
          الإبلاغ عن خطأ
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>الإبلاغ عن خطأ في السؤال</DialogTitle>
          <DialogDescription>
            ساعدنا في تحسين جودة الأسئلة من خلال الإبلاغ عن أي أخطاء تجدها
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Error Type Selection */}
          <div className="grid gap-2">
            <Label htmlFor="error-type">نوع الخطأ *</Label>
            <Select value={errorType} onValueChange={(value) => setErrorType(value as ErrorType)}>
              <SelectTrigger id="error-type">
                <SelectValue placeholder="اختر نوع الخطأ" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(errorTypeLabels) as [ErrorType, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description (Optional) */}
          <div className="grid gap-2">
            <Label htmlFor="description">وصف المشكلة (اختياري)</Label>
            <Textarea
              id="description"
              placeholder="اشرح المشكلة التي وجدتها في هذا السؤال..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                تم الإبلاغ عن الخطأ بنجاح. شكراً لمساعدتك في تحسين الأسئلة!
              </AlertDescription>
            </Alert>
          )}

          {submitStatus === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !errorType}>
            {isSubmitting ? 'جارٍ الإرسال...' : 'إرسال البلاغ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
