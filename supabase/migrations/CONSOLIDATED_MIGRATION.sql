-- ============================================================================
-- GAT Exam Platform v3.0 - CONSOLIDATED DATABASE MIGRATION
-- ============================================================================
-- This file contains all four migrations consolidated for easy execution
-- via Supabase Dashboard SQL Editor
--
-- HOW TO RUN:
-- 1. Go to: https://supabase.com/dashboard/project/fvstedbsjiqvryqpnmzl/sql/new
-- 2. Copy this entire file
-- 3. Paste into the SQL Editor
-- 4. Click "Run" button
--
-- IMPORTANT: Review and update the is_admin(), is_reviewer(), and is_system()
-- functions below to match your actual user role implementation
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Extend Questions Table
-- ============================================================================

-- Add new v3.0 fields to questions table
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS shape_type TEXT,
  ADD COLUMN IF NOT EXISTS pattern_id TEXT,
  ADD COLUMN IF NOT EXISTS diagram_config JSONB,
  ADD COLUMN IF NOT EXISTS comparison_values JSONB,
  ADD COLUMN IF NOT EXISTS relationship_type TEXT,
  ADD COLUMN IF NOT EXISTS generation_metadata JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS quality_flags JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS corrected_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_questions_shape_type ON questions(shape_type) WHERE shape_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_questions_pattern_id ON questions(pattern_id) WHERE pattern_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_questions_diagram_config ON questions USING GIN(diagram_config) WHERE diagram_config IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_questions_version ON questions(version);

-- Update version field default for new questions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'version'
  ) THEN
    ALTER TABLE questions ALTER COLUMN version SET DEFAULT '3.0';
  END IF;
END $$;

-- ============================================================================
-- MIGRATION 2: Create QuestionErrors Table
-- ============================================================================

-- Helper function to check if user is admin
-- ⚠️ UPDATE THIS FUNCTION to match your actual admin role implementation
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- TODO: Update this logic to match your auth schema
  -- Current implementation checks for 'admin' role in user metadata
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create question_errors table
CREATE TABLE IF NOT EXISTS question_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES auth.users(id),
  reported_at TIMESTAMP NOT NULL DEFAULT now(),
  error_type TEXT NOT NULL CHECK (error_type IN ('mathematical', 'grammatical', 'diagram', 'other')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'confirmed', 'rejected', 'fixed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP,
  resolution_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_question_errors_question_id ON question_errors(question_id);
CREATE INDEX IF NOT EXISTS idx_question_errors_status ON question_errors(status);

-- RLS policies
ALTER TABLE question_errors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can report errors" ON question_errors;
CREATE POLICY "Users can report errors" ON question_errors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reported_by);

DROP POLICY IF EXISTS "Users can view own reports" ON question_errors;
CREATE POLICY "Users can view own reports" ON question_errors
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reported_by);

DROP POLICY IF EXISTS "Admins can view all reports" ON question_errors;
CREATE POLICY "Admins can view all reports" ON question_errors
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update reports" ON question_errors;
CREATE POLICY "Admins can update reports" ON question_errors
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- ============================================================================
-- MIGRATION 3: Create ReviewQueue Table
-- ============================================================================

-- Helper function to check if user is reviewer
-- ⚠️ UPDATE THIS FUNCTION to match your actual reviewer role implementation
CREATE OR REPLACE FUNCTION is_reviewer(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- TODO: Update this logic to match your auth schema
  -- Current implementation checks for 'reviewer' or 'admin' role
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id
    AND raw_user_meta_data->>'role' IN ('reviewer', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if caller is system (service role)
CREATE OR REPLACE FUNCTION is_system()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current role is service_role
  RETURN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role';
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create review_queue table
CREATE TABLE IF NOT EXISTS review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  added_at TIMESTAMP NOT NULL DEFAULT now(),
  flag_type TEXT NOT NULL CHECK (flag_type IN ('grammar', 'quality', 'cultural')),
  flag_reason TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0 CHECK (priority >= 0 AND priority <= 10),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_review_queue_status ON review_queue(status);
CREATE INDEX IF NOT EXISTS idx_review_queue_priority ON review_queue(priority DESC, added_at ASC);

-- RLS policies
ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviewers can view queue" ON review_queue;
CREATE POLICY "Reviewers can view queue" ON review_queue
  FOR SELECT
  TO authenticated
  USING (is_reviewer(auth.uid()));

DROP POLICY IF EXISTS "System can insert to queue" ON review_queue;
CREATE POLICY "System can insert to queue" ON review_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()) OR is_system());

DROP POLICY IF EXISTS "Reviewers can update queue" ON review_queue;
CREATE POLICY "Reviewers can update queue" ON review_queue
  FOR UPDATE
  TO authenticated
  USING (is_reviewer(auth.uid()));

-- ============================================================================
-- MIGRATION 4: Create ExamConfigurations Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS exam_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 120,
  section_split JSONB NOT NULL,
  topic_distribution JSONB NOT NULL,
  difficulty_distribution JSONB NOT NULL,
  track TEXT NOT NULL CHECK (track IN ('scientific', 'literary')),
  batch_size INTEGER NOT NULL DEFAULT 20,
  diagram_percentage REAL NOT NULL DEFAULT 0.15
);

-- RLS policies
ALTER TABLE exam_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view configs" ON exam_configs;
CREATE POLICY "Admins can view configs" ON exam_configs
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can create configs" ON exam_configs;
CREATE POLICY "Admins can create configs" ON exam_configs
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update configs" ON exam_configs;
CREATE POLICY "Admins can update configs" ON exam_configs
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries after migration to verify success:
--
-- -- Check new columns in questions table
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'questions'
-- AND column_name IN ('shape_type', 'pattern_id', 'diagram_config', 'comparison_values', 'relationship_type', 'generation_metadata', 'quality_flags', 'corrected_at', 'error_count');
--
-- -- Check new tables exist
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('question_errors', 'review_queue', 'exam_configs');
--
-- -- Check indexes
-- SELECT indexname
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- AND tablename IN ('questions', 'question_errors', 'review_queue');
-- ============================================================================

-- Migration completed!
-- Next steps:
-- 1. Verify tables and columns created successfully (run verification queries above)
-- 2. Update is_admin(), is_reviewer(), is_system() functions if needed
-- 3. Generate TypeScript types
-- 4. Continue with Phase 2 implementation
