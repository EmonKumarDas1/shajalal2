import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { tempo } from "tempo-devtools/dist/vite";

const conditionalPlugins: [string, Record<string, any>][] = [];

// @ts-ignore
if (process.env.TEMPO === "true") {
  conditionalPlugins.push(["tempo-devtools/swc", {}]);
}

// https://vitejs.dev/config/
export default defineConfig({
  base:
    process.env.NODE_ENV === "development"
      ? "/"
      : process.env.VITE_BASE_PATH || "/",
  optimizeDeps: {
    entries: ["src/main.tsx", "src/tempobook/**/*"],
  },
  plugins: [
    react({
      plugins: conditionalPlugins,
    }),
    tempo(),
  ],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // @ts-ignore
    allowedHosts: true,
  },
  build: {
    sourcemap: true, // Keep sourcemaps for debugging
    chunkSizeWarningLimit: 2000, // Increase limit to suppress chunk size warnings (e.g., 2000 kB)
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress all warnings
        return;
      },
      output: {
        // Optional: Manual chunking to reduce chunk sizes (example)
        manualChunks: {
          vendor: ["react", "react-dom", "framer-motion"],
          utils: ["date-fns", "clsx", "tailwind-merge"],
        },
      },
    },
  },
  esbuild: {
    logOverride: {
      "this-is-undefined-in-esm": "silent",
      "ts-error": "silent",
      "sourcemap-error": "silent", // Suppress sourcemap-related errors
    },
  },
});