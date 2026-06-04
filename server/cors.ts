import type { Request, Response, NextFunction } from "express";

// Keep this tight for security. Add more origins if needed.
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:3000",
  "http://172.16.2.64:5173",
  "https://fairfoods.in",
  "https://www.fairfoods.in",
]);

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin ? String(req.headers.origin) : "";
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-admin-key, admin-token"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
}

