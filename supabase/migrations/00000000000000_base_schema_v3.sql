-- ============================================================================
-- BASE SCHEMA MIGRATION - GAT Exam Platform v3.0
-- ============================================================================
-- This migration creates the complete database schema from scratch
-- including both v2.x base tables and v3.0 extensions
--
-- Run this FIRST if you get "relation 'questions' does not exist" error
-- ============================================================================

-- ============================================================================
-- 1. CREATE BASE QUESTIONS TABLE (v2.x + v3.0 fields)
-- ============================================================================

CREATE TABLE IF NOT EXISTS questions (
  -- Base fields (v2.x)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  version TEXT NOT NULL DEFAULT '3.0',
  language TEXT NOT NULL DEFAULT 'ar',
  section TEXT NOT NULL CHECK (section IN ('quantitative', 'verbal')),
  track TEXT NOT NULL CHECK (track IN ('scientific', 'literary')),
  question_type TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  choices JSONB,

  -- v3.0 new fields
  comparison_values JSONB,
  shape_type TEXT,
  pattern_id TEXT,
  diagram_config JSONB,
  relationship_type TEXT,
  generation_metadata JSONB DEFAULT '{}',
  quality_flags JSONB DEFAULT '[]',
  corrected_at TIMESTAMP,
  error_count INTEGER DEFAULT 0
);

-- Base indexes
CREATE INDEX IF NOT EXISTS idx_questions_section ON questions(section);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_version ON questions(version);

-- v3.0 indexes
CREATE INDEX IF NOT EXISTS idx_questions_shape_type ON questions(shape_type) WHERE shape_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_questions_pattern_id ON questions(pattern_id) WHERE pattern_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_questions_diagram_config ON questions USING GIN(diagram_config) WHERE diagram_config IS NOT NULL;

-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for questions
CREATE POLICY "Questions are viewable by everyone" ON questions
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert questions" ON questions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- 2. HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has admin role in metadata
  -- Update this logic to match your actual auth schema
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id
    AND (
      raw_user_meta_data->>'role' = 'admin'
      OR raw_app_meta_data->>'role' = 'admin'
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is reviewer
CREATE OR REPLACE FUNCTION is_reviewer(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has reviewer or admin role
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id
    AND (
      raw_user_meta_data->>'role' IN ('reviewer', 'admin')
      OR raw_app_meta_data->>'role' IN ('reviewer', 'admin')
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if caller is system (service role)
CREATE OR REPLACE FUNCTION is_system()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role';
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. CREATE QUESTION_ERRORS TABLE
-- ============================================================================

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
-- 4. CREATE REVIEW_QUEUE TABLE
-- ============================================================================

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
-- 5. CREATE EXAM_CONFIGS TABLE
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
-- 6. CREATE PRACTICE_SESSIONS TABLE (if not exists - v2.x compatibility)
-- ============================================================================

CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  completed_at TIMESTAMP,
  question_ids JSONB NOT NULL DEFAULT '[]',
  student_responses JSONB NOT NULL DEFAULT '{}',
  score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_created_at ON practice_sessions(created_at DESC);

ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sessions" ON practice_sessions;
CREATE POLICY "Users can view own sessions" ON practice_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own sessions" ON practice_sessions;
CREATE POLICY "Users can create own sessions" ON practice_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sessions" ON practice_sessions;
CREATE POLICY "Users can update own sessions" ON practice_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION QUERIES (Run these after migration)
-- ============================================================================

-- Uncomment and run these to verify:
--
-- -- Check all tables exist
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;
--
-- -- Check questions table structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'questions'
-- ORDER BY ordinal_position;
--
-- -- Check helper functions exist
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_schema = 'public'
-- AND routine_name IN ('is_admin', 'is_reviewer', 'is_system');

-- ============================================================================
-- Migration Complete!
-- ============================================================================
