/**
 * Rasterize K2 PDF → public/week2/slides/slide-01.png … slide-44.png
 * Run: node scripts/render-k2-slides.mjs
 */
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { pdf } from 'pdf-to-img'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const pdfPath = path.join(root, 'public', 'week2', 'k2-psd115.pdf')
const outDir = path.join(root, 'public', 'week2', 'slides')

const SCALE = Number(process.env.K2_SLIDE_SCALE || 1.35)

await mkdir(outDir, { recursive: true })
const doc = await pdf(pdfPath, { scale: SCALE })
let n = 0
for await (const image of doc) {
  n += 1
  const name = `slide-${String(n).padStart(2, '0')}.png`
  await writeFile(path.join(outDir, name), image)
  console.log('Wrote', name)
}
console.log('Done:', n, 'pages')
