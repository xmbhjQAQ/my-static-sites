-- Remove only the specific synthetic result reported in issue #28.
DELETE FROM score_submissions
WHERE id = '34b10c5d-5208-4b3a-bea8-2d40857ed2b7'
  AND created_at = '2026-10-14T04:30:39.200Z'
  AND score = 250 AND score_max = 250 AND is_spam = 0;

-- The insert trigger cannot undo deletions; rebuild the summary once.
INSERT OR REPLACE INTO score_stats (
  id,
  total_count,
  valid_count,
  spam_count,
  valid_score_sum,
  valid_score_min,
  valid_score_max,
  last_valid_submitted_at
)
SELECT
  1,
  COUNT(*),
  COALESCE(SUM(CASE WHEN is_spam = 0 THEN 1 ELSE 0 END), 0),
  COALESCE(SUM(CASE WHEN is_spam = 1 THEN 1 ELSE 0 END), 0),
  COALESCE(SUM(CASE WHEN is_spam = 0 THEN score ELSE 0 END), 0),
  MIN(CASE WHEN is_spam = 0 THEN score END),
  MAX(CASE WHEN is_spam = 0 THEN score END),
  MAX(CASE WHEN is_spam = 0 THEN created_at END)
FROM score_submissions;
