CREATE TYPE "public"."branch" AS ENUM('CS', 'AIML', 'DS', 'ECS', 'ECE', 'CE', 'ME');
--> statement-breakpoint
CREATE TYPE "public"."year" AS ENUM('1st', '2nd', '3rd', '4th');
--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon_url" text,
	"criteria" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"friend_id" integer NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"achievement_id" integer NOT NULL,
	"earned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "question_type" SET DATA TYPE text;
--> statement-breakpoint
ALTER TABLE "quizzes" ALTER COLUMN "difficulty" SET DATA TYPE text;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "target_branch" text;
--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "target_year" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "name" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_picture" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "branch" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "year" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT now();