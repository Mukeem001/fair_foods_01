import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.log(
      `[INFO] Static files not found at ${distPath} - skipping static file serving (client hosted separately)`,
    );
    return;
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist (but NOT for API routes)
  app.use("/{*path}", (req, res) => {
    // Don't serve index.html for API routes - let them 404 properly
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
