import { readdir, rm } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const dist = resolve(dirname(fileURLToPath(import.meta.url)), "../../dist")
const localDirectories = new Set([
  "reference-3030", ".netlify", ".wrangler", ".gstack", ".playwright-mcp",
  ".playwright-cli", "node_modules", "test-results", "playwright-report", "coverage",
])

// Vite copies public/ independently of Git. Keep local artifacts out of uploads,
// including ignored reference folders that might be copied back during review.
async function clean(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    const localFile = entry.name === ".DS_Store" || /^\.env(?:\.|$)/.test(entry.name)
      || /^(?:README|source-manifest)\.(?:md|json)$/i.test(entry.name)
      || /\.(?:log|tsbuildinfo)$/.test(entry.name)
    if (localDirectories.has(entry.name) || localFile) {
      await rm(path, { recursive: true, force: true })
    } else if (entry.isDirectory()) {
      await clean(path)
    }
  }
}

await clean(dist)
console.log("Deployment output excludes local references, credentials and tool artifacts.")
