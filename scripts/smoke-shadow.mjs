/**
 * Browser smoke του shadow mode (Phase 1E-3). ΔΕΝ ενεργοποιεί τίποτα στο κανονικό build.
 *
 *  A. Ειδικό build με VITE_PROGRESS_SHADOW_SMOKE=1 (dist-shadow): σε δοκιμαστικό storage με baseline/σημάδι
 *     και runtime ενεργοποίηση:
 *       1 απάντηση κουίζ + 1 «Επόμενη κάρτα» → το legacy αλλάζει κανονικά ΚΑΙ γράφονται ακριβώς 2 events
 *       (σωστά id/item/kind/ctx/t)· reconciliation in-sync.
 *       απενεργοποίηση (runtime) → νέα απάντηση: legacy +1, κανένα νέο event (το reconciliation το δείχνει).
 *       import αρχείου με event πριν από το όριο migration → απόρριψη, κανένα event.
 *  B. Κανονικό build (dist, flag κλειστό): ίδιο storage → καμία εγγραφή στο νέο store.
 *
 * Run: node scripts/smoke-shadow.mjs   (χτίζει μόνο του το dist-shadow· το dist πρέπει να υπάρχει)
 */
import fs from 'fs'
import path from 'path'
import { spawn, spawnSync } from 'child_process'
import { fileURLToPath, pathToFileURL } from 'url'
import { chromium } from 'playwright'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const imp = (rel) => import(pathToFileURL(path.join(root, rel)).href)
const vite = path.join(root, 'node_modules/.bin/vite')

if (!fs.existsSync(path.join(root, 'dist/index.html'))) {
  console.error('✗ Δεν υπάρχει dist/. Τρέξε πρώτα: npm run build')
  process.exit(1)
}
const build = spawnSync(vite, ['build', '--outDir', 'dist-shadow', '--emptyOutDir', '--logLevel', 'error'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, VITE_PROGRESS_SHADOW_SMOKE: '1' },
})
if (build.status !== 0) process.exit(build.status ?? 1)

const { quizQuestions, flashcards } = await imp('content/courses/psd115/questions.js')
const { buildLegacyBaseline } = await imp('src/core/progress/legacyBaseline.js')
const { reconcileShadow } = await imp('src/core/progress/reconcile.js')
const K = await imp('src/core/progress/keys.js')
const fixture = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/progress-export.production-2026-10-05.json'), 'utf8'))

const EVENTS = 'study-progress-events-v1'
const STATE = 'study-progress-state-v1'
const migratedAt = Date.now() - 60_000
const built = buildLegacyBaseline(fixture.keys, { now: () => migratedAt })
if (!built.ok) throw new Error(built.errors.join('; '))
const seed = {
  ...fixture.keys,
  'psd115-disclaimer-v1': '1',
  [STATE]: JSON.stringify({
    [K.LEGACY_BASELINE_KEY]: built.baseline,
    [K.MIGRATION_MARKER_KEY]: built.marker,
    [K.SHADOW_STATE_KEY]: { enabled: true, activatedAt: built.marker.at, failures: 0, recentFailures: [] },
  }),
}

const failures = []
const fail = (m) => failures.push(m)
const check = (cond, m) => {
  if (!cond) fail(m)
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

async function serve(outDir, port) {
  const server = spawn(vite, ['preview', '--outDir', outDir, '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' })
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`http://localhost:${port}`)).ok) return server
    } catch {
      /* not yet */
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  server.kill()
  throw new Error(`ο server ${outDir} δεν ξεκίνησε`)
}

async function newPage(browser) {
  const context = await browser.newContext({ acceptDownloads: true })
  await context.addInitScript((data) => {
    if (sessionStorage.getItem('shadow-smoke-seeded')) return
    for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v)
    sessionStorage.setItem('shadow-smoke-seeded', '1')
  }, seed)
  const page = await context.newPage()
  page.on('pageerror', (e) => fail(`σφάλμα JS: ${e.message}`))
  return { context, page }
}

const read = (page) =>
  page.evaluate(([E, S]) => ({
    study: JSON.parse(localStorage.getItem('psd115-w1-study') ?? '{}'),
    events: localStorage.getItem(E) === null ? null : JSON.parse(localStorage.getItem(E)),
    state: JSON.parse(localStorage.getItem(S) ?? '{}'),
  }), [EVENTS, STATE])

async function answerOneQuizQuestion(page, base) {
  await page.goto(`${base}/study/quiz?scope=unit:psd115/k2`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Έναρξη κουίζ' }).click()
  const text = ((await page.locator('main h2').first().textContent()) ?? '').trim()
  await page.locator('main ul li button').first().click()
  await page.waitForTimeout(300)
  return quizQuestions.filter((q) => q.question.trim() === text).map((q) => q.id)
}

const browser = await launch()
let server

// ---------- A. Shadow build ----------
{
  server = await serve('dist-shadow', 4318)
  const base = 'http://localhost:4318'
  const { context, page } = await newPage(browser)
  const startedAt = Date.now()

  const candidates = await answerOneQuizQuestion(page, base)
  let s = await read(page)
  check(s.study.quizAnswered === 2, `A: legacy quizAnswered ${s.study.quizAnswered} (αναμενόταν 2)`)
  check(Array.isArray(s.events) && s.events.length === 1, `A: ${s.events?.length ?? 0} events μετά την απάντηση (αναμενόταν 1)`)
  const q = s.events?.[0]
  if (q) {
    check(candidates.map((id) => `psd115/${id}`).includes(q.item), `A: item ${q.item} δεν είναι η ερώτηση που απαντήθηκε`)
    check(q.kind === 'answer' && q.ctx === 'quiz', 'A: λάθος kind/ctx για την απάντηση')
    check(q.ok === s.study.quizCorrect - 0, `A: ok=${q.ok} ενώ το legacy quizCorrect είναι ${s.study.quizCorrect}`)
    check(q.t >= migratedAt && q.t >= startedAt - 5000 && q.t <= Date.now(), 'A: το t δεν είναι ο πραγματικός χρόνος της απάντησης')
    check(/^[0-9a-f-]{36}$/.test(q.id), 'A: το id δεν είναι UUID')
  }

  await page.goto(`${base}/study/flashcards?scope=unit:psd115/k1`, { waitUntil: 'networkidle' })
  const front = ((await page.locator('button[aria-label="Εμφάνιση απάντησης"] p').nth(1).textContent()) ?? '').trim()
  const cardId = flashcards.find((c) => c.front.trim() === front)?.id
  await page.getByRole('button', { name: /^(Επόμενη κάρτα|Από την αρχή)$/ }).click()
  await page.waitForTimeout(300)
  s = await read(page)
  check(cardId && s.study.flashcardSeenIds.includes(cardId), `A: η κάρτα ${cardId} δεν μπήκε στο legacy flashcardSeenIds`)
  check(s.events?.length === 2, `A: ${s.events?.length} events μετά την κάρτα (αναμενόταν 2)`)
  const c = s.events?.[1]
  if (c) check(c.item === `psd115/${cardId}` && c.kind === 'flip' && c.ctx === 'flash', `A: λάθος card event ${JSON.stringify(c)}`)
  check(new Set(s.events.map((e) => e.id)).size === s.events.length, 'A: διπλά event ids')
  const rec = reconcileShadow({ baseline: built.baseline, legacy: s.study, events: s.events })
  check(rec.ok, `A: reconciliation όχι in-sync: ${JSON.stringify(rec)}`)

  // Απενεργοποίηση (runtime) → καμία νέα εγγραφή.
  await page.evaluate(([S, KEY]) => {
    const st = JSON.parse(localStorage.getItem(S))
    st[KEY] = { ...st[KEY], enabled: false }
    localStorage.setItem(S, JSON.stringify(st))
  }, [STATE, K.SHADOW_STATE_KEY])
  await answerOneQuizQuestion(page, base)
  s = await read(page)
  check(s.study.quizAnswered === 3, `A: μετά την απενεργοποίηση legacy quizAnswered ${s.study.quizAnswered} (αναμενόταν 3)`)
  check(s.events?.length === 2, `A: μετά την απενεργοποίηση ${s.events?.length} events (αναμενόταν 2)`)
  check(!reconcileShadow({ baseline: built.baseline, legacy: s.study, events: s.events }).ok, 'A: η απόκλιση μετά την απενεργοποίηση δεν εντοπίστηκε')

  // Import αρχείου με event πριν από το όριο migration → απόρριψη.
  const oldEvent = { id: '00000000-0000-4000-8000-0000000000aa', t: migratedAt - 1, item: 'psd115/q-w2-var-1', kind: 'answer', ok: 1, ctx: 'quiz' }
  const file = { format: 'psd115-progress-export', version: 2, keys: {}, progressStore: { [EVENTS]: JSON.stringify([oldEvent]) } }
  const before = await read(page)
  await page.getByTestId('progress-import-input').setInputFiles({ name: 'old.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(file)) })
  await page.getByRole('button', { name: 'Ναι, εισαγωγή' }).click()
  await page.getByText('Η εισαγωγή απέτυχε').waitFor({ timeout: 5000 }).catch(() => fail('A: δεν εμφανίστηκε μήνυμα απόρριψης του παλιού event'))
  const after = await read(page)
  check(JSON.stringify(after.events) === JSON.stringify(before.events), 'A: το παλιό event γράφτηκε')
  check(JSON.stringify(after.study) === JSON.stringify(before.study), 'A: το legacy άλλαξε από το απορριφθέν import')
  check(!(await page.evaluate(() => localStorage.getItem('progress-txn-v1'))), 'A: έμεινε σημάδι συναλλαγής')

  await context.close()
  server.kill()
  console.log(`${failures.length ? '✗' : '✓'} Shadow build: 1 απάντηση + 1 κάρτα → 2 events · in-sync · απενεργοποίηση → 0 νέα · παλιό event → απόρριψη`)
}

// ---------- B. Κανονικό build (flag κλειστό) ----------
const beforeB = failures.length
{
  server = await serve('dist', 4319)
  const { context, page } = await newPage(browser)
  const stateBefore = (await (async () => {
    await page.goto('http://localhost:4319/', { waitUntil: 'networkidle' })
    return read(page)
  })()).state
  await answerOneQuizQuestion(page, 'http://localhost:4319')
  const s = await read(page)
  check(s.study.quizAnswered === 2, `B: legacy quizAnswered ${s.study.quizAnswered} (αναμενόταν 2)`)
  check(s.events === null, 'B: το κανονικό build έγραψε events')
  check(JSON.stringify(s.state) === JSON.stringify(stateBefore), 'B: το κανονικό build άλλαξε το state του νέου store')
  await context.close()
  server.kill()
  console.log(`${failures.length > beforeB ? '✗' : '✓'} Κανονικό build: legacy +1 · καμία εγγραφή στο νέο store (ακόμα και με ενεργό runtime state)`)
}

await browser.close()
fs.rmSync(path.join(root, 'dist-shadow'), { recursive: true, force: true })
if (failures.length) {
  console.error(`\n✗ Shadow smoke: ${failures.length} αποτυχία(ες)`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log('✓ Shadow smoke πέρασε')
