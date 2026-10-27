/**
 * Browser smoke του ProgressService (Phase 1E-4b, legacy mode).
 *
 *  G1. Κανονικό build (dist): boot με το production / sample fixture —
 *      ΚΑΜΙΑ εγγραφή στο localStorage από την πλοήγηση μέχρι το settle (setItem/removeItem/clear καταγράφονται)·
 *      το ΠΡΩΤΟ DOM (πρώτο commit, MutationObserver) έχει ήδη τις τιμές του fixture (όχι «Κάρτες 0/…»)·
 *      τα κλειδιά μένουν byte-identical· κανένα study-progress-* / progress-txn-v1.
 *  G1-M. Mutation builds (προσωρινές αλλαγές κώδικα, αναιρούνται στο τέλος): το gate ΠΡΕΠΕΙ να αποτύχει.
 *      M1: εγγραφή στο mount (όπως το παλιό saveProgress effect) → αποτυγχάνει ο write detector.
 *      M2: άδειο service + hydration σε effect → αποτυγχάνει ο έλεγχος του πρώτου DOM.
 *  D.  Degraded: κατεστραμμένη πρόοδος → μήνυμα, καμία εγγραφή ούτε μετά από ενέργειες, κλειδιά byte-identical·
 *      reset με αποτυχία τοπικού backup → ακύρωση· reset με backup → raw byte-identical στο αρχείο και τοπικά, resync.
 *  U.  Άγνωστο psd115-* κλειδί: δεν αγγίζεται ποτέ.
 *  P.  Εκκρεμές σημάδι συναλλαγής κατά τη λειτουργία (μετά από αποτυχημένο rollback, review PR #11): κλικ σε checklist →
 *      ΚΑΜΙΑ εγγραφή, μήνυμα ασφαλούς λειτουργίας, το checkbox δεν δείχνει «αποθηκευμένη» αλλαγή, σημάδι ανέγγιχτο·
 *      reload → η υπάρχουσα ανάκτηση επαναφέρει τις αρχικές τιμές, όχι degraded.
 *  W.  Αποτυχία αποθήκευσης χωρίς σημάδι (Φάση 2): γεμάτο storage → κλικ σε checkbox → ειδοποίηση (όχι degraded), το
 *      checkbox ΔΕΝ αλλάζει, καμία επιτυχής αλλαγή στο storage (έγινε απόπειρα)· κλείσιμο → κρύβεται, τίποτα δεν αλλάζει·
 *      ξανά αποτυχία, μετά ελεύθερο storage → ΑΣΧΕΤΗ επιτυχημένη εγγραφή (κάρτα) → η ειδοποίηση ΜΕΝΕΙ, το checklist
 *      αμετάβλητο (review #13)· επανάληψη της ίδιας ενέργειας → σώζεται, η ειδοποίηση φεύγει· reload → μνήμη ≡ storage.
 *  T.  Δύο tabs (Φάση 3): δύο πραγματικές σελίδες στο ΙΔΙΟ context (κοινό origin/localStorage, πραγματικά storage events):
 *      τσεκ στο A → το B ενημερώνεται χωρίς reload· τσεκ άλλου στοιχείου στο B → κρατιούνται και τα δύο· κάρτα στο A και στο B
 *      → κρατιούνται και οι δύο· reload και των δύο → μνήμη ≡ storage. 0 εγγραφές από το tab που μόνο ενημερώθηκε.
 *  R.  Μηνύματα reset ανά αποτέλεσμα (Φάση 1, D1/D2): εκκρεμές σημάδι → «Εκκρεμεί ανάκτηση», ΚΑΜΙΑ λήψη/backup·
 *      πραγματικό rollback-incomplete → «δεν ολοκληρώθηκε με ασφάλεια… επαναφόρτωσε», ΟΧΙ «δεν άλλαξε»·
 *      reload → ανάκτηση, αρχικές τιμές.
 *  G2. Smoke build (dist-progress, VITE_PROGRESS_SMOKE=1): 1 service· όλοι οι consumers ίδιο snapshot (===)·
 *      μετά από κάθε ενέργεια (checklist, κάρτα, σωστή, λάθος, αφαίρεση λάθους, reset) ίδιο ΝΕΟ snapshot (!== παλιό)
 *      και μνήμη ≡ storage (legacyToSnapshot των κλειδιών)· reset → resync, κανένα checklist ξανα-γράφεται.
 *
 *  --differential=<dist-dir>: ίδιο σενάριο (ντετερμινιστικό Math.random) στο <dist-dir> (παλιό build) και στο
 *  νέο dist· σύγκριση των σημασιολογικών legacy αποτελεσμάτων μετά από κάθε βήμα.
 *
 * Run: node scripts/smoke-progress.mjs   (το dist πρέπει να υπάρχει· τα υπόλοιπα builds γίνονται εδώ)
 */
import fs from 'fs'
import path from 'path'
import { spawn, spawnSync } from 'child_process'
import { fileURLToPath, pathToFileURL } from 'url'
import { chromium } from 'playwright'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const imp = (rel) => import(pathToFileURL(path.join(root, rel)).href)
const vite = path.join(root, 'node_modules/.bin/vite')
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')))

if (!fs.existsSync(path.join(root, 'dist/index.html'))) {
  console.error('✗ Δεν υπάρχει dist/. Τρέξε πρώτα: npm run build')
  process.exit(1)
}

const { quizQuestions } = await imp('content/courses/psd115/questions.js')
const { legacyToSnapshot } = await imp('src/core/progress/snapshot.js')
const { psd115ProgressAdapter: content } = await imp('src/core/progress/adapters/psd115.js')
const fixture = (name) => JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures', name), 'utf8')).keys
const PROD = fixture('progress-export.production-2026-10-05.json')
const SAMPLE = fixture('progress-export.sample.json')
const PROD_WRONG = JSON.parse(PROD['psd115-w1-study']).wrongBook[0]

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
  // M1: εγγραφή προόδου στο mount (το παλιό saveProgress effect).
  m1: {
    'src/hooks/useStudySession.js': [
      [
        '  const progressStatus = progressState.status\n',
        "  const progressStatus = progressState.status\n  useEffect(() => {\n    window.localStorage.setItem('psd115-w1-study', window.localStorage.getItem('psd115-w1-study') ?? '{}')\n  }, [])\n",
      ],
    ],
  },
  // M2: άδειο service στο boot, hydration σε effect μετά το πρώτο render.
  m2: {
    'src/core/progress/progressService.js': [['  let state = load()\n', "  let state = freezeState({ status: 'ready', issues: [], courses: { [courseId]: emptySnapshot(courseId) } })\n"]],
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
 * Init script: γράφει τα κλειδιά ΜΙΑ φορά (πριν από την παρακολούθηση), μετά καταγράφει κάθε εγγραφή του
 * localStorage και το DOM/checkboxes του ΠΡΩΤΟΥ commit στο #root. Προαιρετικά ντετερμινιστικό Math.random.
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
const readKeys = (page) => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])))
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
const BOOT_CASES = [
  [PROD, '/psd115/topics/pavlov', { text: [/Κουίζ 0% · Κάρτες 21\/94 \(22%\)/], notText: [/Κάρτες 0\//] }],
  [PROD, '/psd115/units/k2', { text: [/ακρίβεια 0% \(0\/1\)/, /μελετήθηκαν 21\/56/], notText: [/μελετήθηκαν 0\//] }],
  [PROD, '/progress?scope=psd115', { text: [/21\/\d+/] }],
  [PROD, '/study/review?scope=unit:psd115/k2', { text: [new RegExp(PROD_WRONG.question.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))] }],
  [SAMPLE, '/psd115/topics/pavlov', { text: [/Κάρτες 1\/94/], checks: (n) => pad([true, false, true], n) }],
  [SAMPLE, '/psd115/topics/research-methods-overview', { checks: (n) => pad([true, true, false], n) }],
]

const browser = await launch()
const servers = []
let distBase = null
const stop = () => servers.forEach((s) => s.kill())

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

  // ------------------------------------------------------------ D + U
  {
    const before = failures.length
    const base = distBase
    // D: κατεστραμμένη πρόοδος
    const corrupt = { ...PROD, 'psd115-w1-study': '{oops' }
    let { context, page } = await newContext(browser, corrupt)
    await page.goto(`${base}/psd115/topics/pavlov`)
    await settle(page)
    check(await page.getByTestId('progress-degraded').isVisible(), 'D: δεν εμφανίστηκε μήνυμα ασφαλούς λειτουργίας')
    await page.locator('main input[type=checkbox]').first().click()
    const nextCard = page.getByRole('button', { name: /^(Επόμενη κάρτα|Από την αρχή)$/ }).first()
    if (await nextCard.count()) await nextCard.click()
    await page.waitForTimeout(300)
    check((await page.evaluate(() => window.__writes)).length === 0, 'D: εγγραφή σε degraded mode')
    check(sameKeys(await readKeys(page), corrupt), 'D: τα κατεστραμμένα κλειδιά άλλαξαν')

    // D-R1: reset με αποτυχία του τοπικού backup (quota) → ακύρωση, μήνυμα, κλειδιά byte-identical, banner μένει.
    await page.evaluate(() => {
      const orig = Storage.prototype.setItem
      window.__restoreSetItem = () => (Storage.prototype.setItem = orig)
      Storage.prototype.setItem = function (k, v) {
        if (this === localStorage && String(k).startsWith('psd115-backup-')) throw new DOMException('full', 'QuotaExceededError')
        return orig.call(this, k, v)
      }
    })
    let alertText = ''
    page.once('dialog', async (d) => {
      alertText = d.message()
      await d.accept()
    })
    await page.getByRole('button', { name: 'Επαναφορά προόδου μελέτης' }).click()
    await page.getByRole('button', { name: 'Ναι, διαγραφή' }).click()
    await page.waitForTimeout(400)
    check(/επιβεβαιωμένο αντίγραφο ασφαλείας/.test(alertText), `D-R1: λάθος/κανένα μήνυμα («${alertText}»)`)
    check(sameKeys(await readKeys(page), corrupt), 'D-R1: το reset προχώρησε χωρίς επαληθευμένο backup')
    check(await page.getByTestId('progress-degraded').isVisible(), 'D-R1: χάθηκε το μήνυμα ασφαλούς λειτουργίας')

    // D-R2: reset με επιτυχές backup → το backup (αρχείο + τοπικό) κρατά τα αλλοιωμένα raw, μετά διαγραφή + resync.
    await page.evaluate(() => window.__restoreSetItem())
    await page.getByRole('button', { name: 'Επαναφορά προόδου μελέτης' }).click()
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Ναι, διαγραφή' }).click()])
    const backup = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'))
    await page.waitForTimeout(400)
    check(backup.keys['psd115-w1-study'] === '{oops', 'D-R2: το backup δεν κράτησε τα αλλοιωμένα raw')
    const afterReset = await readKeys(page)
    const localKey = Object.keys(afterReset).find((k) => k.startsWith('psd115-backup-'))
    check(localKey && afterReset[localKey] === JSON.stringify(backup), 'D-R2: το τοπικό αντίγραφο δεν ταυτίζεται με το αρχείο')
    check(!('psd115-w1-study' in afterReset), 'D-R2: το reset δεν ολοκληρώθηκε')
    check(!(await page.getByTestId('progress-degraded').count()), 'D-R2: μετά το reset η εφαρμογή έμεινε σε degraded')
    await context.close()
    // U: άγνωστο κλειδί
    const unknown = { ...PROD, 'psd115-extra-unknown': 'keep-me' }
    ;({ context, page } = await newContext(browser, unknown))
    await page.goto(`${base}/psd115/topics/pavlov`)
    await settle(page)
    check(!(await page.getByTestId('progress-degraded').count()), 'U: άγνωστο κλειδί έβγαλε degraded')
    await page.locator('main input[type=checkbox]').first().click()
    await page.waitForTimeout(300)
    const writes = await page.evaluate(() => window.__writes)
    check(writes.length === 1 && writes[0].k === 'psd115-w1-pavlov-checklist', `U: εγγραφές ${JSON.stringify(writes)}`)
    check((await readKeys(page))['psd115-extra-unknown'] === 'keep-me', 'U: το άγνωστο κλειδί άλλαξε')
    await context.close()
    // P: εκκρεμές σημάδι κατά τη λειτουργία. Μισή κατάσταση όπως την αφήνει ένα import με αποτυχημένο rollback:
    //    το 1ο κλειδί έχει την τιμή «after», το 2ο την «before», το σημάδι μένει.
    ;({ context, page } = await newContext(browser, PROD))
    await page.goto(`${base}/psd115/topics/pavlov`)
    await settle(page)
    const PAV = 'psd115-w1-pavlov-checklist'
    const W4 = 'psd115-w4-checklists'
    const half = JSON.stringify(Array(9).fill(true))
    const marker = JSON.stringify({ v: 1, op: 'import-v1', startedAt: new Date().toISOString(), before: { [PAV]: PROD[PAV], [W4]: PROD[W4] }, after: { [PAV]: half, [W4]: '{}' } })
    await page.evaluate(([pav, h, m]) => {
      localStorage.setItem(pav, h)
      localStorage.setItem('progress-txn-v1', m)
      window.__writes.length = 0
    }, [PAV, half, marker])
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
    check(recovered[PAV] === PROD[PAV] && recovered[W4] === PROD[W4], 'P: η ανάκτηση δεν επανέφερε τις αρχικές τιμές')
    check(!('progress-txn-v1' in recovered), 'P: το σημάδι έμεινε μετά την ανάκτηση')
    check(!(await page.getByTestId('progress-degraded').count()), 'P: μετά την ανάκτηση η εφαρμογή έμεινε σε degraded')
    await context.close()
    // W: αποτυχία αποθήκευσης χωρίς σημάδι (Φάση 2).
    ;({ context, page } = await newContext(browser, PROD))
    await page.goto(`${base}/psd115/topics/pavlov`)
    await settle(page)
    const quotaOn = () =>
      page.evaluate(() => {
        const P = Storage.prototype
        window.__realSetItem ??= P.setItem
        window.__attempts = 0
        P.setItem = function (k, v) {
          if (this === localStorage && String(k).startsWith('psd115-') && !String(k).startsWith('psd115-backup-')) {
            window.__attempts++
            throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
          }
          return window.__realSetItem.call(this, k, v)
        }
      })
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
    const studyBefore = (await readKeys(page))['psd115-w1-study']
    const next = page.getByRole('button', { name: /^(Επόμενη κάρτα|Από την αρχή)$/ }).first()
    for (let i = 0; i < 8 && (await readKeys(page))['psd115-w1-study'] === studyBefore; i++) {
      await next.click()
      await page.waitForTimeout(150)
    }
    check((await readKeys(page))['psd115-w1-study'] !== studyBefore, 'W: δεν έγινε άσχετη επιτυχημένη εγγραφή (κάρτα)')
    check(await notice.isVisible(), 'W: η ειδοποίηση χάθηκε μετά από ΑΣΧΕΤΗ επιτυχημένη εγγραφή')
    check((await readKeys(page))['psd115-w1-pavlov-checklist'] === wBefore['psd115-w1-pavlov-checklist'], 'W: το checklist άλλαξε χωρίς επανάληψη')
    await wBox.click() // ο χρήστης επαναλαμβάνει την ΙΔΙΑ ενέργεια με ελεύθερο storage
    await page.waitForTimeout(300)
    const wAfter = await readKeys(page)
    check(JSON.parse(wAfter['psd115-w1-pavlov-checklist'])[0] === !wChecked, 'W: η επανάληψη δεν αποθηκεύτηκε')
    check((await wBox.isChecked()) === !wChecked, 'W: το checkbox δεν δείχνει την αποθηκευμένη αλλαγή')
    check(!(await notice.count()), 'W: η ειδοποίηση έμεινε μετά από επιτυχημένη εγγραφή')
    await page.reload()
    await settle(page)
    check((await wBox.isChecked()) === JSON.parse((await readKeys(page))['psd115-w1-pavlov-checklist'])[0], 'W: μετά το reload μνήμη ≠ storage')
    await context.close()

    // T: δύο tabs στο ίδιο context.
    ;({ context, page } = await newContext(browser, PROD))
    const tA = page
    await tA.goto(`${base}/psd115/topics/pavlov`)
    const tB = await context.newPage()
    tB.on('pageerror', (e) => fail(`σφάλμα JS (B): ${e.message}`))
    await tB.goto(`${base}/psd115/topics/pavlov`)
    await settle(tA)
    await settle(tB)
    // Το B άνοιξε (και ξανα-σπόρισε το localStorage, sessionStorage ανά tab) — από εδώ και πέρα κανένα seeding.
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
    const items = JSON.parse((await readKeys(tA))[PAV])
    check(items[0] === !t0[0] && items[2] === !t0[1], `T: χάθηκε τσεκ από ένα tab (storage ${JSON.stringify(items.slice(0, 3))})`)
    check((await boxA(2).isChecked()) === !t0[1], 'T: το A δεν ενημερώθηκε από την αλλαγή του B')
    // Κάρτες: ένα νέο «είδα» σε κάθε tab → κρατιούνται και τα δύο.
    const seenOf = async () => JSON.parse((await readKeys(tA))['psd115-w1-study']).flashcardSeenIds
    const addCard = async (p) => {
      const before = new Set(await seenOf())
      const next = p.getByRole('button', { name: /^(Επόμενη κάρτα|Από την αρχή)$/ }).first()
      for (let i = 0; i < 10 && (await seenOf()).length === before.size; i++) {
        await next.click()
        await p.waitForTimeout(150)
      }
      return (await seenOf()).find((id) => !before.has(id))
    }
    const cardA = await addCard(tA)
    const cardB = await addCard(tB)
    const seen = await seenOf()
    check(cardA && cardB && seen.includes(cardA) && seen.includes(cardB), `T: χάθηκε κάρτα από ένα tab (A ${cardA}, B ${cardB})`)
    // Reload και των δύο → μνήμη ≡ storage.
    await tA.reload()
    await tB.reload()
    await settle(tA)
    await settle(tB)
    const stored = JSON.parse((await readKeys(tA))[PAV])
    for (const [label, p] of [['A', tA], ['B', tB]]) {
      const shown = await p.locator('main input[type=checkbox]').evaluateAll((els) => els.map((e) => e.checked))
      check(JSON.stringify(shown.slice(0, 3)) === JSON.stringify(stored.slice(0, 3)), `T: μετά το reload το ${label} ≠ storage`)
    }
    await context.close()

    // R: μηνύματα reset ανά πραγματικό αποτέλεσμα (D1/D2).
    ;({ context, page } = await newContext(browser, PROD))
    await page.goto(`${base}/psd115/topics/pavlov`)
    await settle(page)
    const resetVia = async () => {
      let text = ''
      let downloads = 0
      const onDownload = () => downloads++
      page.on('download', onDownload)
      page.once('dialog', async (d) => {
        text = d.message()
        await d.accept()
      })
      await page.getByRole('button', { name: 'Επαναφορά προόδου μελέτης' }).click()
      await page.getByRole('button', { name: 'Ναι, διαγραφή' }).click()
      await page.waitForTimeout(400)
      page.off('download', onDownload)
      return { text, downloads }
    }
    // R1: εκκρεμές σημάδι → άρνηση πριν από το backup.
    await page.evaluate((m) => localStorage.setItem('progress-txn-v1', m), JSON.stringify({ v: 1, op: 'x', before: {}, after: {} }))
    const r1Before = await readKeys(page)
    let r = await resetVia()
    check(/Εκκρεμεί ανάκτηση· επαναφόρτωσε τη σελίδα πριν δοκιμάσεις ξανά/.test(r.text), `R1: λάθος μήνυμα («${r.text}»)`)
    check(r.downloads === 0, `R1: έγινε λήψη backup (${r.downloads})`)
    check(sameKeys(await readKeys(page), r1Before), 'R1: άλλαξαν κλειδιά (backup ή πρόοδος)')
    await page.evaluate(() => localStorage.removeItem('progress-txn-v1'))
    // R2: πραγματικό rollback-incomplete (η 2η διαγραφή αποτυγχάνει, μετά αποτυγχάνει και η επαναφορά).
    const r2Before = await readKeys(page)
    await page.evaluate(() => {
      const P = Storage.prototype
      const { removeItem, setItem } = P
      let removes = 0
      let blockRestore = false
      P.removeItem = function (k) {
        if (this === localStorage && String(k).startsWith('psd115-w') && ++removes === 2) {
          blockRestore = true
          throw new DOMException('fail', 'UnknownError')
        }
        return removeItem.call(this, k)
      }
      P.setItem = function (k, v) {
        if (this === localStorage && blockRestore && String(k).startsWith('psd115-w')) throw new DOMException('full', 'QuotaExceededError')
        return setItem.call(this, k, v)
      }
    })
    r = await resetVia()
    check(/δεν ολοκληρώθηκε με ασφάλεια/.test(r.text) && /Επαναφόρτωσε τη σελίδα για να επιχειρηθεί ανάκτηση/.test(r.text), `R2: λάθος μήνυμα («${r.text}»)`)
    check(!/δεν άλλαξε|διατηρήθηκε/.test(r.text), `R2: το μήνυμα ισχυρίζεται ότι η πρόοδος δεν άλλαξε («${r.text}»)`)
    check((await readKeys(page))['progress-txn-v1'] !== undefined, 'R2: δεν έμεινε σημάδι για την ανάκτηση')
    await page.reload() // νέα σελίδα: χωρίς τα patches του Storage
    await settle(page)
    const r2After = await readKeys(page)
    const progressOnly = (keys) => Object.fromEntries(Object.entries(keys).filter(([k]) => !k.startsWith('psd115-backup-')))
    check(sameKeys(progressOnly(r2After), progressOnly(r2Before)), 'R2: η ανάκτηση δεν επανέφερε τις αρχικές τιμές')
    check(!('progress-txn-v1' in r2After), 'R2: το σημάδι έμεινε μετά την ανάκτηση')
    await context.close()
    console.log(`${failures.length > before ? '✗' : '✓'} Degraded: μήνυμα · 0 εγγραφές και μετά από ενέργειες · reset χωρίς επαληθευμένο backup → ακύρωση · reset με backup (raw byte-identical) → resync · άγνωστο κλειδί ανέγγιχτο · εκκρεμές σημάδι → 0 εγγραφές + μήνυμα, reload → ανάκτηση · reset: εκκρεμές σημάδι → «Εκκρεμεί ανάκτηση», 0 λήψεις · rollback-incomplete → σωστό μήνυμα, reload → ανάκτηση · αποτυχία εγγραφής → ειδοποίηση (όχι degraded), καμία ψευδής αποθήκευση, κλείσιμο, μένει μετά από άσχετη εγγραφή, ανάκαμψη με επανάληψη · δύο tabs: ενημέρωση χωρίς reload, καμία χαμένη αλλαγή`)
  }

  // ------------------------------------------------------------ G2 (smoke build)
  {
    const before = failures.length
    const { server, base } = await serve('dist-progress')
    servers.push(server)
    const { context, page } = await newContext(browser, PROD)
    const probe = () =>
      page.evaluate(() => {
        const p = window.__progressProbe
        return { installed: p.installed, created: p.created(), reads: p.reads.splice(0), currentId: p.idOf(p.snapshot()), snapshot: JSON.parse(JSON.stringify(p.snapshot())) }
      })
    /** Μετά από κάθε βήμα: κάθε consumer βλέπει ΤΟ ΙΔΙΟ snapshot (το τρέχον), νέο σε σχέση με το προηγούμενο, μνήμη ≡ storage. */
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
      const keys = Object.fromEntries(Object.entries(await readKeys(page)).filter(([k]) => k.startsWith('psd115-') && !k.startsWith('psd115-backup-')))
      const fromStorage = legacyToSnapshot(keys, { content, mode: 'runtime' })
      check(fromStorage.ok && JSON.stringify(fromStorage.snapshot) === JSON.stringify(p.snapshot.courses.psd115), `G2 ${step}: μνήμη ≠ storage`)
      return p
    }

    await page.goto(`${base}/psd115/topics/pavlov`)
    await settle(page)
    await verify('boot', { changed: false, consumers: ['study-session', 'checklist'] })
    await page.locator('main input[type=checkbox]').first().click()
    await verify('checklist', { consumers: ['study-session', 'checklist'] })
    const nextCard = page.getByRole('button', { name: /^(Επόμενη κάρτα|Από την αρχή)$/ }).first()
    await nextCard.click()
    await verify('κάρτα')

    await page.goto(`${base}/study/quiz?scope=unit:psd115/k2`)
    await settle(page)
    lastId = null
    await verify('quiz boot', { changed: false })
    await page.getByRole('button', { name: 'Έναρξη κουίζ' }).click()
    for (const correct of [true, false]) {
      const text = ((await page.locator('main h2').first().textContent()) ?? '').trim()
      const labels = (await page.locator('main ul li button').allTextContents()).map((t) => t.trim())
      const q = quizQuestions.find((x) => x.question.trim() === text && [...x.options].sort().join('|') === [...labels].sort().join('|'))
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
    await page.getByRole('button', { name: 'Επαναφορά προόδου μελέτης' }).click()
    await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Ναι, διαγραφή' }).click()])
    await page.waitForTimeout(500)
    const afterReset = await verify('reset')
    const s = afterReset.snapshot.courses.psd115
    check(s.quizAnswered === 0 && !s.flashcardSeenIds.length && !Object.keys(s.checklists).length && !s.wrongBook.length, 'G2 reset: η μνήμη δεν μηδενίστηκε')
    const keys = await readKeys(page)
    check(!Object.keys(keys).some((k) => /checklist/.test(k)), `G2 reset: ξαναγράφτηκε checklist (${Object.keys(keys).filter((k) => /checklist/.test(k))})`)
    check(!keys['psd115-w1-study'], 'G2 reset: ξαναγράφτηκε το psd115-w1-study')
    check(/Κάρτες 0\/94/.test(await page.locator('#root').innerText()), 'G2 reset: το UI δεν δείχνει 0 μετά το reset')
    check(!Object.keys(keys).some((k) => k.startsWith('study-progress-') || k === 'progress-txn-v1'), 'G2: γράφτηκε study-progress-* / progress-txn-v1')
    await context.close()
    console.log(`${failures.length > before ? '✗' : '✓'} G2 ένα snapshot: 1 service · ίδιο snapshot σε όλους τους consumers · νέο μετά από κάθε ενέργεια · μνήμη ≡ storage · reset → resync`)
  }

  // ------------------------------------------------------------ differential (προαιρετικό)
  if (args.differential) {
    const before = failures.length
    const runs = {}
    for (const [label, dir] of [['παλιό', args.differential], ['νέο', 'dist']]) {
      const { server, base } = await serve(dir)
      servers.push(server)
      runs[label] = await scenario(browser, base)
    }
    const steps = runs['νέο'].map((r) => r.step)
    for (let i = 0; i < steps.length; i++) {
      const a = runs['παλιό'][i]
      const b = runs['νέο'][i]
      check(a?.step === b.step, `differential: διαφορετικά βήματα (${a?.step} / ${b.step})`)
      check(a?.question === b.question, `differential ${b.step}: διαφορετική ερώτηση (${a?.question} / ${b.question}) — το σενάριο δεν είναι συγκρίσιμο`)
      check(JSON.stringify(a?.semantic) === JSON.stringify(b.semantic), `differential ${b.step}: διαφορά\n    παλιό ${JSON.stringify(a?.semantic)}\n    νέο   ${JSON.stringify(b.semantic)}`)
    }
    console.log(`${failures.length > before ? '✗' : '✓'} Differential (${args.differential} ↔ dist): ${steps.join(' → ')} · ίδια σημασιολογικά legacy αποτελέσματα`)
    for (const r of runs['νέο']) console.log(`    ${r.step}: ${JSON.stringify(r.summary)}`)
  }
} finally {
  await browser.close()
  stop()
}

/** Σημασιολογική μορφή: runtime snapshot· uid → θέση· checklists all-false ≡ απόν· ρυθμίσεις/άγνωστα raw. */
function semantic(keys) {
  const progress = Object.fromEntries(Object.entries(keys).filter(([k]) => k.startsWith('psd115-') && !k.startsWith('psd115-backup-')))
  const r = legacyToSnapshot(progress, { content, mode: 'runtime' })
  if (!r.ok) return { degraded: r.issues }
  const s = r.snapshot
  return {
    quiz: [s.quizAnswered, s.quizCorrect, s.byGroup],
    seen: s.flashcardSeenIds,
    wrong: s.wrongBook.map(({ uid, ...w }) => w),
    checklists: Object.fromEntries(Object.entries(s.checklists).filter(([, c]) => c.items.some(Boolean))),
    other: Object.fromEntries(Object.entries(keys).filter(([k]) => !k.startsWith('psd115-') || k === 'psd115-w1-theme' || k === 'psd115-disclaimer-v1').filter(([k]) => !k.startsWith('psd115-backup-'))),
  }
}

async function scenario(browser, base) {
  const out = []
  const { context, page } = await newContext(browser, PROD, { seed: 20261007 })
  const record = async (step, question = null) => {
    await page.waitForTimeout(300)
    const keys = await readKeys(page)
    const sem = semantic(keys)
    out.push({ step, question, semantic: sem, summary: sem.quiz ? { quiz: sem.quiz.slice(0, 2), seen: sem.seen.length, wrong: sem.wrong.length, checklists: Object.keys(sem.checklists) } : sem })
  }
  await page.goto(`${base}/psd115/topics/pavlov`)
  await settle(page)
  await record('open')
  await page.locator('main input[type=checkbox]').first().click()
  await record('checklist')
  await page.getByRole('button', { name: /^(Επόμενη κάρτα|Από την αρχή)$/ }).first().click()
  await record('κάρτα')
  await page.goto(`${base}/study/quiz?scope=unit:psd115/k2`)
  await settle(page)
  await page.getByRole('button', { name: 'Έναρξη κουίζ' }).click()
  for (const correct of [true, false]) {
    const text = ((await page.locator('main h2').first().textContent()) ?? '').trim()
    const labels = (await page.locator('main ul li button').allTextContents()).map((t) => t.trim())
    const q = quizQuestions.find((x) => x.question.trim() === text && [...x.options].sort().join('|') === [...labels].sort().join('|'))
    const right = q.options[q.correctIndex]
    await page.locator('main ul li button').nth(correct ? labels.indexOf(right) : labels.findIndex((l) => l !== right)).click()
    await record(correct ? 'σωστή' : 'λάθος', q.id)
    await page.getByRole('button', { name: /^(Συνέχεια|Τέλος κουίζ)$/ }).click()
  }
  await page.goto(`${base}/study/review?scope=unit:psd115/k2`)
  await settle(page)
  await page.locator('main ul li button').first().click()
  await page.getByRole('button', { name: 'Αφαίρεση από τη λίστα' }).click()
  await record('αφαίρεση λάθους')
  await page.getByRole('button', { name: 'Επαναφορά προόδου μελέτης' }).click()
  await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Ναι, διαγραφή' }).click()])
  await record('reset')
  await context.close()
  return out
}

if (failures.length) {
  console.error(`\n✗ Progress smoke: ${failures.length} αποτυχία(ες)`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log('✓ Progress smoke πέρασε')
