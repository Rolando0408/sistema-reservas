import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path"; // <-- 1. Importa 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // <-- 2. Añade esta sección de 'resolve'
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["date-fns-tz"], // Fuerza a Vite a pre-compilar esta dependencia
  },
});
