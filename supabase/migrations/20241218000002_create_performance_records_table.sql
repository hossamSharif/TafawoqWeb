-- Create performance_records table for tracking weekly exam limits
-- This table is required by the check_exam_eligibility function

CREATE TABLE IF NOT EXISTS public.performance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weekly_exam_count integer NOT NULL DEFAULT 0 CHECK (weekly_exam_count >= 0),
  week_start_date date NOT NULL DEFAULT CURRENT_DATE,
  exam_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  category_performance jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE public.performance_records ENABLE ROW LEVEL SECURITY;

-- Users can read their own performance records
CREATE POLICY "Users can view own performance records"
  ON public.performance_records
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own performance records
CREATE POLICY "Users can insert own performance records"
  ON public.performance_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own performance records
CREATE POLICY "Users can update own performance records"
  ON public.performance_records
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_performance_records_user_id
  ON public.performance_records(user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_performance_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_performance_records_updated_at
  BEFORE UPDATE ON public.performance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_performance_records_updated_at();

-- Initialize performance_records for existing users
INSERT INTO public.performance_records (user_id, weekly_exam_count, week_start_date, exam_history, category_performance)
SELECT
  id as user_id,
  0 as weekly_exam_count,
  CURRENT_DATE as week_start_date,
  '[]'::jsonb as exam_history,
  '{}'::jsonb as category_performance
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.performance_records WHERE user_id = auth.users.id
);
