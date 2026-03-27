-- Supabase Initial Migration Schema for QuizKnightChallenge
-- Execute this in the Supabase SQL Editor to set up your database automatically.

-- 1. Create Enums
DO $$ BEGIN
  CREATE TYPE "role" AS ENUM ('teacher', 'student');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "difficulty" AS ENUM ('easy', 'medium', 'hard');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "question_type" AS ENUM ('mcq', 'true_false');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "quiz_type" AS ENUM ('standard', 'live');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "branch" AS ENUM ('CS', 'AIML', 'DS', 'ECS', 'ECE', 'CE', 'ME');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "year" AS ENUM ('1st', '2nd', '3rd', '4th');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Create Tables

-- USERS TABLE
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY,
  "username" text NOT NULL UNIQUE,
  "password" text NOT NULL,
  "role" text NOT NULL,
  "points" integer DEFAULT 0,
  "name" text,
  "profile_picture" text,
  "bio" text,
  "branch" text,
  "year" text,
  "email" text,
  "last_active" timestamp DEFAULT now(),
  "achievements" text[] DEFAULT ARRAY[]::text[],
  "created_at" timestamp DEFAULT now(),
  "display_name" text,
  "profile_image" text,
  "friend_ids" integer[] DEFAULT ARRAY[]::integer[],
  "updated_at" timestamp DEFAULT now()
);

-- QUIZZES TABLE
CREATE TABLE IF NOT EXISTS "quizzes" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "created_by" integer NOT NULL,
  "difficulty" text NOT NULL,
  "is_public" boolean DEFAULT false,
  "quiz_type" quiz_type DEFAULT 'standard',
  "is_active" boolean DEFAULT false,
  "duration" integer,
  "target_branch" text,
  "target_year" text,
  "start_time" timestamp,
  "end_time" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS "questions" (
  "id" serial PRIMARY KEY,
  "quiz_id" integer NOT NULL,
  "question_text" text NOT NULL,
  "question_type" text NOT NULL,
  "options" text[],
  "correct_answer" text NOT NULL,
  "points" integer DEFAULT 2,
  "image_url" text,
  "option_images" text[],
  "created_at" timestamp DEFAULT now()
);

-- RESULTS TABLE
CREATE TABLE IF NOT EXISTS "results" (
  "id" serial PRIMARY KEY,
  "quiz_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "score" integer NOT NULL,
  "total_questions" integer NOT NULL,
  "correct_answers" integer NOT NULL,
  "wrong_answers" integer NOT NULL,
  "time_taken" integer NOT NULL,
  "answers" text,
  "points_earned" integer DEFAULT 0,
  "completed_at" timestamp DEFAULT now()
);

-- ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS "achievements" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "icon_url" text,
  "criteria" text NOT NULL,
  "created_at" timestamp DEFAULT now()
);

-- USER ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS "user_achievements" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "achievement_id" integer NOT NULL,
  "earned_at" timestamp DEFAULT now()
);

-- FRIENDSHIPS TABLE
CREATE TABLE IF NOT EXISTS "friendships" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "friend_id" integer NOT NULL,
  "status" text NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
