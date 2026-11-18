import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";

/**
 * Builds Planner as a Suite Go pack: one HTML page, one bundle, its own everything.
 *
 * The renderer is imported, not copied. `apps/desktop/src/renderer` is already a plain Vite app —
 * no Node builtins, no Electron import — and the only machine access it has is `window.suitePlanner`,
 * which the prelude in `src/main.ts` installs before importing it.
 *
 * `base: "./"` because a pack is served from `/_capacitor_file_/…` inside the app, not from a domain
 * root. `optimizeDeps.exclude` because Loro ships a wasm-bindgen entry whose URL pre-bundling breaks.
 */
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: "./",
  plugins: [react(), tailwindcss(), wasm()],
  resolve: {
    alias: {
      "@suite/planner-core": fileURLToPath(
        new URL("../../packages/core/src/index.ts", import.meta.url),
      ),
      "@renderer": fileURLToPath(new URL("../desktop/src/renderer/src", import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ["loro-crdt"],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
    // A pack is a page, so the entry is the HTML and the script is a module beside it.
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
