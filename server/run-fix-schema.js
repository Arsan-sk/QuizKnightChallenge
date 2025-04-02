// Execute the migration to fix all the schema issues
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
      path.join(__dirname, 'migrations', 'fix_achievements_schema_full.sql'),
      'utf8'
    );

    // Execute the migration
    await client.query(migrationSQL);
    console.log('Schema fix migration executed successfully');

    // Verify the columns exist
    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'achievements'
      ORDER BY column_name
    `);
    
    console.log('Achievement table columns:');
    checkResult.rows.forEach(row => {
      console.log(`- ${row.column_name}`);
    });

  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    await client.end();
  }
}

runMigration(); 