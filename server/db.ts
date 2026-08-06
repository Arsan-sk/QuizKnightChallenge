import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from "@shared/schema";
import dotenv from "dotenv";
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

// Check for DATABASE_URL and provide a fallback for development
if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL is not set. Using in-memory mode for development.",
  );
  // We'll still initialize the objects, but they won't connect to a real database
  // This allows the app to start for development purposes
}
const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://fake';
const isCloudOrProduction = 
  process.env.NODE_ENV === 'production' || 
  connectionString.includes('supabase') || 
  connectionString.includes('neon.tech') || 
  connectionString.includes('render.com') ||
  connectionString.includes('cockroach') ||
  connectionString.includes('aiven') ||
  (connectionString !== 'postgresql://fake' && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'));

// Create pool with either real connection string or empty string (will fail gracefully)
export const pool = new Pool({
  connectionString,
  max: 10,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  keepAlive: true,
  ...(isCloudOrProduction ? { ssl: { rejectUnauthorized: false } } : {})
});

// Add error handler to prevent idle client errors from crashing the process
pool.on('error', (err, _client) => {
  console.error('Unexpected error on idle database client', err?.message || err);
});

// Test the database connection if non-fake
if (connectionString !== 'postgresql://fake') {
  pool.connect((err, _client, done) => {
    if (err) {
      console.error('Error connecting to the database:', err.message);
    } else {
      console.log('Successfully connected to the database');
      done();
    }
  });
}

export const db = drizzle(pool, { schema });

// Apply schema changes directly
async function applySchemaChanges() {
  try {
    // Check if using fake connection String
    if (connectionString === 'postgresql://fake') {
      console.log('Using fake database, skipping schema changes');
      return;
    }

    console.log('Applying schema changes...');

    const client = await pool.connect();
    console.log('Got client for schema changes');

    // Check if branch enum type exists
    const branchEnumResult = await client.query(`SELECT 1 FROM pg_type WHERE typname = 'branch'`);
    if (branchEnumResult.rowCount === 0) {
      await client.query(`CREATE TYPE "public"."branch" AS ENUM('CS', 'AIML', 'DS', 'ECS', 'ECE', 'CE', 'ME');`);
    }

    // Check if year enum type exists
    const yearEnumResult = await client.query(`SELECT 1 FROM pg_type WHERE typname = 'year'`);
    if (yearEnumResult.rowCount === 0) {
      await client.query(`CREATE TYPE "public"."year" AS ENUM('1st', '2nd', '3rd', '4th');`);
    }

    // Function to add column if it doesn't exist
    const addColumnIfNotExists = async (table: string, column: string, type: string, defaultVal: string = '') => {
      const colResult = await client.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
        [table, column]
      );
      if (colResult.rowCount === 0) {
        await client.query(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${type} ${defaultVal}`);
      }
    };

    // Add new columns to users table
    await addColumnIfNotExists('users', 'name', 'text');
    await addColumnIfNotExists('users', 'profile_picture', 'text');
    await addColumnIfNotExists('users', 'bio', 'text');
    await addColumnIfNotExists('users', 'branch', 'text');
    await addColumnIfNotExists('users', 'year', 'text');
    await addColumnIfNotExists('users', 'updated_at', 'timestamp', 'DEFAULT now()');

    // Add new columns to quizzes table
    await addColumnIfNotExists('quizzes', 'target_branch', 'text');
    await addColumnIfNotExists('quizzes', 'target_year', 'text');
    await addColumnIfNotExists('quizzes', 'is_started', 'boolean', 'DEFAULT false');
    await addColumnIfNotExists('quizzes', 'is_draft', 'boolean', 'DEFAULT true');

    // Migrate existing quizzes: set isDraft to false for all existing quizzes
    // so they remain visible to students after the new column is added
    await client.query(`UPDATE quizzes SET is_draft = false WHERE is_draft = true AND created_at < NOW() - INTERVAL '1 minute'`);

    // Add new columns to questions table
    await addColumnIfNotExists('questions', 'image_url', 'text');
    await addColumnIfNotExists('questions', 'option_images', 'text[]');

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

    // Create live_sessions table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS "live_sessions" (
        "id" serial PRIMARY KEY NOT NULL,
        "quiz_id" integer NOT NULL,
        "session_name" text NOT NULL,
        "status" text NOT NULL DEFAULT 'active',
        "started_at" timestamp DEFAULT now(),
        "ended_at" timestamp,
        "created_at" timestamp DEFAULT now()
      );
    `);

    await addColumnIfNotExists('results', 'points_earned', 'integer', 'DEFAULT 0');
    await addColumnIfNotExists('results', 'tab_switch_count', 'integer', 'DEFAULT 0');
    await addColumnIfNotExists('results', 'copy_paste_attempts', 'integer', 'DEFAULT 0');
    await addColumnIfNotExists('results', 'proctoring_flags', 'integer', 'DEFAULT 0');
    await addColumnIfNotExists('results', 'session_id', 'integer');
    await addColumnIfNotExists('quizzes', 'access_code', 'text');

    // Auto-generate unique access codes for existing quizzes if missing
    const missingCodesResult = await client.query(`SELECT id FROM quizzes WHERE access_code IS NULL OR access_code = ''`);
    if (missingCodesResult.rows.length > 0) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      for (const row of missingCodesResult.rows) {
        let code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        await client.query(`UPDATE quizzes SET access_code = $1 WHERE id = $2`, [code, row.id]);
      }
    }

    // Backfill is_draft for existing public quizzes where is_draft IS NULL
    await client.query(`UPDATE quizzes SET is_draft = false WHERE is_draft IS NULL AND is_public = true;`);
    await client.query(`UPDATE quizzes SET is_draft = true WHERE is_draft IS NULL AND (is_public = false OR is_public IS NULL);`);

    client.release();
    console.log('Schema changes applied successfully');
  } catch (error) {
    console.error('Error applying schema changes:', error);
  }
}

// Run schema changes immediately
applySchemaChanges();
