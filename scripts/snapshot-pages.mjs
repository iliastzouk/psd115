/**
 * Ντετερμινιστικό snapshot των σελίδων του PSD115 (Φάση 6d, Δ3): ελέγχει ότι η αναδιοργάνωση του περιεχομένου (manifest,
 * ενιαίο registry, γενικά components) δεν αλλάζει τίποτα από όσα βλέπει ο χρήστης.
 *
 *  - Διαδρομές από τον κατάλογο περιεχομένου, με σταθερή σειρά (scripts/snapshot-routes.mjs): αρχική μαθημάτων, αρχική
 *    του μαθήματος, units (κατά `order`), θέματα (σειρά του topics.js), εργαλεία μελέτης, έγγραφα, πρόοδος. Η λίστα
 *    διαδρομών είναι μέρος του snapshot.
 *  - Κάθε διαδρομή σε ΝΕΟ browser context: μόνο `psd115-disclaimer-v1=1` και `psd115-w1-theme=light`, κανένα κλειδί
 *    προόδου· σταθερό seed για το `Math.random`, σταθερό ρολόι, viewport 1280×900, locale el-GR, ζώνη ώρας Europe/Athens.
 *  - Καταγράφεται: τελικό URL, `document.title`, h1–h3 με τη σειρά, links του `#main-content` (href + κείμενο), checkboxes
 *    (id / name και κατάσταση) και τα ορατά μπλοκ κειμένου του `#main-content` με τη σειρά. Κενά κανονικοποιούνται·
 *    CSS classes, hashes των assets και διακοσμητικά `aria-hidden` αγνοούνται.
 *
 * Προϋπόθεση: `npm run build` (dist/ μέσω `vite preview`).
 * Run:  node scripts/snapshot-pages.mjs            σύγκριση με το baseline (αποτυγχάνει σε κάθε διαφορά)
 *       node scripts/snapshot-pages.mjs --write    δύο πλήρεις εκτελέσεις· γράφει το baseline ΜΟΝΟ αν είναι ίδιες
 *       node scripts/snapshot-pages.mjs --out f    γράφει την τρέχουσα καταγραφή στο f (για διερεύνηση διαφορών)
 */
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { fileURLToPath, pathToFileURL } from 'url'
import { chromium } from 'playwright'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const imp = (rel) => import(pathToFileURL(path.join(root, rel)).href)
const PORT = Number(process.env.SNAPSHOT_PORT ?? 4319)
const BASE = `http://localhost:${PORT}`
const BASELINE = path.join(root, 'tests/fixtures/psd115-pages.snapshot.json')
const COURSE_ID = 'psd115'
const SEED = 115
const CLOCK = '2026-10-15T09:00:00.000Z'
const VIEWPORT = { width: 1280, height: 900 }
const SETTINGS = { 'psd115-disclaimer-v1': '1', 'psd115-w1-theme': 'light' }

const args = process.argv.slice(2)
const WRITE = args.includes('--write')
const OUT = args.includes('--out') ? args[args.indexOf('--out') + 1] : null

if (!fs.existsSync(path.join(root, 'dist/index.html'))) {
  console.error('✗ Δεν υπάρχει dist/. Τρέξε πρώτα: npm run build')
  process.exit(1)
}

// --- Διαδρομές: από τον κατάλογο (ίδιο API πριν και μετά την αναδιοργάνωση), scripts/snapshot-routes.mjs ---
const { snapshotRoutes } = await imp('scripts/snapshot-routes.mjs')

// --- Καταγραφή μέσα στη σελίδα ---
function captureInPage() {
  const norm = (s) => (s ?? '').replace(/\s+/g, ' ').trim()
  const main = document.getElementById('main-content')
  const hiddenDeco = (el) => Boolean(el.closest('[aria-hidden="true"]'))
  const visible = (el) => (typeof el.checkVisibility === 'function' ? el.checkVisibility() : el.offsetParent !== null || el === document.body)
  const textOf = (el) => {
    const parts = []
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    for (let n = walk.nextNode(); n; n = walk.nextNode()) if (!hiddenDeco(n.parentElement)) parts.push(n.nodeValue)
    return norm(parts.join(''))
  }
  const assetHash = (href) => href.replace(/-[A-Za-z0-9_-]{8}(\.[a-z0-9]+)(?=$|[?#])/g, '-[hash]$1')
  const headings = [...document.querySelectorAll('h1, h2, h3')]
    .filter((h) => visible(h) && !hiddenDeco(h))
    .map((h) => `${h.tagName.toLowerCase()} ${textOf(h)}`)
  if (!main) return { url: location.pathname + location.search, title: document.title, headings, links: [], checkboxes: [], blocks: [], noMain: true }
  const links = [...main.querySelectorAll('a[href]')]
    .filter((a) => visible(a) && !hiddenDeco(a))
    .map((a) => [assetHash(a.getAttribute('href')), textOf(a)])
  // Checkboxes: id / name (αν υπάρχουν), κείμενο της ετικέτας τους και κατάσταση.
  const checkboxes = [...main.querySelectorAll('input[type="checkbox"]')].map((c) => [
    c.id || c.name || '',
    norm(c.getAttribute('aria-label')) || (c.closest('label') ? textOf(c.closest('label')) : c.labels?.[0] ? textOf(c.labels[0]) : ''),
    c.checked,
  ])
  // Μπλοκ κειμένου: κάθε ορατό κείμενο ομαδοποιείται στον πλησιέστερο πρόγονο που δεν είναι inline.
  const blocks = []
  let current = null
  let buf = []
  const flush = () => {
    const t = norm(buf.join(''))
    if (t) blocks.push(t)
    buf = []
  }
  const blockOf = (el) => {
    for (let e = el; e && e !== main; e = e.parentElement) if (!getComputedStyle(e).display.startsWith('inline')) return e
    return main
  }
  const walk = document.createTreeWalker(main, NodeFilter.SHOW_TEXT)
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const p = n.parentElement
    if (!p || hiddenDeco(p) || !visible(p) || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.tagName)) continue
    if (!n.nodeValue.trim()) continue
    const b = blockOf(p)
    if (b !== current) {
      flush()
      current = b
    }
    buf.push(n.nodeValue)
  }
  flush()
  return { url: location.pathname + location.search, title: document.title, headings, links, checkboxes, blocks }
}

// --- Server / browser ---
const server = spawn(path.join(root, 'node_modules/.bin/vite'), ['preview', '--port', String(PORT), '--strictPort'], { cwd: root, stdio: 'ignore' })
const stopServer = () => {
  try {
    server.kill()
  } catch {
    /* ignore */
  }
}
process.on('exit', stopServer)

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(BASE)).ok) return
    } catch {
      /* not yet */
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`Ο server δεν ξεκίνησε στο ${BASE}`)
}

async function launch() {
  const exe = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  if (exe) return chromium.launch({ executablePath: exe })
  try {
    return await chromium.launch()
  } catch (e) {
    const dir = process.env.PLAYWRIGHT_BROWSERS_PATH
    const found =
      dir && fs.existsSync(dir)
        ? fs
            .readdirSync(dir)
            .filter((d) => /^chromium-\d+$/.test(d))
            .map((d) => path.join(dir, d, 'chrome-linux', 'chrome'))
            .find((p) => fs.existsSync(p))
        : null
    if (!found) throw e
    return chromium.launch({ executablePath: found })
  }
}

async function capture(browser, route) {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, locale: 'el-GR', timezoneId: 'Europe/Athens', reducedMotion: 'reduce' })
  try {
    await context.clock.setFixedTime(new Date(CLOCK))
    await context.addInitScript(
      ({ settings, seed }) => {
        for (const [k, v] of Object.entries(settings)) localStorage.setItem(k, v)
        // mulberry32: ίδια ακολουθία σε κάθε φόρτωση.
        let a = seed >>> 0
        Math.random = () => {
          a = (a + 0x6d2b79f5) >>> 0
          let t = a
          t = Math.imul(t ^ (t >>> 15), t | 1)
          t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296
        }
      },
      { settings: SETTINGS, seed: SEED },
    )
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(String(e.message ?? e)))
    await page.goto(BASE + route, { waitUntil: 'networkidle' })
    await page.waitForSelector('#main-content', { timeout: 10000 })
    // Σταθεροποίηση: δύο διαδοχικές ίδιες καταγραφές.
    let prev = null
    for (let i = 0; i < 40; i++) {
      const snap = JSON.stringify(await page.evaluate(captureInPage))
      if (snap === prev) return { route, ...JSON.parse(snap), ...(errors.length ? { errors } : {}) }
      prev = snap
      await page.waitForTimeout(150)
    }
    throw new Error(`${route}: η σελίδα δεν σταθεροποιήθηκε`)
  } finally {
    await context.close()
  }
}

async function runOnce(browser, routes) {
  const pages = []
  for (const r of routes) pages.push(await capture(browser, r))
  return { course: COURSE_ID, settings: SETTINGS, viewport: VIEWPORT, clock: CLOCK, seed: SEED, routes, pages }
}

function diff(expected, actual) {
  const out = []
  if (JSON.stringify(expected.routes) !== JSON.stringify(actual.routes)) {
    const a = new Set(actual.routes)
    const e = new Set(expected.routes)
    out.push(`λίστα διαδρομών: −[${expected.routes.filter((r) => !a.has(r)).join(', ')}] +[${actual.routes.filter((r) => !e.has(r)).join(', ')}]${expected.routes.filter((r) => a.has(r)).join() !== actual.routes.filter((r) => e.has(r)).join() ? ' (και αλλαγή σειράς)' : ''}`)
  }
  const byRoute = Object.fromEntries(actual.pages.map((p) => [p.route, p]))
  for (const ep of expected.pages) {
    const ap = byRoute[ep.route]
    if (!ap) continue
    for (const k of new Set([...Object.keys(ep), ...Object.keys(ap)])) {
      const ev = JSON.stringify(ep[k])
      const av = JSON.stringify(ap[k])
      if (ev === av) continue
      if (Array.isArray(ep[k]) && Array.isArray(ap[k])) {
        const i = ep[k].findIndex((x, j) => JSON.stringify(x) !== JSON.stringify(ap[k][j]))
        const at = i < 0 ? Math.min(ep[k].length, ap[k].length) : i
        out.push(`${ep.route} · ${k}[${at}] (${ep[k].length}→${ap[k].length}): ${JSON.stringify(ep[k][at])?.slice(0, 160)} → ${JSON.stringify(ap[k][at])?.slice(0, 160)}`)
      } else out.push(`${ep.route} · ${k}: ${ev?.slice(0, 160)} → ${av?.slice(0, 160)}`)
    }
  }
  return out
}

const write = (file, data) => fs.writeFileSync(file, `${JSON.stringify(data, null, 1)}\n`)

let code = 0
try {
  await waitForServer()
  const browser = await launch()
  try {
    const routes = snapshotRoutes(COURSE_ID)
    const first = await runOnce(browser, routes)
    const withErrors = first.pages.filter((p) => p.errors || p.noMain)
    if (withErrors.length) throw new Error(`σφάλματα σελίδας: ${withErrors.map((p) => `${p.route} ${p.errors?.join(' | ') ?? 'χωρίς #main-content'}`).join('; ')}`)
    if (OUT) write(path.resolve(OUT), first)
    if (WRITE) {
      const second = await runOnce(browser, routes)
      const d = diff(first, second)
      if (d.length || JSON.stringify(first) !== JSON.stringify(second)) throw new Error(`δύο εκτελέσεις διαφέρουν — το baseline ΔΕΝ γράφτηκε:\n  ${d.join('\n  ')}`)
      write(BASELINE, first)
      console.log(`✓ baseline: ${routes.length} διαδρομές, δύο ίδιες εκτελέσεις → ${path.relative(root, BASELINE)}`)
    } else {
      if (!fs.existsSync(BASELINE)) throw new Error(`δεν υπάρχει baseline (${path.relative(root, BASELINE)}): node scripts/snapshot-pages.mjs --write`)
      const expected = JSON.parse(fs.readFileSync(BASELINE, 'utf8'))
      const d = diff(expected, first)
      if (d.length || JSON.stringify(expected) !== JSON.stringify(JSON.parse(JSON.stringify(first)))) {
        console.error(`✗ snapshot σελίδων: ${d.length} διαφορές\n  ${d.slice(0, 40).join('\n  ')}${d.length > 40 ? `\n  … και ${d.length - 40} ακόμα` : ''}`)
        code = 1
      } else console.log(`✓ snapshot σελίδων: ${routes.length} διαδρομές ίδιες με το baseline`)
    }
  } finally {
    await browser.close()
  }
} catch (e) {
  console.error(`✗ snapshot σελίδων: ${e.message}`)
  code = 1
}
stopServer()
process.exit(code)
