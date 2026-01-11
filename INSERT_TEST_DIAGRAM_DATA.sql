-- Insert composite-shape diagram data into Question 2 for testing
-- Exam Session: f0d2042d-3364-4bf6-b93a-6a8a41a00107
-- Question: quant_0_02 (Question 2 - Geometry with composite shape)

UPDATE exam_questions
SET diagram = jsonb_build_object(
  'type', 'composite-shape',
  'data', jsonb_build_object(
    'shapes', jsonb_build_array(
      jsonb_build_object(
        'type', 'rectangle',
        'x', 0,
        'y', 0,
        'width', 12,
        'height', 6
      ),
      jsonb_build_object(
        'type', 'circle',
        'cx', 12,
        'cy', 3,
        'radius', 2,
        'half', true
      )
    ),
    'labels', jsonb_build_array('12 سم', '6 سم', 'نق = 2 سم'),
    'shaded', true
  ),
  'renderHint', 'SVG',
  'caption', 'مستطيل متصل بنصف دائرة'
)
WHERE exam_id = 'f0d2042d-3364-4bf6-b93a-6a8a41a00107'
  AND question_id = 'quant_0_02';

-- Verify the update
SELECT
  question_id,
  question_type,
  diagram->'type' as diagram_type,
  diagram->'renderHint' as render_hint,
  diagram->'data'->'shapes' as shapes
FROM exam_questions
WHERE exam_id = 'f0d2042d-3364-4bf6-b93a-6a8a41a00107'
  AND question_id = 'quant_0_02';
