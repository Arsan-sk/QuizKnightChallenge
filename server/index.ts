import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
// import "dotenv/config"; 
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

import { execSync } from "child_process";

(async () => {
  const server = registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const PORT = Number(process.env.PORT || 5000);
  const HOST = '0.0.0.0'; // Listen on all interfaces

  const startServer = () => {
    server.listen(PORT, HOST, () => {
      log(`serving on http://localhost:${PORT} and http://${process.env.HOST || '192.168.56.1'}:${PORT}`);
    });
  };

  server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      log(`Port ${PORT} is in use, attempting to kill the process...`);
      try {
        if (process.platform === 'win32') {
          execSync(`FOR /F "tokens=5" %a in ('netstat -aon ^| findstr :${PORT}') do taskkill /F /PID %a`, { stdio: 'ignore' });
        } else {
          execSync(`fuser -k ${PORT}/tcp`, { stdio: 'ignore' });
        }
        log(`Successfully killed process on port ${PORT}. Restarting server...`);
        setTimeout(startServer, 1000);
      } catch (err) {
        log(`Failed to kill process on port ${PORT}. Please kill it manually.`);
        process.exit(1);
      }
    } else {
      console.error(e);
    }
  });

  startServer();
})();
