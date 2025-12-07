#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const migrationArg = process.argv[2];
if (!migrationArg) {
  console.error('Usage: node scripts/runMigrationFile.js <path-to-sql-file>');
  process.exit(1);
}

const migrationFile = path.isAbsolute(migrationArg)
  ? migrationArg
  : path.join(process.cwd(), migrationArg);

if (!fs.existsSync(migrationFile)) {
  console.error('Migration file not found:', migrationFile);
  process.exit(1);
}

const sql = fs.readFileSync(migrationFile, 'utf8');

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const client = await pool.connect();
  try {
    console.log('Starting migration:', migrationFile);
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Migration executed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
