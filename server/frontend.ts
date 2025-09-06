import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple health check for frontend
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'frontend' });
});

(async () => {
  const server = createServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Setup vite for development or serve static files for production
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Frontend serves on port 5000 (0.0.0.0 for Replit compatibility)
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0", // Frontend uses 0.0.0.0 for Replit proxy
    reusePort: true,
  }, () => {
    log(`frontend serving on port ${port}`, "frontend");
  });
})();