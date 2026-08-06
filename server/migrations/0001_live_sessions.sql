-- Migration: 0001_live_sessions.sql
-- Create live_sessions table for Live Quiz Batches
CREATE TABLE IF NOT EXISTS "live_sessions" (
  "id" serial PRIMARY KEY NOT NULL,
  "quiz_id" integer NOT NULL,
  "session_name" text NOT NULL,
  "status" text NOT NULL DEFAULT 'active',
  "started_at" timestamp DEFAULT now(),
  "ended_at" timestamp,
  "created_at" timestamp DEFAULT now()
);

-- Extend results table to associate attempts with specific live sessions
ALTER TABLE "results" ADD COLUMN IF NOT EXISTS "session_id" integer;
