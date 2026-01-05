-- Migration 4: Create ExamConfigurations Table for GAT Exam Platform v3.0
-- Feature: 1-gat-exam-v3
-- Date: 2026-01-05

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

-- Admins can view configs
CREATE POLICY "Admins can view configs" ON exam_configs
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins can create configs
CREATE POLICY "Admins can create configs" ON exam_configs
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Admins can update configs
CREATE POLICY "Admins can update configs" ON exam_configs
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));
