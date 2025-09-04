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
    minify: 'esbuild', // ESBuild é mais seguro que Terser para hoisting
    rollupOptions: {
      treeshake: {
        // Configuração conservadora de tree-shaking
        preset: 'safest'
      },
      output: {
        // Usar bundle único para evitar completamente problemas de ordem de inicialização
        inlineDynamicImports: true,
        manualChunks: undefined,
        // Configurações para prevenir problemas de hoisting
        hoistTransitiveImports: false
      }
    },
    chunkSizeWarningLimit: 10000,
    // Configurações adicionais para resolver problemas de dependência
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  }
}));
