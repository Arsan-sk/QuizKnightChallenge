CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('mcq', 'true_false');--> statement-breakpoint
CREATE TYPE "public"."quiz_type" AS ENUM('standard', 'live');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('teacher', 'student');--> statement-breakpoint

-- First add all new columns to avoid data loss
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "points" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now();--> statement-breakpoint

-- For quiz_type, use text first
ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "quiz_type" text DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "duration" integer;--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "start_time" timestamp;--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "end_time" timestamp;--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();--> statement-breakpoint

ALTER TABLE "results" ADD COLUMN IF NOT EXISTS "total_questions" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN IF NOT EXISTS "correct_answers" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN IF NOT EXISTS "wrong_answers" integer DEFAULT 0;--> statement-breakpoint

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now();--> statement-breakpoint

-- Update enum columns safely - don't change these as they could cause data loss
-- We'll leave these as text for now:
-- ALTER TABLE "questions" ALTER COLUMN "question_type" SET DATA TYPE question_type;
-- ALTER TABLE "quizzes" ALTER COLUMN "difficulty" SET DATA TYPE difficulty;
-- ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE role;