import express from "express";
import { registerRoutes } from "../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Trust proxy for Vercel serverless environment
app.set("trust proxy", 1);

// Register API routes
registerRoutes(app);

export default app;
