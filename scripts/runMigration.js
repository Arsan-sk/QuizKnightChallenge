import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create database connection
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/quizapp'
});

async function runMigration() {
  try {
    console.log('Starting database migration...');
    
    // Read the migration file
    const migrationFile = path.join(path.dirname(__dirname), 'migrations', 'add_enhanced_quiz_features.sql');
    const sql = fs.readFileSync(migrationFile, 'utf-8');
    
    // Connect to the database
    const client = await pool.connect();
    
    try {
      // Begin transaction
      await client.query('BEGIN');
      
      console.log('Executing migration...');
      // Execute the SQL
      await client.query(sql);
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log('Migration completed successfully');
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      console.error('Migration failed:', error);
      process.exit(1);
    } finally {
      // Release the client
      client.release();
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

runMigration(); 