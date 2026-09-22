import { cp, mkdir } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const packageRoot = dirname(fileURLToPath(import.meta.url))
const sourceRoot = resolve(packageRoot, "..")
const distRoot = resolve(sourceRoot, "dist")

await mkdir(distRoot, { recursive: true })
await cp(resolve(sourceRoot, "src/tokens.css"), resolve(distRoot, "tokens.css"))
await cp(resolve(sourceRoot, "src/styles.css"), resolve(distRoot, "styles.css"))
