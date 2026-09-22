import { fileURLToPath } from "node:url"
import { resolve } from "node:path"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const packageRoot = fileURLToPath(new URL(".", import.meta.url))

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: true,
    lib: {
      entry: resolve(packageRoot, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: ["react", "react-dom", "clsx", "tailwind-merge"],
    },
  },
})
