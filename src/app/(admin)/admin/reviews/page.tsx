'use client'

import { useState, useEffect, useCallback } from 'react'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { ReviewStats } from '@/components/reviews/ReviewStats'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, RefreshCw, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { AdminReviewsResponse, AppReviewWithUser } from '@/lib/reviews/types'

export default function AdminReviewsPage() {
  const [data, setData] = useState<AdminReviewsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'helpful'>('recent')
  const [filter, setFilter] = useState<'all' | 'featured' | 'not_featured'>('all')

  const fetchReviews = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        sort: sortBy,
        filter,
        limit: '50',
      })

      const response = await fetch(`/api/admin/reviews?${params}`)
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
  }, [sortBy, filter])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleToggleFeatured = async (reviewId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !currentStatus }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update review')
      }

      toast.success(result.message)
      fetchReviews()
    } catch (error) {
      console.error('Error updating review:', error)
      toast.error('فشل في تحديث المراجعة')
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المراجعة؟')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete review')
      }

      toast.success(result.message)
      fetchReviews()
    } catch (error) {
      console.error('Error deleting review:', error)
      toast.error('فشل في حذف المراجعة')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة المراجعات</h1>
          <p className="text-muted-foreground">عرض وإدارة مراجعات المستخدمين</p>
        </div>
        <Button variant="outline" onClick={fetchReviews}>
          <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Stats Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                إجمالي المراجعات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.total_reviews}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                متوسط التقييم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {data.stats.average_rating.toFixed(1)}
                </span>
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                تقييمات 5 نجوم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.stats.rating_distribution['5']}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                تقييمات منخفضة (1-2)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.stats.rating_distribution['1'] +
                  data.stats.rating_distribution['2']}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="ترتيب حسب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">الأحدث</SelectItem>
            <SelectItem value="rating">التقييم</SelectItem>
            <SelectItem value="helpful">الأكثر فائدة</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="تصفية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="featured">مميزة</SelectItem>
            <SelectItem value="not_featured">غير مميزة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : data && data.reviews.length > 0 ? (
        <div className="space-y-4">
          {data.reviews.map((review) => (
            <div key={review.id} className="relative">
              <ReviewCard review={review} />

              {/* Admin Actions */}
              <div className="absolute top-4 left-4 flex gap-2">
                <Button
                  variant={review.is_featured ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleToggleFeatured(review.id, review.is_featured)}
                >
                  <Star className="h-4 w-4 ml-1" />
                  {review.is_featured ? 'مميزة' : 'تمييز'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteReview(review.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">لا توجد مراجعات للعرض</p>
        </div>
      )}
    </div>
  )
}
