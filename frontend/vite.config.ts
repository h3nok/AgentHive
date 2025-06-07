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
  server: {
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
