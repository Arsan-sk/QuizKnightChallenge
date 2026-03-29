-- Add login streak tracking fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_date timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_streak integer DEFAULT 0;
