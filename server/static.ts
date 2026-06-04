import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "../dist/client");
  if (!fs.existsSync(distPath)) {
    // If client build is not present, don't crash the server.
    // This allows deploying server-only builds (client hosted elsewhere).
    // Log a warning and skip static serving.
    // To force serving, ensure `dist/client` exists before starting the server.
    // eslint-disable-next-line no-console
    console.warn(
      `[serveStatic] build directory not found: ${distPath}. Skipping static file serving.`,
    );
    return;
  }

  app.use(express.static(distPath));

  // fall through to index.html for any non-API route
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
