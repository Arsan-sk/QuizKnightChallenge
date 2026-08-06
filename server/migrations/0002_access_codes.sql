-- Migration: 0002_access_codes.sql
-- Add access_code column to quizzes table for Join-by-Code feature
ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "access_code" text;
CREATE UNIQUE INDEX IF NOT EXISTS "quizzes_access_code_idx" ON "quizzes" ("access_code");
