'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { AppReviewWithUser } from '@/lib/reviews/types'

interface ReviewFormProps {
  existingReview?: AppReviewWithUser | null
  onSuccess?: (review: AppReviewWithUser) => void
}

export function ReviewForm({ existingReview, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState(existingReview?.review_text || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('يرجى اختيار تقييم')
      return
    }

    if (reviewText.trim().length < 10) {
      toast.error('يجب أن يحتوي نص المراجعة على 10 أحرف على الأقل')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, review_text: reviewText }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review')
      }

      toast.success(data.message)
      onSuccess?.(data.review)
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error(error instanceof Error ? error.message : 'حدث خطأ أثناء إرسال المراجعة')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Star Rating */}
      <div className="space-y-2">
        <Label>التقييم</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  'h-8 w-8 transition-colors',
                  (hoverRating || rating) >= star
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                )}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-muted-foreground">
            {rating === 5 && 'ممتاز! شكراً لتقييمك العالي'}
            {rating === 4 && 'جيد جداً! نقدر رأيك'}
            {rating === 3 && 'جيد. سنعمل على التحسين'}
            {rating === 2 && 'شكراً على ملاحظاتك. سنحسن الخدمة'}
            {rating === 1 && 'نأسف لعدم رضاك. سنعمل على التحسين'}
          </p>
        )}
      </div>

      {/* Review Text */}
      <div className="space-y-2">
        <Label htmlFor="review_text">المراجعة</Label>
        <Textarea
          id="review_text"
          placeholder="شاركنا تجربتك مع التطبيق... (على الأقل 10 أحرف)"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={5}
          className="resize-none"
          required
          minLength={10}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground text-left">
          {reviewText.length}/1000 حرف
        </p>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="w-full"
      >
        {isSubmitting
          ? 'جاري الإرسال...'
          : existingReview
          ? 'تحديث المراجعة'
          : 'إرسال المراجعة'}
      </Button>

      {existingReview && (
        <p className="text-xs text-muted-foreground text-center">
          يمكنك تحديث مراجعتك في أي وقت
        </p>
      )}
    </form>
  )
}
