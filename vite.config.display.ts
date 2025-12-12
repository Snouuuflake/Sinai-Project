import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  root: "src/display",
  build: {
    outDir: "../../dist-display",
    emptyOutDir: true,
  },
  server: {
    port: 5124,
    strictPort: true,
  }
});
