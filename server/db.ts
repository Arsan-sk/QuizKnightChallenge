import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from "@shared/schema";
import dotenv from "dotenv";
import path from 'path';
import fs from 'fs';

dotenv.config();

// Check for DATABASE_URL and provide a fallback for development
if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL is not set. Using in-memory mode for development.",
  );
  // We'll still initialize the objects, but they won't connect to a real database
  // This allows the app to start for development purposes
}

// Create pool with either real connection string or empty string (will fail gracefully)
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || 'postgresql://fake', 
  // Add connection options to handle retries and timeouts
  max: 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000 
});

// Test the database connection
pool.connect((err, client, done) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
  } else {
    console.log('Successfully connected to the database');
    done();
  }
});

export const db = drizzle(pool, { schema });

// Apply schema changes directly
async function applySchemaChanges() {
  try {
    console.log('Applying schema changes...');
    const client = await pool.connect();
    
    // Create branch enum type if it doesn't exist
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."branch" AS ENUM('CS', 'AIML', 'DS', 'ECS', 'ECE', 'CE', 'ME');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create year enum type if it doesn't exist
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."year" AS ENUM('1st', '2nd', '3rd', '4th');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add new columns to users table if they don't exist
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "users" ADD COLUMN "name" text;
        ALTER TABLE "users" ADD COLUMN "profile_picture" text;
        ALTER TABLE "users" ADD COLUMN "bio" text;
        ALTER TABLE "users" ADD COLUMN "branch" text;
        ALTER TABLE "users" ADD COLUMN "year" text;
        ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT now();
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    // Add new columns to quizzes table if they don't exist
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "quizzes" ADD COLUMN "target_branch" text;
        ALTER TABLE "quizzes" ADD COLUMN "target_year" text;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    // Add new columns to questions table if they don't exist
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "questions" ADD COLUMN "image_url" text;
        ALTER TABLE "questions" ADD COLUMN "option_images" text[];
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    // Create achievements table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS "achievements" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "description" text NOT NULL,
        "icon_url" text,
        "criteria" text NOT NULL,
        "created_at" timestamp DEFAULT now()
      );
    `);

    // Create friendships table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS "friendships" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "friend_id" integer NOT NULL,
        "status" text NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `);

    // Create user_achievements table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_achievements" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "achievement_id" integer NOT NULL,
        "earned_at" timestamp DEFAULT now()
      );
    `);

    client.release();
    console.log('Schema changes applied successfully');
  } catch (error) {
    console.error('Error applying schema changes:', error);
  }
}

// Run schema changes immediately
applySchemaChanges();
