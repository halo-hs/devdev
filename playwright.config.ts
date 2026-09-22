import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: {
    timeout: 8_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  projects: [
    { name: "chrome", use: { channel: "chrome" } },
    {
      name: "firefox",
      testMatch: [
        "**/erp-popup-layering.spec.ts",
        "**/erp-ai-handoff.spec.ts",
        "**/erp-deal-additions.spec.ts",
        "**/erp-document-workspace.spec.ts",
      ],
      use: { browserName: "firefox" },
    },
    {
      name: "webkit",
      testMatch: [
        "**/erp-popup-layering.spec.ts",
        "**/erp-ai-handoff.spec.ts",
        "**/erp-deal-additions.spec.ts",
        "**/erp-document-workspace.spec.ts",
      ],
      use: { browserName: "webkit" },
    },
  ],
  use: {
    baseURL: "http://127.0.0.1:5175",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5175",
    url: "http://127.0.0.1:5175/dashboard",
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
