-- Migration 1: Extend Questions Table for GAT Exam Platform v3.0
-- Feature: 1-gat-exam-v3
-- Date: 2026-01-05

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

-- Update version field default for new questions (if version column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'version'
  ) THEN
    ALTER TABLE questions ALTER COLUMN version SET DEFAULT '3.0';
  END IF;
END $$;
