/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          documents: ["jszip", "pptxgenjs"],
          analytics: ["sql.js"],
        },
      },
    },
  },
  test: { environment: "jsdom", setupFiles: ["src/test/setup.ts"], testTimeout: 30000 },
});
