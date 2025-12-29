-- Migration: Create app_reviews table and related functions
-- Description: Google Play Store-style review system with RLS policies
-- Author: System
-- Date: 2024-12-28

-- Create app_reviews table
CREATE TABLE IF NOT EXISTS public.app_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text NOT NULL CHECK (char_length(review_text) >= 10 AND char_length(review_text) <= 1000),
  is_featured boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_reviews_user_profile_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE
);

-- Add unique constraint: one review per user
CREATE UNIQUE INDEX app_reviews_user_id_unique ON public.app_reviews(user_id);

-- Indexes for performance
CREATE INDEX app_reviews_rating_idx ON public.app_reviews(rating);
CREATE INDEX app_reviews_created_at_idx ON public.app_reviews(created_at DESC);
CREATE INDEX app_reviews_is_featured_idx ON public.app_reviews(is_featured) WHERE is_featured = true;
CREATE INDEX app_reviews_helpful_count_idx ON public.app_reviews(helpful_count DESC);

-- Enable RLS
ALTER TABLE public.app_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Everyone can view all reviews (public display)
DROP POLICY IF EXISTS "app_reviews_select_all" ON public.app_reviews;
CREATE POLICY "app_reviews_select_all" ON public.app_reviews
FOR SELECT USING (true);

-- Policy: Authenticated users can create their own review
DROP POLICY IF EXISTS "app_reviews_insert_own" ON public.app_reviews;
CREATE POLICY "app_reviews_insert_own" ON public.app_reviews
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reviews
DROP POLICY IF EXISTS "app_reviews_update_own" ON public.app_reviews;
CREATE POLICY "app_reviews_update_own" ON public.app_reviews
FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own reviews
DROP POLICY IF EXISTS "app_reviews_delete_own" ON public.app_reviews;
CREATE POLICY "app_reviews_delete_own" ON public.app_reviews
FOR DELETE USING (auth.uid() = user_id);

-- Policy: Admins can update any review (for featuring/unfeaturing)
DROP POLICY IF EXISTS "app_reviews_admin_update" ON public.app_reviews;
CREATE POLICY "app_reviews_admin_update" ON public.app_reviews
FOR UPDATE USING (public.is_user_admin(auth.uid()));

-- Policy: Admins can delete any review
DROP POLICY IF EXISTS "app_reviews_admin_delete" ON public.app_reviews;
CREATE POLICY "app_reviews_admin_delete" ON public.app_reviews
FOR DELETE USING (public.is_user_admin(auth.uid()));

-- Trigger function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_app_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at on row update
DROP TRIGGER IF EXISTS app_reviews_updated_at_trigger ON public.app_reviews;
CREATE TRIGGER app_reviews_updated_at_trigger
BEFORE UPDATE ON public.app_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_app_reviews_updated_at();

-- Function: Get review statistics
CREATE OR REPLACE FUNCTION public.get_review_stats()
RETURNS TABLE (
  total_reviews bigint,
  average_rating numeric,
  rating_distribution json
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_reviews,
    ROUND(COALESCE(AVG(rating), 0), 2) as average_rating,
    json_build_object(
      '5', COUNT(*) FILTER (WHERE rating = 5),
      '4', COUNT(*) FILTER (WHERE rating = 4),
      '3', COUNT(*) FILTER (WHERE rating = 3),
      '2', COUNT(*) FILTER (WHERE rating = 2),
      '1', COUNT(*) FILTER (WHERE rating = 1)
    ) as rating_distribution
  FROM public.app_reviews;
END;
$$;

-- Add comment
COMMENT ON TABLE public.app_reviews IS 'User reviews for the application with Google Play Store-style ratings';
COMMENT ON FUNCTION public.get_review_stats() IS 'Returns overall review statistics including total count, average rating, and distribution';
