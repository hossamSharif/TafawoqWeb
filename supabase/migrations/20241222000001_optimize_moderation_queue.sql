-- Optimize moderation queue to eliminate N+1 query pattern
-- This function fetches all report data with author/reporter info in a single query

CREATE OR REPLACE FUNCTION get_moderation_queue_optimized(
  p_status TEXT DEFAULT 'pending',
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  content_type TEXT,
  content_id UUID,
  content_preview TEXT,
  content_author_id UUID,
  content_author_name TEXT,
  reporter_id UUID,
  reporter_name TEXT,
  reason TEXT,
  details TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.content_type,
    r.content_id,
    -- Content preview with conditional join
    CASE
      WHEN r.content_type = 'post' THEN
        (SELECT p.title || COALESCE(': ' || SUBSTRING(p.body, 1, 100), '')
         FROM forum_posts p WHERE p.id = r.content_id)
      WHEN r.content_type = 'comment' THEN
        (SELECT SUBSTRING(c.content, 1, 150)
         FROM comments c WHERE c.id = r.content_id)
      ELSE ''
    END as content_preview,
    -- Content author ID
    CASE
      WHEN r.content_type = 'post' THEN
        (SELECT p.author_id FROM forum_posts p WHERE p.id = r.content_id)
      WHEN r.content_type = 'comment' THEN
        (SELECT c.author_id FROM comments c WHERE c.id = r.content_id)
    END as content_author_id,
    -- Content author name (single lookup via lateral join)
    CASE
      WHEN r.content_type = 'post' THEN
        (SELECT up.display_name
         FROM forum_posts p
         INNER JOIN user_profiles up ON up.user_id = p.author_id
         WHERE p.id = r.content_id)
      WHEN r.content_type = 'comment' THEN
        (SELECT up.display_name
         FROM comments c
         INNER JOIN user_profiles up ON up.user_id = c.author_id
         WHERE c.id = r.content_id)
    END as content_author_name,
    r.reporter_id,
    -- Reporter name (joined directly)
    COALESCE(rp.display_name, 'Unknown') as reporter_name,
    r.reason,
    r.details,
    r.status,
    r.created_at
  FROM reports r
  LEFT JOIN user_profiles rp ON rp.user_id = r.reporter_id
  WHERE r.status = p_status
  ORDER BY r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission to authenticated users (adjust as needed for your RLS setup)
GRANT EXECUTE ON FUNCTION get_moderation_queue_optimized TO authenticated;

-- Add index on reports table for faster queries
CREATE INDEX IF NOT EXISTS idx_reports_status_created_at
ON reports(status, created_at DESC);

-- Comment for documentation
COMMENT ON FUNCTION get_moderation_queue_optimized IS
'Optimized moderation queue query that eliminates N+1 pattern by fetching all report data with author/reporter info in a single query. Reduces 61 queries for 20 items to 1 query.';
