import { cp, mkdir } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const designSystemFonts = resolve(
  projectRoot,
  "packages/design-system-2.0/public/fonts"
)
const appFonts = resolve(projectRoot, "public/fonts")

await mkdir(appFonts, { recursive: true })
await cp(designSystemFonts, appFonts, { recursive: true, force: true })
