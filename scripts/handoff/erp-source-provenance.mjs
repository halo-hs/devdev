import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"

const exec = promisify(execFile)

/** A commit alone cannot identify an export made from this working tree. */
export async function erpSourceProvenance() {
  const { stdout: revision } = await exec("git", ["rev-parse", "HEAD"])
  const { stdout: status } = await exec("git", ["status", "--porcelain"])
  const { stdout: files } = await exec("git", [
    "ls-files", "--cached", "--others", "--exclude-standard", "-z",
    "src", "packages", "scripts", "package.json", "package-lock.json", "vite.config.ts",
  ], { maxBuffer: 8 * 1024 * 1024 })
  const hash = createHash("sha256")
  for (const file of [...new Set(files.split("\0").filter(Boolean))].sort()) {
    if (file.includes("/dist/") || file.includes("/node_modules/")) continue
    hash.update(file + "\0")
    try { hash.update(await readFile(file)) }
    catch (error) {
      if (error.code !== "ENOENT") throw error
      hash.update("DELETED")
    }
    hash.update("\0")
  }
  return {
    sourceCommit: revision.trim(),
    sourceWorktreeState: status.trim() ? "WORKTREE_UNVERIFIED" : "COMMITTED",
    sourceFingerprint: hash.digest("hex"),
  }
}
