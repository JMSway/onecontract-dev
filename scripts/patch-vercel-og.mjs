import { existsSync, writeFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const ogDir = join(projectRoot, 'node_modules/next/dist/compiled/@vercel/og')

if (!existsSync(ogDir)) {
  process.exit(0)
}

const STUB_MARKER = '/* @onecontract: stubbed to strip resvg/yoga wasm (~1 MiB) */'
const stub = `${STUB_MARKER}
class ImageResponse extends Response {
  constructor() {
    throw new Error('ImageResponse is not supported in this build; remove @vercel/og stub in scripts/patch-vercel-og.mjs if you need it.')
  }
}
export { ImageResponse }
`

const targets = ['index.edge.js', 'index.node.js']
let patched = 0
for (const name of targets) {
  const file = join(ogDir, name)
  if (!existsSync(file)) continue
  const size = statSync(file).size
  if (size < 2000) continue
  writeFileSync(file, stub)
  patched++
  console.log(`[patch-vercel-og] stubbed ${name} (${(size / 1024).toFixed(0)} KiB → ${stub.length} B)`)
}

const wasmFiles = ['resvg.wasm', 'yoga.wasm']
for (const name of wasmFiles) {
  const file = join(ogDir, name)
  if (!existsSync(file)) continue
  const size = statSync(file).size
  if (size < 100) continue
  writeFileSync(file, '')
  patched++
  console.log(`[patch-vercel-og] emptied ${name} (${(size / 1024).toFixed(0)} KiB → 0 B)`)
}

if (patched === 0) {
  console.log('[patch-vercel-og] nothing to patch (already stubbed or files missing)')
}
