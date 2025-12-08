-- Add answers column to results table so submitted answers are stored for reviews
ALTER TABLE results ADD COLUMN IF NOT EXISTS answers text;
-- Initialize NULL answers to empty JSON array string for consistency
UPDATE results SET answers = '[]' WHERE answers IS NULL;
