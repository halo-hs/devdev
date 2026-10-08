import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
const base = '/devdev/'
// Public assets are referenced from CSS/JS as root paths; imported Vite assets
// already use the configured base. Rewrite only known static asset directories.
async function rewrite(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) await rewrite(path)
    else if (/\.(js|css|html)$/.test(entry.name)) {
      const source = await readFile(path, 'utf8')
      const result = source.replace(/(["'`(])\/(assets|images|fonts|lottie|html)\//g, `$1${base}$2/`)
      if (result !== source) await writeFile(path, result)
    }
  }
}
await rewrite('dist')
await writeFile('dist/.nojekyll', '')
await writeFile('dist/404.html', `<!doctype html><meta charset="utf-8"><title>미리보기 열기</title><script>const b=${JSON.stringify(base)};const p=location.pathname.startsWith(b)?location.pathname.slice(b.length-1):'/';location.replace(b+'?__pages_route='+encodeURIComponent(p+location.search+location.hash));</script>`)
await writeFile('dist/preview-version.json', JSON.stringify({ commit: process.env.GITHUB_SHA || null, branch: process.env.GITHUB_REF_NAME || null }))
