-- Migration: Create maintenance_log table
-- Purpose: Audit log for maintenance mode changes

CREATE TABLE IF NOT EXISTS public.maintenance_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL CHECK (action IN ('enabled', 'disabled')),
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_maintenance_log_created_at
ON public.maintenance_log(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.maintenance_log ENABLE ROW LEVEL SECURITY;

-- Comment on table
COMMENT ON TABLE public.maintenance_log IS 'Audit log for maintenance mode changes';
