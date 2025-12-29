'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { AppReviewWithUser } from '@/lib/reviews/types'

export function TestimonialsSection() {
  const [featuredReviews, setFeaturedReviews] = useState<AppReviewWithUser[]>([])

  useEffect(() => {
    fetchFeaturedReviews()
  }, [])

  const fetchFeaturedReviews = async () => {
    try {
      const response = await fetch('/api/reviews?featured_only=true&limit=6')
      const data = await response.json()

      if (response.ok) {
        setFeaturedReviews(data.reviews)
      }
    } catch (error) {
      console.error('Error fetching featured reviews:', error)
    }
  }

  if (featuredReviews.length === 0) {
    return null
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ماذا يقول مستخدمونا
          </h2>
          <p className="text-muted-foreground text-lg">
            تجارب حقيقية من طلاب استخدموا قدراتك في رحلتهم التعليمية
          </p>
        </div>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8">
          {featuredReviews.map((review) => {
            const reviewerName = review.user.display_name || 'مستخدم'
            const reviewerInitials = reviewerName.charAt(0).toUpperCase()

            return (
              <Card key={review.id} className="border-2 hover:border-primary transition-colors">
                <CardContent className="p-6">
                  {/* Rating */}
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Review text */}
                  <p className="text-muted-foreground mb-4 line-clamp-4">
                    &quot;{review.review_text}&quot;
                  </p>

                  {/* Reviewer info */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.user.profile_picture_url || undefined} />
                      <AvatarFallback>{reviewerInitials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{reviewerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString('ar-SA', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/reviews">
              عرض جميع المراجعات
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
