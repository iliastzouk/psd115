/**
 * Smoke test της ΤΡΕΧΟΥΣΑΣ εφαρμογής (baseline πριν από κάθε migration).
 *  1. Ανοίγει κάθε υπάρχουσα διαδρομή στο production build και ελέγχει: χωρίς JS σφάλματα,
 *     σωστή τελική διαδρομή, μη κενό περιεχόμενο.
 *  2. Ελέγχει τον κύκλο προστασίας προόδου: εξαγωγή → αλλοίωση → απόρριψη άκυρου αρχείου →
 *     εισαγωγή με backup → επαναφορά (reset) με backup.
 *  3. Ανακάτεμα επιλογών: απαντά με βάση το κείμενο της σωστής επιλογής και ελέγχει ότι μετράει σωστά.
 *
 * Προϋπόθεση: `npm run build` (χρησιμοποιεί το dist/ μέσω `vite preview`).
 * Browser: ο Chromium του Playwright· αλλιώς όρισε PLAYWRIGHT_CHROMIUM_EXECUTABLE.
 * Run: node scripts/smoke-routes.mjs
 */
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { fileURLToPath, pathToFileURL } from 'url'
import { chromium } from 'playwright'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const imp = (rel) => import(pathToFileURL(path.join(root, rel)).href)
const PORT = Number(process.env.SMOKE_PORT ?? 4317)
const BASE = `http://localhost:${PORT}`

if (!fs.existsSync(path.join(root, 'dist/index.html'))) {
  console.error('✗ Δεν υπάρχει dist/. Τρέξε πρώτα: npm run build')
  process.exit(1)
}

// --- Λίστα διαδρομών από το ίδιο το περιεχόμενο ---
const w1 = await imp('src/data/week1/index.js')
const w2 = await imp('src/data/week2/index.js')
const w3 = await imp('src/data/week3/index.js')
const w4 = await imp('src/data/week4/index.js')

/** @type {{ path: string, expect?: string, note?: string }[]} */
const routes = [{ path: '/' }]
for (const w of [1, 2, 3, 4]) {
  routes.push({ path: `/week/${w}` })
  for (const tool of ['flashcards', 'quiz', 'exam', 'review']) routes.push({ path: `/week/${w}/${tool}` })
}
for (const n of w1.WEEK1_LESSON_NAV) routes.push({ path: n.to })
for (const [w, mod] of [[2, w2], [3, w3], [4, w4]]) {
  for (const t of mod[`WEEK${w}_TOPICS`]) routes.push({ path: `/week/${w}/${t.slug}` })
  routes.push({ path: `/week/${w}/does-not-exist`, expect: `/week/${w}`, note: 'άγνωστο θέμα → hub' })
}
routes.push({ path: '/week/1/?x=1', expect: '/week/1/', note: 'query string / trailing slash' })

// --- Server ---
const server = spawn(path.join(root, 'node_modules/.bin/vite'), ['preview', '--port', String(PORT), '--strictPort'], {
  cwd: root,
  stdio: 'ignore',
})
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
      const r = await fetch(BASE)
      if (r.ok) return
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
    // Προεγκατεστημένος Chromium με διαφορετική έκδοση (π.χ. /opt/pw-browsers).
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

const failures = []
const fail = (m) => failures.push(m)

await waitForServer()
const browser = await launch()

// ---------- 1. Διαδρομές ----------
{
  const context = await browser.newContext()
  await context.addInitScript(() => {
    try {
      localStorage.setItem('psd115-disclaimer-v1', '1')
    } catch {
      /* ignore */
    }
  })
  const page = await context.newPage()
  let pageErrors = []
  page.on('pageerror', (e) => pageErrors.push(e.message))
  // Τα scripts του Vercel Analytics (/_vercel/*) υπάρχουν μόνο στο Vercel· κάθε άλλο 404 είναι σφάλμα.
  page.on('response', (r) => {
    if (r.status() >= 400 && !new URL(r.url()).pathname.startsWith('/_vercel/')) pageErrors.push(`HTTP ${r.status()} ${r.url()}`)
  })
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) pageErrors.push(`console: ${m.text()}`)
  })

  for (const r of routes) {
    pageErrors = []
    const res = await page.goto(BASE + r.path, { waitUntil: 'networkidle' })
    const status = res?.status() ?? 0
    const finalPath = new URL(page.url()).pathname
    const mainText = ((await page.locator('#main-content').textContent().catch(() => '')) ?? '').trim()
    const expected = r.expect ?? r.path.replace(/\?.*$/, '')
    const label = `${r.path}${r.note ? ` (${r.note})` : ''}`
    if (status !== 200) fail(`${label}: HTTP ${status}`)
    if (finalPath !== expected) fail(`${label}: κατέληξε στο ${finalPath}, αναμενόταν ${expected}`)
    if (mainText.length < 20) fail(`${label}: κενό περιεχόμενο`)
    for (const e of pageErrors) fail(`${label}: ${e}`)
  }
  await context.close()
  console.log(`${failures.length ? '✗' : '✓'} Διαδρομές: ${routes.length} ελέγχθηκαν`)
}

// ---------- 2. Προστασία προόδου ----------
const before = failures.length
{
  const fixture = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/progress-export.sample.json'), 'utf8'))
  const context = await browser.newContext({ acceptDownloads: true })
  // Η πρόοδος γράφεται ΠΡΙΝ τρέξει η εφαρμογή (μία φορά), όπως θα την έβρισκε σε έναν πραγματικό browser.
  // Αν γραφτεί ενώ η εφαρμογή τρέχει, η εφαρμογή τη γράφει από πάνω από τη μνήμη (γνωστός κίνδυνος multi-tab).
  await context.addInitScript((keys) => {
    if (sessionStorage.getItem('smoke-seeded')) return
    for (const [k, v] of Object.entries(keys)) localStorage.setItem(k, v)
    sessionStorage.setItem('smoke-seeded', '1')
  }, fixture.keys)
  const page = await context.newPage()
  page.on('pageerror', (e) => fail(`backup: σφάλμα JS: ${e.message}`))

  const readStore = () =>
    page.evaluate(() => {
      const out = {}
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k.startsWith('psd115-')) out[k] = localStorage.getItem(k)
      }
      return out
    })
  const progressOnly = (store) => Object.fromEntries(Object.entries(store).filter(([k]) => !k.startsWith('psd115-backup-')))
  const readDownload = async (download) => JSON.parse(fs.readFileSync(await download.path(), 'utf8'))
  const same = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort())

  // Seed: υπάρχουσα πρόοδος όπως θα την είχε ένας χρήστης.
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  const original = progressOnly(await readStore())
  if (!same(original, fixture.keys)) fail('backup: η εφαρμογή άλλαξε την υπάρχουσα πρόοδο κατά τη φόρτωση')

  // Εξαγωγή
  const [exportDl] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Εξαγωγή προόδου (JSON)' }).click(),
  ])
  const exported = await readDownload(exportDl)
  if (exported.format !== 'psd115-progress-export' || exported.version !== 1) fail('backup: λάθος format/version στο export')
  if (!same(exported.keys, original)) fail('backup: το export δεν περιέχει ακριβώς την τρέχουσα πρόοδο')

  // Αλλοίωση + άγνωστο κλειδί που δεν πρέπει να σβηστεί
  await page.evaluate(() => {
    localStorage.setItem('psd115-w1-study', JSON.stringify({ quizAnswered: 999, quizCorrect: 0, byCategory: {}, flashcardSeenIds: [], wrongBook: [] }))
    localStorage.setItem('psd115-extra-unknown', 'keep-me')
  })
  const tampered = await readStore()

  // Άκυρο αρχείο → απόρριψη, τίποτα δεν αλλάζει
  const input = page.getByTestId('progress-import-input')
  await input.setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"format":"nope"}') })
  await page.getByText('Το αρχείο απορρίφθηκε').waitFor({ timeout: 5000 }).catch(() => fail('backup: δεν εμφανίστηκε μήνυμα απόρριψης'))
  if (!same(await readStore(), tampered)) fail('backup: το άκυρο αρχείο άλλαξε το localStorage')

  // Έγκυρο αρχείο → επιβεβαίωση → backup → εισαγωγή → reload
  await input.setInputFiles({ name: 'ok.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) })
  const confirm = page.getByRole('button', { name: 'Ναι, εισαγωγή' })
  await confirm.waitFor({ timeout: 5000 })
  if (!same(await readStore(), tampered)) fail('backup: άλλαξαν δεδομένα πριν από την επιβεβαίωση')
  const [backupDl] = await Promise.all([page.waitForEvent('download'), page.waitForEvent('load'), confirm.click()])
  const backup = await readDownload(backupDl)
  if (backup.reason !== 'import' || !same(backup.keys, progressOnly(tampered))) {
    fail('backup: το αυτόματο αντίγραφο πριν από την εισαγωγή δεν είναι η πρόοδος της στιγμής εκείνης')
  }
  await page.waitForTimeout(500)
  const afterImport = await readStore()
  for (const [k, v] of Object.entries(original)) {
    if (afterImport[k] !== v) fail(`backup: μετά την εισαγωγή το «${k}» δεν επανήλθε`)
  }
  if (afterImport['psd115-extra-unknown'] !== 'keep-me') fail('backup: η εισαγωγή έσβησε άγνωστο κλειδί')
  if (!Object.keys(afterImport).some((k) => k.startsWith('psd115-backup-'))) fail('backup: δεν κρατήθηκε αντίγραφο στο localStorage')

  // Reset → πρώτα backup
  await page.getByRole('button', { name: 'Επαναφορά προόδου μελέτης' }).click()
  const [resetDl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Ναι, διαγραφή' }).click()])
  const resetBackup = await readDownload(resetDl)
  if (resetBackup.reason !== 'reset' || resetBackup.keys['psd115-w1-study'] !== original['psd115-w1-study']) {
    fail('backup: το αντίγραφο πριν από το reset δεν περιέχει την πρόοδο')
  }
  await context.close()
  console.log(`${failures.length > before ? '✗' : '✓'} Προστασία προόδου: export · απόρριψη άκυρου · import με backup · reset με backup`)
}

// ---------- 3. Ανακάτεμα επιλογών: η σωστή απάντηση μετράει σωστά ----------
const beforeShuffle = failures.length
{
  const { quizQuestions } = await imp('src/data/questions.js')
  const byText = new Map(quizQuestions.map((q) => [q.question.trim(), q]))
  const context = await browser.newContext()
  await context.addInitScript(() => localStorage.setItem('psd115-disclaimer-v1', '1'))
  const page = await context.newPage()
  page.on('pageerror', (e) => fail(`shuffle: σφάλμα JS: ${e.message}`))

  // Κύριο κουίζ Εβδ. 2: απαντά σε ΟΛΕΣ τις ερωτήσεις με βάση το κείμενο της σωστής επιλογής.
  await page.goto(BASE + '/week/2/quiz', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Έναρξη κουίζ' }).click()
  let answered = 0
  let mcqNotAtOriginalSlot = 0
  let mcqCount = 0
  for (let guard = 0; guard < 500; guard++) {
    const heading = page.locator('main h2').first()
    const text = ((await heading.textContent()) ?? '').trim()
    const q = byText.get(text)
    if (!q) {
      fail(`shuffle: η ερώτηση «${text.slice(0, 60)}» δεν βρέθηκε στα δεδομένα`)
      break
    }
    const correctText = q.options[q.correctIndex]
    const buttons = page.locator('main ul li button')
    const labels = (await buttons.allTextContents()).map((t) => t.trim())
    const pos = labels.indexOf(correctText)
    if (pos < 0 || labels.length !== q.options.length || [...labels].sort().join('|') !== [...q.options].sort().join('|')) {
      fail(`shuffle: οι επιλογές της «${q.id}» δεν ταιριάζουν με τα δεδομένα`)
      break
    }
    if (q.type === 'mcq') {
      mcqCount += 1
      if (pos !== q.correctIndex) mcqNotAtOriginalSlot += 1
    } else if (labels.join('|') !== q.options.join('|')) {
      fail(`shuffle: η Σ/Λ «${q.id}» άλλαξε σειρά επιλογών`)
    }
    await buttons.nth(pos).click()
    if (!/border-emerald-500/.test((await buttons.nth(pos).getAttribute('class')) ?? '')) {
      fail(`shuffle: η σωστή επιλογή της «${q.id}» δεν σημειώθηκε ως σωστή`)
    }
    answered += 1
    const cont = page.getByRole('button', { name: /^(Συνέχεια|Τέλος κουίζ)$/ })
    const last = (await cont.textContent())?.trim() === 'Τέλος κουίζ'
    await cont.click()
    if (last) break
  }
  const study = JSON.parse((await page.evaluate(() => localStorage.getItem('psd115-w1-study'))) ?? '{}')
  if (study.quizAnswered !== answered || study.quizCorrect !== answered) {
    fail(`shuffle: απαντήθηκαν σωστά ${answered}, η πρόοδος γράφει ${study.quizCorrect}/${study.quizAnswered}`)
  }
  if (mcqCount >= 8 && mcqNotAtOriginalSlot === 0) fail('shuffle: καμία επιλογή δεν άλλαξε θέση — το ανακάτεμα δεν εφαρμόζεται')

  // Mini κουίζ μέσα σε μάθημα (Εβδ. 2) και σε custom μάθημα (Εβδ. 1).
  const w2 = await imp('src/data/week2/index.js')
  const w1pavlov = await imp('src/data/week1/pavlov.js')
  const lessonCases = [
    ['/week/2/overview', w2.WEEK2_TOPICS.find((t) => t.slug === 'overview').lessonQuizIds],
    ['/week/1/pavlov', w1pavlov.pavlovLessonQuizIds],
  ]
  let lessonChecked = 0
  for (const [route, ids] of lessonCases) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' })
    for (const id of ids) {
      const q = quizQuestions.find((x) => x.id === id)
      const item = page.locator('div', { has: page.locator(`p:text-is(${JSON.stringify(q.question)})`) }).last()
      const btn = item.getByRole('button', { name: q.options[q.correctIndex], exact: true })
      if ((await btn.count()) !== 1) {
        fail(`shuffle: στο ${route} δεν βρέθηκε η σωστή επιλογή της «${id}»`)
        continue
      }
      await btn.click()
      if (!/border-emerald-500/.test((await btn.getAttribute('class')) ?? '')) {
        fail(`shuffle: στο ${route} η σωστή επιλογή της «${id}» δεν σημειώθηκε ως σωστή`)
      }
      lessonChecked += 1
    }
  }
  await context.close()
  console.log(
    `${failures.length > beforeShuffle ? '✗' : '✓'} Ανακάτεμα επιλογών: ${answered} ερωτήσεις κουίζ (${mcqNotAtOriginalSlot}/${mcqCount} MCQ σε νέα θέση) · ${lessonChecked} mini κουίζ μαθημάτων`,
  )
}

await browser.close()
stopServer()

if (failures.length) {
  console.error(`\n✗ Smoke test: ${failures.length} αποτυχία(ες)`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log('✓ Smoke test πέρασε')
