'use client'

import { useState, useEffect } from 'react'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { ReviewStats } from '@/components/reviews/ReviewStats'
import { ReviewsList } from '@/components/reviews/ReviewsList'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, Star } from 'lucide-react'
import { toast } from 'sonner'
import type { PublicReviewsResponse, AppReviewWithUser } from '@/lib/reviews/types'

export default function ReviewsPage() {
  const { isAuthenticated, user } = useAuth()
  const [data, setData] = useState<PublicReviewsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/reviews?limit=20')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch reviews')
      }

      setData(result)
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('فشل في تحميل المراجعات')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReviewSuccess = (review: AppReviewWithUser) => {
    setShowReviewForm(false)
    fetchReviews()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="max-w-3xl mx-auto mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">آراء المستخدمين</h1>
        <p className="text-muted-foreground text-lg">
          اقرأ تجارب المستخدمين مع التطبيق وشاركنا رأيك
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Stats Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>إحصائيات التقييمات</CardTitle>
            </CardHeader>
            <CardContent>
              {data && <ReviewStats stats={data.stats} />}

              {/* User's Review Status */}
              <div className="mt-6 pt-6 border-t">
                {isAuthenticated ? (
                  data?.userReview ? (
                    <div className="text-center space-y-3">
                      <p className="text-sm text-muted-foreground">تقييمك</p>
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= data.userReview!.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium">{data.userReview.rating} / 5</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setShowReviewForm(true)}
                      >
                        تعديل تقييمي
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => setShowReviewForm(true)}
                    >
                      أضف تقييمك
                    </Button>
                  )
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      سجل الدخول لإضافة تقييمك
                    </p>
                    <Button asChild className="w-full">
                      <a href="/login">تسجيل الدخول</a>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2">
          {data && (
            <ReviewsList
              initialReviews={data.reviews}
              currentUserId={user?.id}
              onEditReview={() => setShowReviewForm(true)}
            />
          )}
        </div>
      </div>

      {/* Review Form Dialog */}
      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {data?.userReview ? 'تعديل تقييمك' : 'أضف تقييمك'}
            </DialogTitle>
          </DialogHeader>
          <ReviewForm
            existingReview={data?.userReview}
            onSuccess={handleReviewSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
