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
    minify: 'esbuild', // ESBuild é mais seguro para evitar problemas de hoisting
    rollupOptions: {
      output: {
        // Bundle único para evitar problemas de ordem de inicialização
        inlineDynamicImports: false,
        manualChunks: undefined,
        // Previne problemas de hoisting
        hoistTransitiveImports: false,
      },
    },
    chunkSizeWarningLimit: 3000,
    cssCodeSplit: false, // CSS em um único arquivo
    sourcemap: false,
    reportCompressedSize: false,
    // Configurações para resolver problemas de dependência
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    exclude: ['lovable-tagger'], // Exclui do bundle de desenvolvimento
  },
}));
