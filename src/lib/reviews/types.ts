import { Database } from '@/lib/supabase/types'

// Database types - app_reviews table
export type AppReview = Database['public']['Tables']['app_reviews']['Row']
export type AppReviewInsert = Database['public']['Tables']['app_reviews']['Insert']
export type AppReviewUpdate = Database['public']['Tables']['app_reviews']['Update']

// Extended types with user information
export interface AppReviewWithUser extends AppReview {
  user: {
    id: string
    display_name: string | null
    profile_picture_url: string | null
    email?: string
  }
}

// Review statistics
export interface ReviewStats {
  total_reviews: number
  average_rating: number
  rating_distribution: {
    '5': number
    '4': number
    '3': number
    '2': number
    '1': number
  }
}

// Form data
export interface ReviewFormData {
  rating: number
  review_text: string
}

// API responses
export interface AdminReviewsResponse {
  reviews: AppReviewWithUser[]
  stats: ReviewStats
  nextCursor: string | null
  hasMore: boolean
}

export interface PublicReviewsResponse {
  reviews: AppReviewWithUser[]
  stats: ReviewStats
  nextCursor: string | null
  hasMore: boolean
  userReview: AppReviewWithUser | null
}

// Review list parameters
export interface ReviewListParams {
  cursor?: string | null
  limit?: number
  sort?: 'recent' | 'rating' | 'helpful'
  featured_only?: boolean
  filter?: 'all' | 'featured' | 'not_featured'
}
