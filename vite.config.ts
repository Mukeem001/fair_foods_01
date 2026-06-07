import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { metaImagesPlugin } from "./vite-plugin-meta-images";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: "client",
  define: {
    __VITE_API_BASE_URL__: JSON.stringify(
      // Always use absolute URL for production (Hostinger),
      // only use relative /api for local development
      process.env.VITE_API_BASE_URL || (
        // Use absolute URL if: explicitly set NODE_ENV=production, or building for dist
        process.env.NODE_ENV === "production" || process.env.VITE_BUILD_FOR_PRODUCTION === "true"
          ? "https://fair-foods-01.onrender.com/api"
          : "/api"
      )
    ),
  },
  server: {
    port: Number(process.env.VITE_PORT || 5173),
    strictPort: false,
    proxy: {
      // Dev: same-origin /api avoids CORS. Default = Render; use local server with `npm run dev`.
      "/api": {
        target: process.env.VITE_DEV_API_PROXY || "https://fair-foods-01.onrender.com",
        changeOrigin: true,
        secure: true,
      },
    },
    host: true,
  },
  build: {
    outDir: "../dist/public",
  },
});
