'use client'

import { Star, Trash2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { AppReviewWithUser } from '@/lib/reviews/types'

interface ReviewCardProps {
  review: AppReviewWithUser
  canEdit?: boolean
  canDelete?: boolean
  onEdit?: () => void
  onDelete?: () => void
  highlighted?: boolean
}

export function ReviewCard({
  review,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  highlighted,
}: ReviewCardProps) {
  const reviewerName = review.user.display_name || 'مستخدم'
  const reviewerInitials = reviewerName.charAt(0).toUpperCase()
  const reviewDate = new Date(review.created_at).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div
      className={cn(
        'p-6 rounded-lg border bg-card transition-all',
        highlighted && 'ring-2 ring-primary ring-offset-2',
        review.is_featured && 'border-yellow-400 bg-yellow-50/50'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={review.user.profile_picture_url || undefined} />
            <AvatarFallback>{reviewerInitials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{reviewerName}</h3>
            <p className="text-sm text-muted-foreground">{reviewDate}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {canEdit && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canDelete && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                'h-4 w-4',
                star <= review.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              )}
            />
          ))}
        </div>
        <span className="text-sm font-medium">{review.rating} / 5</span>
        {review.is_featured && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
            مميزة
          </span>
        )}
      </div>

      {/* Review Text */}
      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
        {review.review_text}
      </p>

      {/* Updated indicator */}
      {review.created_at !== review.updated_at && (
        <p className="text-xs text-muted-foreground mt-3">
          تم التحديث في{' '}
          {new Date(review.updated_at).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      )}
    </div>
  )
}
