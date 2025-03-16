import { defineConfig } from "drizzle-kit";
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL not found in environment variables");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
});
