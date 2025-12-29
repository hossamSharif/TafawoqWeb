'use client'

import { useState, useEffect } from 'react'
import { ReviewCard } from './ReviewCard'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { AppReviewWithUser } from '@/lib/reviews/types'

interface ReviewsListProps {
  initialReviews?: AppReviewWithUser[]
  featuredOnly?: boolean
  currentUserId?: string
  onEditReview?: (review: AppReviewWithUser) => void
}

export function ReviewsList({
  initialReviews = [],
  featuredOnly = false,
  currentUserId,
  onEditReview,
}: ReviewsListProps) {
  const [reviews, setReviews] = useState<AppReviewWithUser[]>(initialReviews)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'helpful'>('recent')

  useEffect(() => {
    fetchReviews(false)
  }, [sortBy])

  const fetchReviews = async (loadMore: boolean) => {
    if (loadMore) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
    }

    try {
      const params = new URLSearchParams({
        sort: sortBy,
        limit: '20',
      })

      if (featuredOnly) {
        params.set('featured_only', 'true')
      }

      if (loadMore && nextCursor) {
        params.set('cursor', nextCursor)
      }

      const response = await fetch(`/api/reviews?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reviews')
      }

      if (loadMore) {
        setReviews((prev) => [...prev, ...data.reviews])
      } else {
        setReviews(data.reviews)
      }

      setNextCursor(data.nextCursor)
      setHasMore(data.hasMore)
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('فشل في تحميل المراجعات')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المراجعة؟')) {
      return
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete review')
      }

      toast.success(data.message)
      setReviews((prev) => prev.filter((r) => r.id !== reviewId))
    } catch (error) {
      console.error('Error deleting review:', error)
      toast.error(error instanceof Error ? error.message : 'فشل في حذف المراجعة')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">لا توجد مراجعات للعرض</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sort Controls */}
      <div className="flex justify-end">
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="ترتيب حسب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">الأحدث</SelectItem>
            <SelectItem value="rating">التقييم</SelectItem>
            <SelectItem value="helpful">الأكثر فائدة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            canEdit={currentUserId === review.user_id}
            canDelete={currentUserId === review.user_id}
            onEdit={() => onEditReview?.(review)}
            onDelete={() => handleDeleteReview(review.id)}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchReviews(true)}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                جاري التحميل...
              </>
            ) : (
              'تحميل المزيد'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
