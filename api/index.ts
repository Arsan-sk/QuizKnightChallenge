import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Trust proxy for Vercel serverless environment
app.set("trust proxy", 1);

// Register API routes
registerRoutes(app);

// Global Error Handler for Vercel Serverless Function
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("Vercel Serverless Function Error:", err);
  if (!res.headersSent) {
    res.status(status).json({ message });
  }
});

export default app;
