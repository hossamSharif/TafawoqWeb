-- Migration 3: Create ReviewQueue Table for GAT Exam Platform v3.0
-- Feature: 1-gat-exam-v3
-- Date: 2026-01-05

-- Helper function to check if user is reviewer
CREATE OR REPLACE FUNCTION is_reviewer(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- TODO: Implement reviewer check logic based on your auth schema
  -- This checks if user has 'reviewer' or 'admin' role
  -- Adjust according to your actual reviewer identification logic
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
  -- Check if the current role is service_role (system/server-side operations)
  RETURN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Only admins/reviewers can access review queue
CREATE POLICY "Reviewers can view queue" ON review_queue
  FOR SELECT
  TO authenticated
  USING (is_reviewer(auth.uid()));

-- System (service role) and admins can insert to queue
CREATE POLICY "System can insert to queue" ON review_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()) OR is_system());

-- Reviewers can update queue
CREATE POLICY "Reviewers can update queue" ON review_queue
  FOR UPDATE
  TO authenticated
  USING (is_reviewer(auth.uid()));
