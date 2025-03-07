import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    host: "0.0.0.0", // Erlaubt Zugriff   ber das Netzwerk
    port: 5173, // Setzt den Port fest
    strictPort: true, // Verhindert, dass Vite auf einen anderen Port ausweicht
    watch: {
      usePolling: true, // Hilft bei Datei  nderungen in Docker-Containern
    },
    allowedHosts: ["tickets.wonder-craft.de"],
  },
});
