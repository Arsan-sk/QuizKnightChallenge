// Execute the migration to fix the achievements table schema
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load environment variables from .env file
config({ path: path.resolve(process.cwd(), '../.env') });

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  // Use the same connection string as in the .env file
  const connectionString = process.env.DATABASE_URL || 'postgresql://myktc:myktc09@localhost:5432/myktcdb';
  
  const client = new Client({
    connectionString
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read the migration file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'fix_achievements_schema.sql'),
      'utf8'
    );

    // Execute the migration
    await client.query(migrationSQL);
    console.log('Migration executed successfully');

  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    await client.end();
  }
}

runMigration(); 