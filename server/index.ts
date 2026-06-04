import express, { type Request, Response, NextFunction } from "express";
import "./auth"; // Load auth module to register Express Request augmentation
import { registerRoutes } from "./routes";
import { registerAdminRoutes } from "./adminRoutes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { corsMiddleware } from "./cors";


const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

app.use(corsMiddleware);


export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  // Log raw request body when available for debugging JSON parse issues
  if ((req as any).rawBody) {
    try {
      const raw = (req as any).rawBody as Buffer;
      console.log("[raw-body]", raw.toString());
    } catch (e) {
      // ignore
    }
  }

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Clean log: just show method, path, status, and duration (no response body)
      const logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);
  await registerAdminRoutes(httpServer, app);
  const { registerAuthRoutes } = await import("./routes-auth");
  await registerAuthRoutes(httpServer, app);

  const { registerProfileOrdersRoutes } = await import("./routes-profile-orders");
  await registerProfileOrdersRoutes(httpServer, app);

  const { registerAddressRoutes } = await import("./routes-addresses");
  await registerAddressRoutes(httpServer, app);





  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // Basic health route for quick checks (returns JSON)
  app.get("/", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      message: "Server running",
      env: process.env.NODE_ENV || "development",
    });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  }

  // Vite dev handled separately via proxy

  // Windows-safe listen
  const port = parseInt(process.env.PORT || "3000", 10);

  httpServer.listen(port, () => {
    log(`🚀 Server running on http://localhost:${port}`);
  });
})();
