-- Migration: Add Violations Tracking to Results Table
-- Description: Adds columns to track proctoring violations during quiz attempts

ALTER TABLE results
ADD COLUMN IF NOT EXISTS tab_switch_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS copy_paste_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS proctoring_flags INTEGER DEFAULT 0;
