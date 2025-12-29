-- Optimize library queries by combining count with data fetch
-- This eliminates the separate count query in getLibraryExams

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_library_exams_with_count;

-- Create optimized function that returns both exams and total count
CREATE OR REPLACE FUNCTION get_library_exams_with_count(
  p_user_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_section TEXT DEFAULT NULL,
  p_sort TEXT DEFAULT 'popular'
)
RETURNS TABLE (
  -- Exam data columns
  post_id UUID,
  title TEXT,
  section TEXT,
  question_count INT,
  creator_id UUID,
  creator_name TEXT,
  completion_count INT,
  user_has_access BOOLEAN,
  user_completed BOOLEAN,
  created_at TIMESTAMPTZ,
  -- Total count (same value for all rows)
  total_count BIGINT
) AS $$
DECLARE
  v_total_count BIGINT;
BEGIN
  -- Calculate total count once
  SELECT COUNT(*)
  INTO v_total_count
  FROM forum_posts fp
  INNER JOIN exam_sessions es ON es.id = fp.shared_exam_id
  WHERE fp.post_type = 'exam_share'
    AND fp.is_library_visible = true
    AND fp.status != 'deleted'
    AND (p_section IS NULL OR es.track::text = p_section);

  -- Return exam data with total count
  RETURN QUERY
  WITH exam_data AS (
    SELECT
      fp.id as post_id,
      fp.title,
      es.track::text as section,
      es.total_questions as question_count,
      fp.author_id as creator_id,
      up.display_name as creator_name,
      fp.completion_count,
      EXISTS(
        SELECT 1 FROM library_access la
        WHERE la.user_id = p_user_id AND la.post_id = fp.id
      ) as user_has_access,
      EXISTS(
        SELECT 1 FROM library_access la
        WHERE la.user_id = p_user_id AND la.post_id = fp.id AND la.exam_completed = true
      ) as user_completed,
      fp.created_at
    FROM forum_posts fp
    INNER JOIN exam_sessions es ON es.id = fp.shared_exam_id
    LEFT JOIN user_profiles up ON up.user_id = fp.author_id
    WHERE fp.post_type = 'exam_share'
      AND fp.is_library_visible = true
      AND fp.status != 'deleted'
      AND (p_section IS NULL OR es.track::text = p_section)
    ORDER BY
      CASE WHEN p_sort = 'popular' THEN fp.completion_count END DESC,
      CASE WHEN p_sort = 'recent' THEN fp.created_at END DESC,
      CASE WHEN p_sort = 'oldest' THEN fp.created_at END ASC
    LIMIT p_limit
    OFFSET p_offset
  )
  SELECT
    ed.*,
    v_total_count
  FROM exam_data ed;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_library_exams_with_count TO authenticated;

COMMENT ON FUNCTION get_library_exams_with_count IS
'Optimized library exam query that returns both exam data and total count in a single call, eliminating the separate count query.';
