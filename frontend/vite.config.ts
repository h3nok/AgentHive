import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      // Fix missing deep import in react-syntax-highlighter v15.6 – some deps still refer to dist/index.js
      "react-syntax-highlighter/dist/index.js":
        "react-syntax-highlighter/dist/esm/index.js",
      "react-syntax-highlighter/dist/index":
        "react-syntax-highlighter/dist/esm/index.js",
      "ubiqora-ai-widget": path.resolve(__dirname, "../packages/tsc-ai-widget/src"),
      // Keep backward compatibility during transition
      "tsc-ai-widget": path.resolve(__dirname, "../packages/tsc-ai-widget/src"),
    },
  },
  // Optimize dependencies to handle ESBuild service stopping
  optimizeDeps: {
    // Force include commonly problematic dependencies
    include: ['react', 'react-dom', '@radix-ui/react-slot']
  },
  // Build configuration
  build: {
    // Increase build timeout and handle warnings
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress esbuild service stopped warnings
        if (warning.code === 'ESBUILD_SERVICE_STOPPED') return
        warn(warning)
      }
    },
    // Increase chunk size limit for better performance
    chunkSizeWarningLimit: 1000
  },
  server: {
    // Docker-specific server configuration
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Add watch options for Docker environments
    watch: {
      usePolling: true,
      interval: 1000,
    },
    proxy: {
      // Forward API calls to the local FastAPI backend
      '/lease-abstraction-poc-api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/lease-abstraction-poc-api/, ''),
      },
    },
  },
})
