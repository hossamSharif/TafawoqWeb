-- Migration 2: Create QuestionErrors Table for GAT Exam Platform v3.0
-- Feature: 1-gat-exam-v3
-- Date: 2026-01-05

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- TODO: Implement admin check logic based on your auth schema
  -- This is a placeholder that checks if user has an 'admin' role
  -- Adjust according to your actual admin identification logic
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- RLS policies (assuming existing auth setup)
ALTER TABLE question_errors ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to report errors
CREATE POLICY "Users can report errors" ON question_errors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reported_by);

-- Allow users to view their own reports
CREATE POLICY "Users can view own reports" ON question_errors
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reported_by);

-- Allow admins to view all reports
CREATE POLICY "Admins can view all reports" ON question_errors
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Allow admins to update reports
CREATE POLICY "Admins can update reports" ON question_errors
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));
