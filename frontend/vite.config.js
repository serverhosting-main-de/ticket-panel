import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    hmr: false,
    watch: {
      usePolling: true,
    },
    allowedHosts: ["tickets.wonder-craft.de"], // wieder hinzugefügt
  },
});
