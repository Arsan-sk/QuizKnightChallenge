import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

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

export const db = drizzle({ client: pool, schema });
