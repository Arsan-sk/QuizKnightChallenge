-- Migration: 0003_update_question_points_default.sql
-- Purpose: Set default points per question to 2 and update existing NULLs to 2.
BEGIN;

-- 1) Set default for new rows
ALTER TABLE questions ALTER COLUMN points SET DEFAULT 2;

-- 2) Update existing rows that have NULL points to 2
UPDATE questions SET points = 2 WHERE points IS NULL;

COMMIT;
