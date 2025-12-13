import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    base: "./",
    root: "src/ui",
    build: {
        outDir: "../../dist-ui",
        emptyOutDir: true,
    },
    // resolve: {
    //   dedupe: ['react', 'react-dom'],
    //   alias: n{
    //     react: path.resolve(__dirname, 'node_modules/react'),
    //     'react-dom': path.resolve(__dirname, 'node_modules/react-dom')
    //   }
    // },
    server: {
        port: 5123,
        strictPort: true,
    }
});
