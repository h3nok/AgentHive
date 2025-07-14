import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8001';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    base: env.VITE_BASE_URL || '/',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@core': path.resolve(__dirname, './src/core'),
        '@shared': path.resolve(__dirname, './src/shared'),
        '@app': path.resolve(__dirname, './src/app'),
        '@components': path.resolve(__dirname, './src/shared/components'),
        '@ui': path.resolve(__dirname, './src/shared/components/ui'),
        '@hooks': path.resolve(__dirname, './src/shared/hooks'),
        '@utils': path.resolve(__dirname, './src/shared/utils'),
        '@types': path.resolve(__dirname, './src/shared/types'),
        '@constants': path.resolve(__dirname, './src/shared/constants'),
        'react-syntax-highlighter/dist/index.js': 'react-syntax-highlighter/dist/esm/index.js',
        'react-syntax-highlighter/dist/index': 'react-syntax-highlighter/dist/esm/index.js',
        'ubiqora-ai-widget': path.resolve(__dirname, '../packages/tsc-ai-widget/src'),
        'tsc-ai-widget': path.resolve(__dirname, '../packages/tsc-ai-widget/src')
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom', '@radix-ui/react-slot']
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode !== 'production',
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === 'ESBUILD_SERVICE_STOPPED') return;
          warn(warning);
        }
      },
      chunkSizeWarningLimit: 1000
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      watch: {
        usePolling: true,
        interval: 1000
      },
      proxy: {
        '/api': {
          target: API_BASE_URL,
          changeOrigin: true,
          secure: false,
        },
        '/v1': {
          target: API_BASE_URL,
          changeOrigin: true,
          secure: false,
        },
        '/health': {
          target: API_BASE_URL,
          changeOrigin: true,
          secure: false,
        },
        '/lease-abstraction-poc-api': {
          target: API_BASE_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/lease-abstraction-poc-api/, '')
        }
      }
    }
  };
});
