/**
 * Vercel Serverless Function Entry Point (SOURCE FILE)
 * 
 * This file is bundled by esbuild during `npm run build` into `api/index.mjs`.
 * Vercel picks up api/index.mjs as a serverless function for all /api/* requests.
 * 
 * All server/* and shared/* imports are resolved at build time by esbuild,
 * so the output is a single self-contained file with no unresolved imports.
 */
import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Trust proxy for Vercel serverless environment
app.set("trust proxy", 1);

// Register all API routes (auth, quizzes, results, stats, etc.)
registerRoutes(app);

// Global error handler - ensures unhandled errors return JSON, not crash the function
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Vercel API Error:", err?.message || err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  if (!res.headersSent) {
    res.status(status).json({ message });
  }
});

export default app;
