import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import svgr from "vite-plugin-svgr"

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/devdev/" : "/",
  plugins: [svgr({ include: "**/*.svg" }), react(), tailwindcss()],
  resolve: {
    alias: {
      "@landing": path.resolve(__dirname, "./landing"),
      "@auth": path.resolve(__dirname, "./auth"),
      "@trade-os": path.resolve(__dirname, "./trade-os"),
      "@snap": path.resolve(__dirname, "./snap"),
      "@share": path.resolve(__dirname, "./share"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
