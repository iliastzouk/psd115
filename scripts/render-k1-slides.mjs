/**
 * Rasterize K1 PDF to PNGs: public/week1/slides/slide-01.png … slide-35.png
 * Run: node scripts/render-k1-slides.mjs
 */
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { pdf } from 'pdf-to-img'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const pdfPath = path.join(root, 'public', 'week1', 'k1-psd115.pdf')
const outDir = path.join(root, 'public', 'week1', 'slides')

/** 1.25–2: μεγαλύτερο = ευκρινέστερα αλλά βαρύτερα αρχεία */
const SCALE = Number(process.env.K1_SLIDE_SCALE || 1.35)

await mkdir(outDir, { recursive: true })
const doc = await pdf(pdfPath, { scale: SCALE })
let n = 0
for await (const image of doc) {
  n += 1
  const name = `slide-${String(n).padStart(2, '0')}.png`
  await writeFile(path.join(outDir, name), image)
  console.log('Wrote', name, `(${image.length} bytes)`)
}
console.log('Done:', n, 'pages')
