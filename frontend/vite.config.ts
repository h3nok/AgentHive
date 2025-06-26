import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@core": path.resolve(__dirname, "./src/core"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@app": path.resolve(__dirname, "./src/app"),
      "@components": path.resolve(__dirname, "./src/shared/components"),
      "@ui": path.resolve(__dirname, "./src/shared/components/ui"),
      "@hooks": path.resolve(__dirname, "./src/shared/hooks"),
      "@utils": path.resolve(__dirname, "./src/shared/utils"),
      "@types": path.resolve(__dirname, "./src/shared/types"),
      "@constants": path.resolve(__dirname, "./src/shared/constants"),
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
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/lease-abstraction-poc-api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/lease-abstraction-poc-api/, ''),
      },
    },
  },
})
