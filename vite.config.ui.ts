import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
//
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  root: "src/ui",
  build: {
    outDir: "../../dist-ui",
    emptyOutDir: true,
  },
  server: {
    port: 5123,
    strictPort: true,
  }
});
