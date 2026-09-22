import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import svgr from "vite-plugin-svgr"

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  // Local development only. Keep the reference credential in the dev server,
  // never in the browser bundle or the checked-in source.
  const referenceRoot = process.env.ECOYA_REFERENCE_ROOT ??
    "/Users/hans/orca/workspaces/ecoya-platform-user-frontend/로컬에서띄우기"
  const referenceBearer = command === "serve"
    ? loadEnv("development", referenceRoot, "NEXT_PUBLIC_DEV_BEARER").NEXT_PUBLIC_DEV_BEARER
    : undefined
  return {
  plugins: [svgr({ include: "**/*.svg" }), react(), tailwindcss()],
  resolve: {
    alias: {
      "@landing": path.resolve(__dirname, "./landing"),
      "@auth": path.resolve(__dirname, "./auth"),
      "@trade-os": path.resolve(__dirname, "./trade-os"),
      "@snap": path.resolve(__dirname, "./snap"),
      "@shared": path.resolve(__dirname, "./packages/shared-ui/src"),

      "@ecoya/ui": path.resolve(__dirname, "./packages/ecoya-ui/src"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/__reference3030/api/platform": {
        target: "http://127.0.0.1:3030",
        changeOrigin: true,
        rewrite: (url) => url.replace(/^\/__reference3030/, ""),
        configure(proxy) {
          proxy.on("proxyReq", (request) => {
            if (referenceBearer) request.setHeader("Authorization", `Bearer ${referenceBearer}`)
          })
        },
      },
    },
  },
  }
})
