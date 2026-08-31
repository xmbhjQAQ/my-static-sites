CREATE TABLE IF NOT EXISTS score_stats (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  total_count INTEGER NOT NULL DEFAULT 0,
  valid_count INTEGER NOT NULL DEFAULT 0,
  spam_count INTEGER NOT NULL DEFAULT 0,
  valid_score_sum REAL NOT NULL DEFAULT 0,
  valid_score_min REAL,
  valid_score_max REAL,
  last_valid_submitted_at TEXT
);

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

CREATE TRIGGER IF NOT EXISTS score_submissions_after_insert_stats
AFTER INSERT ON score_submissions
BEGIN
  UPDATE score_stats
  SET
    total_count = total_count + 1,
    valid_count = valid_count + CASE WHEN NEW.is_spam = 0 THEN 1 ELSE 0 END,
    spam_count = spam_count + CASE WHEN NEW.is_spam = 1 THEN 1 ELSE 0 END,
    valid_score_sum = valid_score_sum +
      CASE WHEN NEW.is_spam = 0 THEN NEW.score ELSE 0 END,
    valid_score_min = CASE
      WHEN NEW.is_spam = 1 THEN valid_score_min
      WHEN valid_score_min IS NULL OR NEW.score < valid_score_min THEN NEW.score
      ELSE valid_score_min
    END,
    valid_score_max = CASE
      WHEN NEW.is_spam = 1 THEN valid_score_max
      WHEN valid_score_max IS NULL OR NEW.score > valid_score_max THEN NEW.score
      ELSE valid_score_max
    END,
    last_valid_submitted_at = CASE
      WHEN NEW.is_spam = 0
       AND (last_valid_submitted_at IS NULL
            OR NEW.created_at > last_valid_submitted_at)
        THEN NEW.created_at
      ELSE last_valid_submitted_at
    END
  WHERE id = 1;
END;
