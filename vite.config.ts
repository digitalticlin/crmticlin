
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    cors: true,
    allowedHosts: ["4c4dc1c7-bbf2-4759-9f87-48d9b07a71c7.lovableproject.com"],
    proxy: {
      // Proxy API requests to avoid CORS issues
      '/evolution-api': {
        target: process.env.EVOLUTION_API_URL || 'https://api.example.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/evolution-api/, '')
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
