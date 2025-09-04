import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
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
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@supabase') || id.includes('supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('lucide') || id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            return 'vendor'; // Other node_modules
          }
          
          // Feature-based chunks
          if (id.includes('whatsapp')) {
            return 'whatsapp-features';
          }
          if (id.includes('dashboard')) {
            return 'dashboard-features';
          }
          if (id.includes('salesFunnel') || id.includes('sales')) {
            return 'sales-features';
          }
          if (id.includes('ai-agent')) {
            return 'ai-features';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Increase limit to reduce warnings
  }
}));
