import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// The dashboard is deployed at https://junaid-kameleoon.github.io/Claude/dashboard/
// and its build output is written into ../public/dashboard so the existing
// "publish public/ as-is" GitHub Pages workflow picks it up with no changes.
export default defineConfig({
  base: "/Claude/dashboard/",
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL("../public/dashboard", import.meta.url)),
    emptyOutDir: true,
  },
});
