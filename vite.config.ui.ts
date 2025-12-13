import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  root: "src/ui",
  build: {
    outDir: "../../dist-ui",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      // Force all imports of 'react' to resolve to the root node_modules
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
    // explicit dedupe is sometimes needed for packages like lucide-react
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // Prevent Vite from caching/bundling these; force it to use the aliased version
    include: ['lucide-react'],
  },
  server: {
    port: 5123,
    strictPort: true,
  }
});
