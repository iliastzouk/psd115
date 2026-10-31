/**
 * Browser smoke του ProgressService πάνω στη νέα υποδομή (Φάση 6a: `study-progress-*`, πολλά μαθήματα).
 *
 *  G1. Κανονικό build (dist): boot με το fixture της νέας μορφής (και με άδειο storage) —
 *      ΚΑΜΙΑ εγγραφή στο localStorage από την πλοήγηση μέχρι το settle (setItem/removeItem/clear καταγράφονται)·
 *      το ΠΡΩΤΟ DOM (πρώτο commit, MutationObserver) έχει ήδη τις τιμές του fixture· τα κλειδιά μένουν byte-identical.
 *  G1-M. Mutation builds (προσωρινές αλλαγές κώδικα, αναιρούνται στο τέλος): το gate ΠΡΕΠΕΙ να αποτύχει.
 *      M1: εγγραφή στο mount → αποτυγχάνει ο write detector. M2: άδειο service + hydration σε effect → πρώτο DOM.
 *  D.  Κατεστραμμένο store (global degraded, J4): μήνυμα, καμία εγγραφή ούτε μετά από ενέργειες, κλειδιά byte-identical·
 *      reset → δεν επιτρέπεται· «Αντικατάσταση από αντίγραφο» με αποτυχία backup → ακύρωση· με backup → raw byte-identical
 *      στο αρχείο και τοπικά, αντικατάσταση, resync.
 *  U.  Legacy (`psd115-*`) και άγνωστα κλειδιά: δεν διαβάζονται, δεν αγγίζονται ποτέ· η ενέργεια γράφει ΜΟΝΟ το store.
 *      Κάθε getItem της εφαρμογής καταγράφεται (οι αναγνώσεις των assertions παρακάμπτουν την καταγραφή): σε boot,
 *      checklist, εξαγωγή και reset διαβάζονται ΜΟΝΟ τα κλειδιά του store, το σημάδι, τα `study-progress-backup-*`
 *      (σύγκρουση ονόματος + επαλήθευση του νέου backup) και οι ρυθμίσεις theme / disclaimer.
 *  P.  Εκκρεμές σημάδι συναλλαγής κατά τη λειτουργία: κλικ σε checklist → ΚΑΜΙΑ εγγραφή, μήνυμα, το checkbox δεν δείχνει
 *      «αποθηκευμένη» αλλαγή· reload → η ανάκτηση επαναφέρει τις αρχικές τιμές, όχι degraded.
 *  W.  Αποτυχία αποθήκευσης χωρίς σημάδι (Φάση 2): ειδοποίηση (όχι degraded), το checkbox ΔΕΝ αλλάζει, καμία αλλαγή στο
 *      storage· κλείσιμο· ξανά αποτυχία· ΑΣΧΕΤΗ επιτυχημένη εγγραφή → η ειδοποίηση ΜΕΝΕΙ· επανάληψη → σώζεται, φεύγει.
 *  T.  Δύο tabs στο ΙΔΙΟ context: ενημέρωση χωρίς reload, καμία χαμένη αλλαγή, 0 εγγραφές από το tab που μόνο ενημερώθηκε.
 *  R.  Μηνύματα ανά αποτέλεσμα: reset με εκκρεμές σημάδι → «Εκκρεμεί ανάκτηση», καμία λήψη· import με rollback που δεν
 *      ολοκληρώθηκε → «δεν ολοκληρώθηκε με ασφάλεια… επαναφόρτωσε», ΟΧΙ «δεν άλλαξε»· reload → ανάκτηση.
 *  G2. Smoke build (dist-progress, VITE_PROGRESS_SMOKE=1): 1 service· όλοι οι consumers ίδιο snapshot (===)· μετά από κάθε
 *      ενέργεια (checklist, κάρτα, σωστή, λάθος, αφαίρεση λάθους, reset του μαθήματος) ίδιο ΝΕΟ snapshot και
 *      μνήμη ≡ storage (ο ίδιος υπολογισμός πάνω στα κλειδιά)· reset → τα events μένουν (append-only), η πρόοδος μηδενίζεται.
 *
 * Run: node scripts/smoke-progress.mjs   (το dist πρέπει να υπάρχει· τα υπόλοιπα builds γίνονται εδώ)
 */
import fs from 'fs'
import path from 'path'
import { spawn, spawnSync } from 'child_process'
import { fileURLToPath, pathToFileURL } from 'url'
import { chromium } from 'playwright'
import { LEGACY_KEY_RE, SETTINGS_KEY_RES } from './legacy-keys.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const imp = (rel) => import(pathToFileURL(path.join(root, rel)).href)
const vite = path.join(root, 'node_modules/.bin/vite')

if (!fs.existsSync(path.join(root, 'dist/index.html'))) {
  console.error('✗ Δεν υπάρχει dist/. Τρέξε πρώτα: npm run build')
  process.exit(1)
}

const { quizQuestions } = await imp('content/courses/psd115/questions.js')
const { createStoreProgressService } = await imp('src/core/progress/storeProgressService.js')
const { studyContentAdapters } = await imp('src/core/progress/adapters/studyContent.js')
const EV = 'study-progress-events-v1'
const ST = 'study-progress-state-v1'
const TXN = 'progress-txn-v1'
const SAMPLE_FILE = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/study-progress.sample.json'), 'utf8'))
const SAMPLE = { [EV]: JSON.stringify(SAMPLE_FILE.events), [ST]: JSON.stringify(SAMPLE_FILE.state), 'psd115-disclaimer-v1': '1' }
const SAMPLE_WRONG = SAMPLE_FILE.state['progress:wrongbook:psd115'].entries[0]

/** Η πρόοδος όπως τη βλέπει ο ίδιος υπολογισμός της εφαρμογής, πάνω στα κλειδιά του browser (μνήμη ≡ storage). */
function fromKeys(keys) {
  const m = new Map(Object.entries(keys))
  const storage = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: () => {}, removeItem: () => {}, key: (i) => [...m.keys()][i] ?? null, get length() { return m.size } }
  return createStoreProgressService({ adapters: studyContentAdapters(), storage }).getSnapshot()
}
const stateOf = (keys) => JSON.parse(keys[ST] ?? '{}')
const pavlovItems = (keys) => stateOf(keys)['progress:checklists:psd115']?.topics?.pavlov?.items ?? []

const failures = []
const fail = (m) => failures.push(m)
const check = (cond, m) => {
  if (!cond) fail(m)
}

// ---------------------------------------------------------------- builds
function build(outDir, env = {}) {
  const r = spawnSync(vite, ['build', '--outDir', outDir, '--emptyOutDir', '--logLevel', 'error'], { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } })
  if (r.status !== 0) throw new Error(`build ${outDir} απέτυχε`)
}

/** Προσωρινή αλλαγή αρχείων για mutation build· επαναφορά byte-for-byte (και έλεγχος) ό,τι κι αν γίνει. */
function withPatches(patches, fn) {
  const originals = new Map()
  try {
    for (const [rel, edits] of Object.entries(patches)) {
      const file = path.join(root, rel)
      const src = fs.readFileSync(file, 'utf8')
      originals.set(file, src)
      let out = src
      for (const [from, to] of edits) {
        if (!out.includes(from)) throw new Error(`mutation: δεν βρέθηκε το σημείο στο ${rel}: ${from.slice(0, 60)}`)
        out = out.replace(from, to)
      }
      fs.writeFileSync(file, out)
    }
    return fn()
  } finally {
    for (const [file, src] of originals) fs.writeFileSync(file, src)
    for (const [file, src] of originals) if (fs.readFileSync(file, 'utf8') !== src) throw new Error(`mutation: δεν επανήλθε το ${file}`)
  }
}

const MUTATIONS = {
  // M1: εγγραφή προόδου στο mount (όπως το παλιό saveProgress effect).
  m1: {
    'src/hooks/useStudySession.js': [
      [
        '  const progressStatus = progressState.status\n',
        "  const progressStatus = progressState.status\n  useEffect(() => {\n    window.localStorage.setItem('study-progress-events-v1', window.localStorage.getItem('study-progress-events-v1') ?? '[]')\n  }, [])\n",
      ],
    ],
  },
  // M2: άδειο service στο boot, hydration σε effect μετά το πρώτο render.
  m2: {
    'src/core/progress/storeProgressService.js': [
      ["import { toGlobalId } from '../academic/ids.js'", "import { toGlobalId } from '../academic/ids.js'\nimport { emptySnapshot } from './snapshotShape.js'"],
      ['  let state = load()\n', '  let state = freezeState({ courses: Object.fromEntries(Object.keys(adapters).map((c) => [c, emptySnapshot(c)])) })\n'],
    ],
    'src/hooks/useProgress.js': [
      ["import { useCallback, useMemo, useSyncExternalStore } from 'react'", "import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'\nlet hydrated = false"],
      [
        '  const state = useSyncExternalStore(service.subscribe, service.getSnapshot)\n',
        '  const state = useSyncExternalStore(service.subscribe, service.getSnapshot)\n  useEffect(() => {\n    if (!hydrated) {\n      hydrated = true\n      service.resync()\n    }\n  }, [service])\n',
      ],
    ],
  },
}

build('dist-progress', { VITE_PROGRESS_SMOKE: '1' })
for (const [name, patches] of Object.entries(MUTATIONS)) withPatches(patches, () => build(`dist-progress-${name}`))
check(!fs.readdirSync(path.join(root, 'dist/assets')).some((f) => fs.readFileSync(path.join(root, 'dist/assets', f), 'utf8').includes('__progressProbe')), 'το production build περιέχει το smoke probe')
// K6: ΚΑΝΕΝΑ legacy κλειδί προόδου στο production bundle (scripts/legacy-keys.mjs)· theme / disclaimer ΠΡΕΠΕΙ να υπάρχουν.
const bundle = fs.readdirSync(path.join(root, 'dist/assets')).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(root, 'dist/assets', f), 'utf8')).join('\n')
const legacyHit = bundle.match(LEGACY_KEY_RE)
check(!legacyHit, `το production build περιέχει legacy κλειδιά προόδου (${legacyHit?.[0]} … ${legacyHit ? bundle.slice(legacyHit.index - 20, legacyHit.index + 40) : ''})`)
check(SETTINGS_KEY_RES.every((re) => re.test(bundle)), 'το production build δεν περιέχει τα κλειδιά ρυθμίσεων (theme / disclaimer)· ο έλεγχος legacy κλειδιών θα ήταν κενός')

// ---------------------------------------------------------------- browser
async function launch() {
  const exe = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  if (exe) return chromium.launch({ executablePath: exe })
  try {
    return await chromium.launch()
  } catch (e) {
    const dir = process.env.PLAYWRIGHT_BROWSERS_PATH
    const candidates = dir && fs.existsSync(dir) ? [path.join(dir, 'chromium'), ...fs.readdirSync(dir).filter((d) => /^chromium-\d+$/.test(d)).map((d) => path.join(dir, d, 'chrome-linux', 'chrome'))] : []
    const found = candidates.find((p) => fs.existsSync(p) && fs.statSync(p).isFile())
    if (!found) throw e
    return chromium.launch({ executablePath: found })
  }
}

let nextPort = 4330
async function serve(outDir) {
  const port = nextPort++
  const server = spawn(vite, ['preview', '--outDir', outDir, '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' })
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(`http://localhost:${port}`)).ok) return { server, base: `http://localhost:${port}` }
    } catch {
      /* not yet */
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  server.kill()
  throw new Error(`ο server ${outDir} δεν ξεκίνησε`)
}

/**
 * Init script: γράφει τα κλειδιά ΜΙΑ φορά (πριν από την παρακολούθηση), μετά καταγράφει κάθε εγγραφή (`__writes`) και
 * κάθε ανάγνωση (`__reads`, getItem) του localStorage από την εφαρμογή, και το DOM/checkboxes του ΠΡΩΤΟΥ commit στο
 * #root. Οι αναγνώσεις του smoke περνούν από το `__rawGetItem` και δεν καταγράφονται. Προαιρετικά ντετερμινιστικό
 * Math.random.
 */
async function newContext(browser, keys, { seed } = {}) {
  const context = await browser.newContext({ acceptDownloads: true })
  await context.addInitScript(
    ([data, rnd]) => {
      if (!sessionStorage.getItem('progress-smoke-seeded')) {
        for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v)
        sessionStorage.setItem('progress-smoke-seeded', '1')
      }
      if (rnd) {
        let a = rnd >>> 0
        Math.random = () => {
          a = (a + 0x6d2b79f5) >>> 0
          let t = Math.imul(a ^ (a >>> 15), 1 | a)
          t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296
        }
      }
      const log = (window.__writes = [])
      const P = Storage.prototype
      const reads = (window.__reads = [])
      const rawGetItem = P.getItem
      window.__rawGetItem = (k) => rawGetItem.call(localStorage, k)
      P.getItem = function (k) {
        if (this === localStorage) reads.push(k)
        return rawGetItem.call(this, k)
      }
      for (const m of ['setItem', 'removeItem', 'clear']) {
        const orig = P[m]
        P[m] = function (...a) {
          if (this === localStorage) log.push({ m, k: a[0] })
          return orig.apply(this, a)
        }
      }
      new MutationObserver((_, obs) => {
        const el = document.getElementById('root')
        if (el && el.childElementCount && !window.__firstDom) {
          window.__firstDom = {
            text: el.innerText.replace(/\s+/g, ' '),
            checks: [...el.querySelectorAll('input[type=checkbox]')].map((c) => c.checked),
            writes: log.length,
          }
          obs.disconnect()
        }
      }).observe(document, { childList: true, subtree: true })
    },
    [keys, seed ?? null],
  )
  const page = await context.newPage()
  page.on('pageerror', (e) => fail(`σφάλμα JS: ${e.message}`))
  return { context, page }
}

const settle = async (page) => {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(800)
}
/** Αναγνώσεις του smoke: μέσω του αρχικού getItem, ώστε να μη μπαίνουν στις αναγνώσεις της εφαρμογής (`__reads`). */
const readKeys = (page) =>
  page.evaluate(() => {
    const get = window.__rawGetItem ?? ((k) => localStorage.getItem(k))
    return Object.fromEntries(Object.keys(localStorage).map((k) => [k, get(k)]))
  })
/** Κλειδιά που επιτρέπεται να διαβάσει η εφαρμογή (K6): store, σημάδι, νέα backups, ρυθμίσεις. */
const ALLOWED_READ = (k) =>
  ['study-progress-events-v1', 'study-progress-state-v1', 'progress-txn-v1', 'psd115-w1-theme', 'psd115-disclaimer-v1'].includes(k) ||
  k.startsWith('study-progress-backup-')
const sameKeys = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort())

/**
 * Boot gate: 0 εγγραφές μέχρι το settle, κλειδιά byte-identical, πρώτο DOM με τις τιμές του fixture.
 * @returns {string[]} αποτυχίες
 */
async function bootGate(browser, base, keys, route, expect) {
  const out = []
  const { context, page } = await newContext(browser, keys)
  await page.goto(base + route)
  await settle(page)
  const r = await page.evaluate(() => ({ writes: window.__writes, first: window.__firstDom }))
  if (r.writes.length) out.push(`${route}: ${r.writes.length} εγγραφές στο boot (${r.writes.map((w) => `${w.m} ${w.k}`).join(', ')})`)
  const after = await readKeys(page)
  if (!sameKeys(after, keys)) out.push(`${route}: τα κλειδιά άλλαξαν στο boot`)
  if (!r.first) out.push(`${route}: δεν καταγράφηκε πρώτο DOM`)
  else {
    for (const re of expect.text ?? []) if (!re.test(r.first.text)) out.push(`${route}: το πρώτο DOM δεν έχει ${re}`)
    for (const re of expect.notText ?? []) if (re.test(r.first.text)) out.push(`${route}: το πρώτο DOM έχει ${re}`)
    if (expect.checks && JSON.stringify(r.first.checks) !== JSON.stringify(expect.checks(r.first.checks.length))) {
      out.push(`${route}: checkboxes πρώτου DOM ${JSON.stringify(r.first.checks)}`)
    }
  }
  await context.close()
  return out
}

const pad = (items, n) => [...items, ...Array(Math.max(0, n - items.length)).fill(false)].slice(0, n)
const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const WRONG_RE = new RegExp(esc(SAMPLE_WRONG.question.slice(0, 40)))
const EMPTY = { 'psd115-disclaimer-v1': '1' }
const BOOT_CASES = [
  // Ίδιες τιμές με τη Φάση 4, τώρα από πραγματικά events: k1 (pavlov) 21 κάρτες, καμία απάντηση της k1 → «Κουίζ —».
  [SAMPLE, '/psd115/topics/pavlov', { text: [/Κουίζ — · Κάρτες 21\/94 \(22%\)/], notText: [/Κάρτες 0\//], checks: (n) => pad([true, false, true], n) }],
  [SAMPLE, '/psd115/units/k2', { text: [/ακρίβεια 0% \(0\/1\)/, /μελετήθηκαν 0\/56/], notText: [/μελετήθηκαν 21\//] }],
  [SAMPLE, '/progress?scope=psd115', { text: [/ακρίβεια 0% \(0\/1\)/, /μελετήθηκαν 21\/198/] }],
  // Η ετικέτα του λάθους από το STUDY_CONTENT (κεφαλαία μέσω CSS → χωρίς διάκριση πεζών).
  [SAMPLE, '/study/review?scope=unit:psd115/k2', { text: [WRONG_RE, /Εβδ\.2 — Μεταβλητ/iu] }],
  [SAMPLE, '/study/review?scope=psd200', { text: [/Δεν υπάρχει ακόμα περιεχόμενο μελέτης/], notText: [WRONG_RE, /Καθαρισμός λίστας/] }],
  [SAMPLE, '/psd115/topics/research-methods-overview', { checks: (n) => pad([true, true, false], n) }],
  // Καθαρή αρχή: κανένα κλειδί προόδου → 0, και καμία εγγραφή (κανένα namespace δεν δημιουργείται).
  [EMPTY, '/psd115/topics/pavlov', { text: [/Κάρτες 0\/94/] }],
]

const browser = await launch()
const servers = []
let distBase = null
const stop = () => servers.forEach((s) => s.kill())
const nextCardButton = (page) => page.getByRole('button', { name: /^(Επόμενη κάρτα|Από την αρχή)$/ }).first()
const seenCards = (keys) => JSON.parse(keys[EV] ?? '[]').filter((e) => e.kind === 'flip').map((e) => e.item)

try {
  // ------------------------------------------------------------ G1
  {
    const before = failures.length
    const { server, base } = await serve('dist')
    servers.push(server)
    distBase = base
    for (const [keys, route, expect] of BOOT_CASES) for (const f of await bootGate(browser, base, keys, route, expect)) fail(`G1 ${f}`)
    console.log(`${failures.length > before ? '✗' : '✓'} G1 πρώτο render: ${BOOT_CASES.length} boots · 0 εγγραφές · πρώτο DOM με τις τιμές του fixture · κλειδιά byte-identical`)
  }

  // ------------------------------------------------------------ G1-M (πρέπει να αποτύχουν)
  {
    const before = failures.length
    const gate = BOOT_CASES[0]
    const detail = {}
    for (const name of Object.keys(MUTATIONS)) {
      const { server, base } = await serve(`dist-progress-${name}`)
      servers.push(server)
      const got = await bootGate(browser, base, ...gate)
      detail[name] = got
      if (!got.length) fail(`G1-M ${name}: το mutation build ΠΕΡΑΣΕ το gate — το gate δεν αποδεικνύει τίποτα`)
    }
    check(detail.m1?.some((f) => /εγγραφές στο boot/.test(f)), 'G1-M m1: δεν πιάστηκε από τον write detector')
    check(detail.m2?.some((f) => /πρώτο DOM/.test(f)), 'G1-M m2: δεν πιάστηκε από τον έλεγχο του πρώτου DOM')
    console.log(`${failures.length > before ? '✗' : '✓'} G1 mutations: M1 (εγγραφή στο mount) → «${detail.m1?.[0] ?? '—'}» · M2 (hydration σε effect) → «${detail.m2?.find((f) => /πρώτο DOM/.test(f)) ?? '—'}»`)
  }

  // ------------------------------------------------------------ D, U, P, W, T, R
  {
    const before = failures.length
    const base = distBase
    // D: κατεστραμμένο store (άκυρο JSON στα events) → global degraded.
    const corrupt = { ...SAMPLE, [EV]: '{oops' }
    let { context, page } = await newContext(browser, corrupt)
    await page.goto(`${base}/psd115/topics/pavlov`)
    await settle(page)
    const degraded = page.getByTestId('progress-degraded')
    check(await degraded.isVisible(), 'D: δεν εμφανίστηκε μήνυμα ασφαλούς λειτουργίας')
    check(/αντικαταστήσεις από αντίγραφο/.test((await degraded.textContent().catch(() => '')) ?? ''), 'D: το μήνυμα δεν λέει τι μπορεί να γίνει')
    await page.locator('main input[type=checkbox]').first().click()
    if (await nextCardButton(page).count()) await nextCardButton(page).click()
    await page.waitForTimeout(300)
    check((await page.evaluate(() => window.__writes)).length === 0, 'D: εγγραφή σε degraded mode')
    check(sameKeys(await readKeys(page), corrupt), 'D: τα κατεστραμμένα κλειδιά άλλαξαν')
    // D-reset: δεν επιτρέπεται όταν το store δεν διαβάζεται.
    let alertText = ''
    page.once('dialog', async (d) => {
      alertText = d.message()
      await d.accept()
    })
    await page.getByRole('button', { name: 'Επαναφορά προόδου του PSD115' }).click()
    await page.getByRole('button', { name: 'Ναι, μηδενισμός' }).click()
    await page.waitForTimeout(300)
    check(/δεν επιτρέπεται/.test(alertText), `D-reset: λάθος/κανένα μήνυμα («${alertText}»)`)
    check(sameKeys(await readKeys(page), corrupt), 'D-reset: άλλαξαν κλειδιά')
    // D-R1: αντικατάσταση με αποτυχία του τοπικού backup (quota) → ακύρωση, τίποτα δεν αλλάζει.
    const input = page.getByTestId('progress-import-input')
    const sampleBuffer = Buffer.from(JSON.stringify(SAMPLE_FILE))
    await page.evaluate(() => {
      const orig = Storage.prototype.setItem
      window.__restoreSetItem = () => (Storage.prototype.setItem = orig)
      Storage.prototype.setItem = function (k, v) {
        if (this === localStorage && String(k).startsWith('study-progress-backup-')) throw new DOMException('full', 'QuotaExceededError')
        return orig.call(this, k, v)
      }
    })
    await input.setInputFiles({ name: 'sample.json', mimeType: 'application/json', buffer: sampleBuffer })
    await page.getByRole('button', { name: 'Ναι, αντικατάσταση' }).click()
    await page.waitForTimeout(300)
    check(/επιβεβαιωμένο αντίγραφο ασφαλείας/.test((await page.getByTestId('progress-backup-message').textContent().catch(() => '')) ?? ''), 'D-R1: λάθος/κανένα μήνυμα')
    check(sameKeys(Object.fromEntries(Object.entries(await readKeys(page)).filter(([k]) => !k.startsWith('study-progress-backup-'))), corrupt), 'D-R1: η αντικατάσταση προχώρησε χωρίς επαληθευμένο backup')
    check(await degraded.isVisible(), 'D-R1: χάθηκε το μήνυμα ασφαλούς λειτουργίας')
    // D-R2: αντικατάσταση με backup → raw byte-identical στο αρχείο και τοπικά, μετά resync.
    await page.evaluate(() => window.__restoreSetItem())
    await input.setInputFiles({ name: 'sample.json', mimeType: 'application/json', buffer: sampleBuffer })
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Ναι, αντικατάσταση' }).click()])
    const backup = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'))
    await page.waitForTimeout(400)
    check(backup.keys[EV] === '{oops' && backup.reason === 'replace', 'D-R2: το backup δεν κράτησε τα αλλοιωμένα raw')
    const afterReplace = await readKeys(page)
    const localKey = Object.keys(afterReplace).find((k) => k.startsWith('study-progress-backup-'))
    check(localKey && afterReplace[localKey] === JSON.stringify(backup), 'D-R2: το τοπικό αντίγραφο δεν ταυτίζεται με το αρχείο')
    check(afterReplace[EV] === SAMPLE[EV], 'D-R2: η αντικατάσταση δεν ολοκληρώθηκε')
    check(!(await degraded.count()), 'D-R2: μετά την αντικατάσταση η εφαρμογή έμεινε σε degraded')
    check(/Κάρτες 21\/94/.test(await page.locator('#root').innerText()), 'D-R2: το UI δεν δείχνει την πρόοδο του αρχείου')
    await context.close()

    // U: legacy και άγνωστα κλειδιά: ποτέ δεν διαβάζονται ή αγγίζονται.
    const withLegacy = {
      ...SAMPLE,
      'psd115-w1-study': '{"quizAnswered":999}',
      'psd115-w1-pavlov-checklist': '[true,true,true]',
      'psd115-w2-checklists': '{"overview":[true]}',
      'psd115-backup-2026-01-01T00:00:00.000Z': '{}',
      'migration:psd115-v1': '{}',
      'psd115-extra-unknown': 'keep-me',
      'psd115-w1-theme': 'light',
      'psd115-disclaimer-v1': '1',
    }
    const LEGACY_SEEDED = Object.keys(withLegacy).filter((k) => !ALLOWED_READ(k) && k !== EV && k !== ST)
    ;({ context, page } = await newContext(browser, withLegacy))
    await page.goto(`${base}/psd115/topics/pavlov`)
    await settle(page)
    check(!(await page.getByTestId('progress-degraded').count()), 'U: legacy/άγνωστα κλειδιά έβγαλαν degraded')
    check(/Κάρτες 21\/94/.test(await page.locator('#root').innerText()), 'U: το UI διάβασε legacy πρόοδο')
    await page.locator('main input[type=checkbox]').first().click()
    await page.waitForTimeout(300)
    const writes = await page.evaluate(() => window.__writes)
    check(writes.length === 1 && writes[0].k === ST, `U: εγγραφές ${JSON.stringify(writes)}`)
    const readsBefore = (await page.evaluate(() => window.__reads)).length
    await readKeys(page)
    check((await page.evaluate(() => window.__reads)).length === readsBefore, 'U: οι αναγνώσεις του smoke καταγράφηκαν ως αναγνώσεις της εφαρμογής')
    await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Εξαγωγή προόδου (JSON)' }).click()])
    await page.getByRole('button', { name: 'Επαναφορά προόδου του PSD115' }).click()
    await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Ναι, μηδενισμός' }).click()])
    await page.waitForTimeout(500)
    const uReads = [...new Set(await page.evaluate(() => window.__reads))]
    check(uReads.some((k) => k.startsWith('study-progress-backup-')), 'U: το reset δεν πέρασε από το backup (καμία ανάγνωση study-progress-backup-*)')
    check(uReads.includes(ST), 'U: η εφαρμογή δεν διάβασε το store (η καταγραφή δεν λειτουργεί)')
    const forbidden = uReads.filter((k) => !ALLOWED_READ(k))
    check(!forbidden.length, `U: η εφαρμογή διάβασε κλειδιά εκτός whitelist: ${JSON.stringify(forbidden)}`)
    for (const k of LEGACY_SEEDED) check(!uReads.includes(k), `U: διαβάστηκε το legacy κλειδί «${k}»`)
    const uKeys = await readKeys(page)
    for (const k of LEGACY_SEEDED) check(uKeys[k] === withLegacy[k], `U: το «${k}» άλλαξε`)
    await context.close()

    // P: εκκρεμές σημάδι κατά τη λειτουργία. Μισή κατάσταση όπως την αφήνει μια συναλλαγή που διακόπηκε:
    //    το events έχει την τιμή «after», το state την «before», το σημάδι μένει → η ανάκτηση επαναφέρει τα «before».
    ;({ context, page } = await newContext(browser, SAMPLE))
    await page.goto(`${base}/psd115/topics/pavlov`)
    await settle(page)
    const marker = JSON.stringify({ v: 1, op: 'import', startedAt: new Date().toISOString(), before: { [EV]: SAMPLE[EV], [ST]: SAMPLE[ST] }, after: { [EV]: '[]', [ST]: '{}' } })
    await page.evaluate(([ev, m, txn]) => {
      localStorage.setItem(ev, '[]')
      localStorage.setItem(txn, m)
      window.__writes.length = 0
    }, [EV, marker, TXN])
    const pendingKeys = await readKeys(page)
    const box = page.locator('main input[type=checkbox]').nth(1)
    const wasChecked = await box.isChecked()
    await box.click()
    await page.waitForTimeout(300)
    check((await page.evaluate(() => window.__writes)).length === 0, `P: εγγραφές με εκκρεμές σημάδι ${JSON.stringify(await page.evaluate(() => window.__writes))}`)
    check(sameKeys(await readKeys(page), pendingKeys), 'P: τα κλειδιά ή το σημάδι άλλαξαν')
    check(await page.getByTestId('progress-degraded').isVisible(), 'P: δεν εμφανίστηκε μήνυμα ασφαλούς λειτουργίας')
    check((await box.isChecked()) === wasChecked, 'P: το checkbox δείχνει την απορριφθείσα αλλαγή ως αποθηκευμένη')
    await page.reload()
    await settle(page)
    const recovered = await readKeys(page)
    check(recovered[EV] === SAMPLE[EV] && recovered[ST] === SAMPLE[ST], 'P: η ανάκτηση δεν επανέφερε τις αρχικές τιμές')
    check(!(TXN in recovered), 'P: το σημάδι έμεινε μετά την ανάκτηση')
    check(!(await page.getByTestId('progress-degraded').count()), 'P: μετά την ανάκτηση η εφαρμογή έμεινε σε degraded')
    await context.close()

    // W: αποτυχία αποθήκευσης χωρίς σημάδι (Φάση 2).
    ;({ context, page } = await newContext(browser, SAMPLE))
    await page.goto(`${base}/psd115/topics/pavlov`)
    await settle(page)
    const quotaOn = () =>
      page.evaluate(([ev, st]) => {
        const P = Storage.prototype
        window.__realSetItem ??= P.setItem
        window.__attempts = 0
        P.setItem = function (k, v) {
          if (this === localStorage && (k === ev || k === st)) {
            window.__attempts++
            throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
          }
          return window.__realSetItem.call(this, k, v)
        }
      }, [EV, ST])
    const quotaOff = () => page.evaluate(() => (Storage.prototype.setItem = window.__realSetItem))
    const notice = page.getByTestId('progress-write-failure')
    const wBox = page.locator('main input[type=checkbox]').first()
    const wBefore = await readKeys(page)
    const wChecked = await wBox.isChecked()
    await quotaOn()
    await wBox.click()
    await page.waitForTimeout(300)
    check((await page.evaluate(() => window.__attempts)) >= 1, 'W: δεν έγινε απόπειρα εγγραφής')
    check(sameKeys(await readKeys(page), wBefore), 'W: άλλαξαν αποθηκευμένες τιμές παρά την αποτυχία')
    check(await notice.isVisible(), 'W: δεν εμφανίστηκε η ειδοποίηση αποτυχίας αποθήκευσης')
    check(/χώρος αποθήκευσης του browser φαίνεται γεμάτος/.test((await notice.count()) ? ((await notice.textContent()) ?? '') : ''), 'W: λάθος/κανένα κείμενο ειδοποίησης (quota)')
    check(!(await page.getByTestId('progress-degraded').count()), 'W: η αποτυχία εγγραφής έβγαλε degraded')
    check((await wBox.isChecked()) === wChecked, 'W: το checkbox δείχνει την αλλαγή που δεν αποθηκεύτηκε')
    if (await notice.count()) await notice.getByRole('button', { name: 'Απόκρυψη ειδοποίησης' }).click()
    await page.waitForTimeout(200)
    check(!(await notice.count()), 'W: η ειδοποίηση δεν κρύφτηκε')
    check(sameKeys(await readKeys(page), wBefore) && (await wBox.isChecked()) === wChecked, 'W: το κλείσιμο άλλαξε κάτι')
    await wBox.click() // ξανά αποτυχία
    await page.waitForTimeout(300)
    check(await notice.isVisible(), 'W: δεύτερη αποτυχία χωρίς ειδοποίηση')
    await quotaOff()
    // Άσχετη επιτυχημένη εγγραφή (κάρτα): η ειδοποίηση πρέπει να ΜΕΙΝΕΙ — το checklist είναι ακόμα χαμένο.
    const evBefore = (await readKeys(page))[EV]
    for (let i = 0; i < 10 && (await readKeys(page))[EV] === evBefore; i++) {
      await nextCardButton(page).click()
      await page.waitForTimeout(150)
    }
    check((await readKeys(page))[EV] !== evBefore, 'W: δεν έγινε άσχετη επιτυχημένη εγγραφή (κάρτα)')
    check(await notice.isVisible(), 'W: η ειδοποίηση χάθηκε μετά από ΑΣΧΕΤΗ επιτυχημένη εγγραφή')
    check(JSON.stringify(pavlovItems(await readKeys(page))) === JSON.stringify(pavlovItems(wBefore)), 'W: το checklist άλλαξε χωρίς επανάληψη')
    await wBox.click() // ο χρήστης επαναλαμβάνει την ΙΔΙΑ ενέργεια με ελεύθερο storage
    await page.waitForTimeout(300)
    check(pavlovItems(await readKeys(page))[0] === !wChecked, 'W: η επανάληψη δεν αποθηκεύτηκε')
    check((await wBox.isChecked()) === !wChecked, 'W: το checkbox δεν δείχνει την αποθηκευμένη αλλαγή')
    check(!(await notice.count()), 'W: η ειδοποίηση έμεινε μετά από επιτυχημένη εγγραφή')
    await page.reload()
    await settle(page)
    check((await wBox.isChecked()) === pavlovItems(await readKeys(page))[0], 'W: μετά το reload μνήμη ≠ storage')
    await context.close()

    // T: δύο tabs στο ίδιο context (κοινό origin/localStorage, πραγματικά storage events).
    ;({ context, page } = await newContext(browser, SAMPLE))
    const tA = page
    await tA.goto(`${base}/psd115/topics/pavlov`)
    const tB = await context.newPage()
    tB.on('pageerror', (e) => fail(`σφάλμα JS (B): ${e.message}`))
    await tB.goto(`${base}/psd115/topics/pavlov`)
    await settle(tA)
    await settle(tB)
    const boxA = (i) => tA.locator('main input[type=checkbox]').nth(i)
    const boxB = (i) => tB.locator('main input[type=checkbox]').nth(i)
    const t0 = [await boxA(0).isChecked(), await boxA(2).isChecked()]
    await tB.evaluate(() => (window.__writes.length = 0))
    await boxA(0).click()
    await tA.waitForTimeout(400)
    check((await boxB(0).isChecked()) === !t0[0], 'T: το B δεν ενημερώθηκε από την αλλαγή του A (storage event)')
    check((await tB.evaluate(() => window.__writes)).length === 0, 'T: το B έγραψε στο storage απλώς επειδή ενημερώθηκε')
    await boxB(2).click()
    await tB.waitForTimeout(400)
    const items = pavlovItems(await readKeys(tA))
    check(items[0] === !t0[0] && items[2] === !t0[1], `T: χάθηκε τσεκ από ένα tab (storage ${JSON.stringify(items.slice(0, 3))})`)
    check((await boxA(2).isChecked()) === !t0[1], 'T: το A δεν ενημερώθηκε από την αλλαγή του B')
    const addCard = async (p) => {
      const before = new Set(seenCards(await readKeys(tA)))
      for (let i = 0; i < 10 && seenCards(await readKeys(tA)).length === before.size; i++) {
        await nextCardButton(p).click()
        await p.waitForTimeout(150)
      }
      return seenCards(await readKeys(tA)).find((id) => !before.has(id))
    }
    const cardA = await addCard(tA)
    const cardB = await addCard(tB)
    const seen = seenCards(await readKeys(tA))
    check(cardA && cardB && seen.includes(cardA) && seen.includes(cardB), `T: χάθηκε κάρτα από ένα tab (A ${cardA}, B ${cardB})`)
    await tA.reload()
    await tB.reload()
    await settle(tA)
    await settle(tB)
    const stored = pavlovItems(await readKeys(tA))
    for (const [label, p] of [['A', tA], ['B', tB]]) {
      const shown = await p.locator('main input[type=checkbox]').evaluateAll((els) => els.map((e) => e.checked))
      check(JSON.stringify(shown.slice(0, 3)) === JSON.stringify(stored.slice(0, 3)), `T: μετά το reload το ${label} ≠ storage`)
    }
    await context.close()

    // R1: reset με εκκρεμές σημάδι → άρνηση πριν από το backup.
    ;({ context, page } = await newContext(browser, SAMPLE))
    await page.goto(`${base}/psd115/topics/pavlov`)
    await settle(page)
    await page.evaluate(([txn, m]) => localStorage.setItem(txn, m), [TXN, JSON.stringify({ v: 1, op: 'x', before: {}, after: {} })])
    const r1Before = await readKeys(page)
    let text = ''
    let downloads = 0
    page.on('download', () => downloads++)
    page.once('dialog', async (d) => {
      text = d.message()
      await d.accept()
    })
    await page.getByRole('button', { name: 'Επαναφορά προόδου του PSD115' }).click()
    await page.getByRole('button', { name: 'Ναι, μηδενισμός' }).click()
    await page.waitForTimeout(400)
    check(/Εκκρεμεί ανάκτηση· επαναφόρτωσε τη σελίδα πριν δοκιμάσεις ξανά/.test(text), `R1: λάθος μήνυμα («${text}»)`)
    check(downloads === 0, `R1: έγινε λήψη backup (${downloads})`)
    check(sameKeys(await readKeys(page), r1Before), 'R1: άλλαξαν κλειδιά (backup ή πρόοδος)')
    await context.close()
    // R2: import με πραγματικό rollback-incomplete (η 2η εγγραφή της συναλλαγής αποτυγχάνει, μετά και η αναίρεση).
    ;({ context, page } = await newContext(browser, SAMPLE))
    await page.goto(`${base}/psd115/topics/pavlov`)
    await settle(page)
    const r2Before = await readKeys(page)
    const extra = { ...SAMPLE_FILE, events: [...SAMPLE_FILE.events, { id: '00000000-0000-4000-8000-0000000009a1', t: SAMPLE_FILE.events.at(-1).t + 1, item: 'psd115/q-def-1', kind: 'answer', ok: 1, ctx: 'quiz' }], state: { ...SAMPLE_FILE.state, 'future-key': 1 } }
    await page.evaluate(([ev, st]) => {
      const P = Storage.prototype
      const { setItem } = P
      let n = 0
      P.setItem = function (k, v) {
        if (this === localStorage && (k === ev || k === st) && ++n >= 2) throw new DOMException('fail', 'UnknownError')
        return setItem.call(this, k, v)
      }
    }, [EV, ST])
    await page.getByTestId('progress-import-input').setInputFiles({ name: 'more.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(extra)) })
    await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /^Ναι, εισαγωγή$/ }).click()])
    await page.waitForTimeout(300)
    const r2Text = (await page.getByTestId('progress-backup-message').textContent().catch(() => '')) ?? ''
    check(/δεν ολοκληρώθηκε με ασφάλεια/.test(r2Text) && /Επαναφόρτωσε τη σελίδα για να επιχειρηθεί ανάκτηση/.test(r2Text), `R2: λάθος μήνυμα («${r2Text}»)`)
    check(!/δεν άλλαξε|διατηρήθηκε/.test(r2Text), `R2: το μήνυμα ισχυρίζεται ότι η πρόοδος δεν άλλαξε («${r2Text}»)`)
    check((await readKeys(page))[TXN] !== undefined, 'R2: δεν έμεινε σημάδι για την ανάκτηση')
    await page.reload() // νέα σελίδα: χωρίς τα patches του Storage
    await settle(page)
    const r2After = await readKeys(page)
    check(r2After[EV] === r2Before[EV] && r2After[ST] === r2Before[ST], 'R2: η ανάκτηση δεν επανέφερε τις αρχικές τιμές')
    check(!(TXN in r2After), 'R2: το σημάδι έμεινε μετά την ανάκτηση')
    await context.close()
    console.log(
      `${failures.length > before ? '✗' : '✓'} Degraded: μήνυμα · 0 εγγραφές και μετά από ενέργειες · reset δεν επιτρέπεται · αντικατάσταση χωρίς επαληθευμένο backup → ακύρωση · με backup (raw byte-identical) → resync · legacy/άγνωστα κλειδιά ανέγγιχτα · εκκρεμές σημάδι → 0 εγγραφές + μήνυμα, reload → ανάκτηση · αποτυχία εγγραφής → ειδοποίηση (όχι degraded), καμία ψευδής αποθήκευση, κλείσιμο, μένει μετά από άσχετη εγγραφή, ανάκαμψη με επανάληψη · δύο tabs: ενημέρωση χωρίς reload, καμία χαμένη αλλαγή · reset με σημάδι → «Εκκρεμεί ανάκτηση», 0 λήψεις · import με rollback-incomplete → σωστό μήνυμα, reload → ανάκτηση`,
    )
  }

  // ------------------------------------------------------------ G2 (smoke build)
  {
    const before = failures.length
    const { server, base } = await serve('dist-progress')
    servers.push(server)
    const { context, page } = await newContext(browser, SAMPLE)
    const probe = () =>
      page.evaluate(() => {
        const p = window.__progressProbe
        return { installed: p.installed, created: p.created(), reads: p.reads.splice(0), currentId: p.idOf(p.snapshot()), snapshot: JSON.parse(JSON.stringify(p.snapshot())) }
      })
    let lastId = null
    async function verify(step, { changed = true, consumers = [] } = {}) {
      await page.waitForTimeout(250)
      const p = await probe()
      check(p.installed === 1 && p.created === 1, `G2 ${step}: services installed ${p.installed} / created ${p.created}`)
      const lastByConsumer = new Map(p.reads.map((r) => [r.consumer, r.id]))
      for (const c of consumers) check(lastByConsumer.has(c), `G2 ${step}: ο consumer «${c}» δεν διάβασε`)
      for (const [c, id] of lastByConsumer) check(id === p.currentId, `G2 ${step}: ο consumer «${c}» βλέπει άλλο snapshot (${id} ≠ ${p.currentId})`)
      if (changed && lastId !== null) check(p.currentId !== lastId, `G2 ${step}: δεν δημιουργήθηκε νέο snapshot`)
      lastId = p.currentId
      const fromStorage = fromKeys(await readKeys(page))
      check(fromStorage.status === 'ready' && JSON.stringify(fromStorage.courses) === JSON.stringify(p.snapshot.courses), `G2 ${step}: μνήμη ≠ storage`)
      return p
    }

    await page.goto(`${base}/psd115/topics/pavlov`)
    await settle(page)
    await verify('boot', { changed: false, consumers: ['study-session', 'checklist'] })
    await page.locator('main input[type=checkbox]').first().click()
    await verify('checklist', { consumers: ['study-session', 'checklist'] })
    await nextCardButton(page).click()
    await verify('κάρτα')

    await page.goto(`${base}/study/quiz?scope=unit:psd115/k2`)
    await settle(page)
    lastId = null
    await verify('quiz boot', { changed: false })
    await page.getByRole('button', { name: 'Έναρξη κουίζ' }).click()
    for (const correct of [true, false]) {
      const qText = ((await page.locator('main h2').first().textContent()) ?? '').trim()
      const labels = (await page.locator('main ul li button').allTextContents()).map((t) => t.trim())
      const q = quizQuestions.find((x) => x.question.trim() === qText && [...x.options].sort().join('|') === [...labels].sort().join('|'))
      const right = q.options[q.correctIndex]
      await page.locator('main ul li button').nth(correct ? labels.indexOf(right) : labels.findIndex((l) => l !== right)).click()
      const p = await verify(correct ? 'σωστή' : 'λάθος')
      const s = p.snapshot.courses.psd115
      check(s.quizAnswered === (correct ? 2 : 3), `G2 ${correct ? 'σωστή' : 'λάθος'}: quizAnswered ${s.quizAnswered}`)
      await page.getByRole('button', { name: /^(Συνέχεια|Τέλος κουίζ)$/ }).click()
    }

    await page.goto(`${base}/study/review?scope=unit:psd115/k2`)
    await settle(page)
    lastId = null
    await verify('review boot', { changed: false })
    await page.locator('main ul li button').first().click()
    await page.getByRole('button', { name: 'Αφαίρεση από τη λίστα' }).click()
    const afterRemove = await verify('αφαίρεση λάθους')
    check(afterRemove.snapshot.courses.psd115.wrongBook.length === 1, 'G2 αφαίρεση: λάθος πλήθος wrongBook')

    await page.goto(`${base}/psd115/topics/pavlov`)
    await settle(page)
    lastId = null
    await verify('reset boot', { changed: false })
    const eventsBefore = (await readKeys(page))[EV]
    await page.getByRole('button', { name: 'Επαναφορά προόδου του PSD115' }).click()
    await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Ναι, μηδενισμός' }).click()])
    await page.waitForTimeout(500)
    const afterReset = await verify('reset')
    const s = afterReset.snapshot.courses.psd115
    check(s.quizAnswered === 0 && !s.flashcardSeenIds.length && !Object.keys(s.checklists).length && !s.wrongBook.length, 'G2 reset: η μνήμη δεν μηδενίστηκε')
    const keys = await readKeys(page)
    check(keys[EV] === eventsBefore, 'G2 reset: άλλαξαν τα events (append-only)')
    check(!Object.keys(keys).some((k) => k.startsWith('psd115-w')), `G2: γράφτηκε legacy κλειδί (${Object.keys(keys).filter((k) => k.startsWith('psd115-w'))})`)
    check(/Κάρτες 0\/94/.test(await page.locator('#root').innerText()), 'G2 reset: το UI δεν δείχνει 0 μετά το reset')
    check(!(TXN in keys), 'G2: έμεινε σημάδι συναλλαγής')
    await context.close()
    console.log(`${failures.length > before ? '✗' : '✓'} G2 ένα snapshot: 1 service · ίδιο snapshot σε όλους τους consumers · νέο μετά από κάθε ενέργεια · μνήμη ≡ storage · reset μαθήματος → resync, events ανέγγιχτα`)
  }
} finally {
  await browser.close()
  stop()
}

if (failures.length) {
  console.error(`\n✗ Progress smoke: ${failures.length} αποτυχία(ες)`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log('✓ Progress smoke πέρασε')
