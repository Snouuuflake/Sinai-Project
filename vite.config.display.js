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
    // resolve: {
    //   dedupe: ['react', 'react-dom'],
    //   alias: {
    //     react: require.resolve('react'),
    //     'react-dom': require.resolve('react-dom')
    //   }
    // },
    server: {
        port: 5124,
        strictPort: true,
    }
});
