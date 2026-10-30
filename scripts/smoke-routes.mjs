/**
 * Smoke test της εφαρμογής στο production build.
 *  1. Διαδρομές (Phase 1C-B):
 *     α. legacy πίνακας: κάθε παλιό /week/... URL καταλήγει στο σωστό canonical URL (αναλλοίωτο A)·
 *     β. κάθε canonical course/unit/topic/doc/term/study/progress URL ανοίγει απευθείας (αναλλοίωτο B)·
 *     γ. αρνητικά: άγνωστες διαδρομές δείχνουν Not Found χωρίς σιωπηλή ανακατεύθυνση.
 *     Σε όλες: χωρίς JS σφάλματα, μη κενό περιεχόμενο, τίτλος θέματος όπου υπάρχει.
 *     δ. πλοήγηση (1C-C): κανένα εσωτερικό link προς /week/· τα θέματα κάθε unit δείχνουν σε
 *        /psd115/topics/<topicId> με τη σειρά του topics.js· το header ανήκει στο ενεργό μάθημα.
 *  2. Ελέγχει τον κύκλο προστασίας προόδου: εξαγωγή → αλλοίωση → απόρριψη άκυρου αρχείου →
 *     εισαγωγή με προεπισκόπηση και backup → reset του μαθήματος με backup (Φάση 6a: νέα μορφή study-progress).
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

// --- Λίστα διαδρομών από το ίδιο το περιεχόμενο και τον ρητό πίνακα θεμάτων ---
const w1 = await imp('content/courses/psd115/units/k1/index.js')
const w2 = await imp('content/courses/psd115/units/k2/index.js')
const w3 = await imp('content/courses/psd115/units/k3/index.js')
const w4 = await imp('content/courses/psd115/units/k4/index.js')
const { course } = await imp('content/courses/psd115/course.js')
const { topics } = await imp('content/courses/psd115/topics.js')
const { sources } = await imp('content/courses/psd115/sources.js')
const { toCanonical, LEGACY_TOOLS } = await imp('src/core/routing/legacy.js')
const P = await imp('src/core/routing/paths.js')
const NAV = await imp('src/core/routing/navigation.js')
const STUDY = await imp('src/core/study/scope.js')
// Αναμενόμενο κείμενο εργαλείου = μέγεθος υλικού της unit (1D: ίδιο dataset legacy και canonical).
const toolText = (unitId, tool) => {
  const m = STUDY.selectStudyMaterial({ kind: 'unit', courseId: 'psd115', unitId })
  if (tool === 'quiz') return `Διαθέσιμες με φίλτρο: ${m.quizQuestions.length}`
  if (tool === 'exam') return `Θέμα 1 / ${m.examQuestions.length}`
  if (tool === 'flashcards') return `Κάρτα 1/${m.flashcards.length}`
  return undefined
}

const titleBySlug = {
  k1: Object.fromEntries(w1.WEEK1_LESSON_NAV.map((n) => [n.to.replace(/^\/week\/1\//, ''), n.title])),
  k2: Object.fromEntries(w2.WEEK2_TOPICS.map((t) => [t.slug, t.title])),
  k3: Object.fromEntries(w3.WEEK3_TOPICS.map((t) => [t.slug, t.title])),
  k4: Object.fromEntries(w4.WEEK4_TOPICS.map((t) => [t.slug, t.title])),
}
const topicTitle = (t) => titleBySlug[t.unit][t.legacySlug]

/**
 * @type {{ path: string, expect?: string, title?: string, text?: string, note?: string, notFound?: boolean, link?: string, testid?: string, group: string }[]}
 *  expect = τελικό pathname+search (προεπιλογή: το ίδιο το path)
 */
const routes = []
// α. Legacy → canonical
for (const u of course.units) {
  routes.push({ group: 'legacy', path: u.route, expect: toCanonical(u.route) })
  for (const tool of LEGACY_TOOLS) {
    routes.push({ group: 'legacy', path: `${u.route}/${tool}`, expect: toCanonical(`${u.route}/${tool}`), text: toolText(u.id, tool) })
  }
}
for (const t of topics) {
  const key = `/week/${t.unit.slice(1)}/${t.legacySlug}`
  routes.push({ group: 'legacy', path: key, expect: P.topicPath('psd115', t.id), title: topicTitle(t) })
}
routes.push({ group: 'legacy', path: '/week/1/?x=1', expect: '/psd115/units/k1?x=1', note: 'query string / trailing slash' })
routes.push({ group: 'legacy', path: '/week/1/pavlov/', expect: '/psd115/topics/pavlov', note: 'trailing slash' })
routes.push({ group: 'legacy', path: '/week/2/quiz?x=1', expect: '/study/quiz?scope=unit:psd115/k2&x=1', note: 'query σε εργαλείο' })
for (const w of [2, 3, 4]) {
  routes.push({ group: 'legacy', path: `/week/${w}/does-not-exist`, notFound: true, link: P.unitPath('psd115', `k${w}`), note: 'άγνωστο θέμα' })
}
routes.push({ group: 'legacy', path: '/week/9', notFound: true })

// β. Canonical απευθείας
routes.push({ group: 'canonical', path: '/' })
routes.push({ group: 'canonical', path: P.coursePath('psd115'), header: 'psd115' })
for (const u of course.units) {
  routes.push({
    group: 'canonical',
    path: P.unitPath('psd115', u.id),
    topicLinks: NAV.unitTopics('psd115', u.id).map((t) => t.path),
    header: 'psd115',
  })
  for (const tool of LEGACY_TOOLS) routes.push({ group: 'canonical', path: P.studyPath(tool, `unit:psd115/${u.id}`), text: toolText(u.id, tool) })
}
for (const t of topics) {
  routes.push({ group: 'canonical', path: P.topicPath('psd115', t.id), title: topicTitle(t), selectedTopic: t.id, header: 'psd115' })
}
for (const d of sources) routes.push({ group: 'canonical', path: P.documentPath('psd115', d.id), link: `/${d.path}` })
routes.push({ group: 'canonical', path: P.termPath('2026F'), testid: 'term-page', link: '/psd200' })
routes.push({ group: 'canonical', path: P.termPath('2026S'), testid: 'term-page' })
routes.push({ group: 'canonical', path: '/psd200', text: 'Το περιεχόμενο μελέτης δεν έχει προστεθεί ακόμα', link: '/terms/2026F', header: 'psd200' })
routes.push({ group: 'negative', path: '/psd200/units/k1', notFound: true, header: 'psd200' })
routes.push({ group: 'negative', path: '/psd200/topics/pavlov', notFound: true, header: 'psd200' })
routes.push({ group: 'canonical', path: P.studyPath('today', 'term:2026F'), testid: 'study-today' })
routes.push({
  group: 'canonical',
  path: P.studyPath('quiz', 'psd115'),
  link: P.studyPath('quiz', 'unit:psd115/k1'),
  text: 'Διάλεξε εβδομάδα',
  absentText: 'Διαθέσιμες με φίλτρο',
  note: 'course scope: επιλογή unit, χωρίς υλικό',
})
routes.push({
  group: 'negative',
  path: P.studyPath('quiz', 'topic:psd115/pavlov'),
  notFound: true,
  text: 'δεν υποστηρίζει ακόμα αυτό το scope',
  note: 'topic scope σε εργαλείο: ρητά unsupported',
})
routes.push({ group: 'canonical', path: P.progressPath('psd115') })
routes.push({ group: 'canonical', path: P.progressPath('unit:psd115/k2') })

// γ. Αρνητικά
for (const p of [
  '/nope',
  '/psd115/topics/overview',
  '/psd115/units/k9',
  '/psd115/docs/nope',
  '/psd115/units/k1/extra',
  '/study/quiz',
  '/study/quiz?scope=unit:psd115/k9',
  '/study/quiz?scope=bad',
  '/study/nope?scope=psd115',
  '/progress',
  '/terms/2030F',
  '/psd115/week/1',
]) {
  routes.push({ group: 'negative', path: p, notFound: true })
}

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

  const counts = {}
  for (const r of routes) {
    pageErrors = []
    const res = await page.goto(BASE + r.path, { waitUntil: 'networkidle' })
    const status = res?.status() ?? 0
    const url = new URL(page.url())
    const finalPath = decodeURIComponent(url.pathname + url.search)
    const main = page.locator('#main-content')
    const mainText = ((await main.textContent().catch(() => '')) ?? '').trim()
    const expected = r.expect ?? r.path
    const label = `[${r.group}] ${r.path}${r.note ? ` (${r.note})` : ''}`
    const isNotFound = (await page.getByTestId('not-found').count()) > 0
    if (status !== 200) fail(`${label}: HTTP ${status}`)
    if (finalPath !== expected) fail(`${label}: κατέληξε στο ${finalPath}, αναμενόταν ${expected}`)
    if (mainText.length < 20) fail(`${label}: κενό περιεχόμενο`)
    if (r.notFound && !isNotFound) fail(`${label}: αναμενόταν Not Found`)
    if (!r.notFound && isNotFound) fail(`${label}: εμφανίστηκε Not Found`)
    if (r.title) {
      const headings = (await main.locator('h1, h2').allTextContents()).map((t) => t.trim())
      if (!headings.some((h) => h.includes(r.title))) fail(`${label}: δεν βρέθηκε επικεφαλίδα «${r.title}»`)
    }
    if (r.text && !mainText.includes(r.text)) fail(`${label}: δεν βρέθηκε το κείμενο «${r.text}»`)
    if (r.absentText && mainText.includes(r.absentText)) fail(`${label}: δεν έπρεπε να υπάρχει «${r.absentText}»`)
    if (r.testid && (await page.getByTestId(r.testid).count()) === 0) fail(`${label}: λείπει το ${r.testid}`)
    if (r.link && (await main.locator(`a[href="${r.link}"]`).count()) === 0) fail(`${label}: λείπει link προς ${r.link}`)
    // δ. Πλοήγηση
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')))
    for (const h of hrefs) if (/^\/week(\/|$)/.test(h)) fail(`${label}: εσωτερικό link προς legacy διαδρομή ${h}`)
    if (r.topicLinks) {
      const got = await main.locator('a[href^="/psd115/topics/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')))
      if (got.join('|') !== r.topicLinks.join('|')) fail(`${label}: τα links θεμάτων διαφέρουν από τα canonical topics (${got.length}/${r.topicLinks.length})`)
    }
    if (r.selectedTopic) {
      const value = await main.locator('select').first().inputValue().catch(() => null)
      if (value !== r.selectedTopic) fail(`${label}: η επιλογή θέματος δείχνει «${value}»`)
    }
    if (r.header) {
      const course = NAV.courseIdentity(r.header)
      const header = page.locator('header')
      const headerText = (await header.textContent()) ?? ''
      const unitLinks = await header.locator('a[href*="/units/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')))
      const expectedUnits = NAV.courseUnits(r.header).map((u) => u.path)
      if (!headerText.includes(`${course.code} Exam Prep`)) fail(`${label}: το header δεν δείχνει ${course.code}`)
      if (unitLinks.join('|') !== expectedUnits.join('|')) fail(`${label}: units στο header: ${unitLinks.join(', ') || '—'}`)
      if (r.header !== 'psd115' && /PSD115|Ψυχολογία 2/.test(headerText)) fail(`${label}: το header δείχνει στοιχεία του PSD115`)
      if (r.header !== 'psd115' && !headerText.includes(course.title)) fail(`${label}: το header δεν δείχνει τον τίτλο «${course.title}»`)
    }
    for (const e of pageErrors) fail(`${label}: ${e}`)
    counts[r.group] = (counts[r.group] ?? 0) + 1
  }
  // Η πλοήγηση μόνο (χωρίς ενέργειες μελέτης) δεν γράφει τίποτα στο progress store.
  const newStoreKeys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('study-progress-')))
  if (newStoreKeys.length) fail(`routes: γράφτηκαν κλειδιά του νέου store: ${newStoreKeys.join(', ')}`)
  await context.close()
  console.log(
    `${failures.length ? '✗' : '✓'} Διαδρομές: ${routes.length} ελέγχθηκαν ` +
      `(legacy ${counts.legacy} · canonical ${counts.canonical} · αρνητικά ${counts.negative})`,
  )
}

// ---------- 2. Προστασία προόδου (Φάση 6a: νέα μορφή study-progress) ----------
const before = failures.length
{
  const sample = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/study-progress.sample.json'), 'utf8'))
  const legacyFile = fs.readFileSync(path.join(root, 'tests/fixtures/progress-export.sample.json'))
  const EV = 'study-progress-events-v1'
  const ST = 'study-progress-state-v1'
  // Πρόοδος της νέας μορφής + ένα παλιό legacy κλειδί και ρυθμίσεις, που ΔΕΝ πρέπει να αγγιχτούν ποτέ.
  const seed = { [EV]: JSON.stringify(sample.events), [ST]: JSON.stringify(sample.state), 'psd115-w1-study': '{"legacy":true}', 'psd115-disclaimer-v1': '1' }
  const context = await browser.newContext({ acceptDownloads: true })
  await context.addInitScript((keys) => {
    if (sessionStorage.getItem('smoke-seeded')) return
    for (const [k, v] of Object.entries(keys)) localStorage.setItem(k, v)
    sessionStorage.setItem('smoke-seeded', '1')
  }, seed)
  const page = await context.newPage()
  page.on('pageerror', (e) => fail(`backup: σφάλμα JS: ${e.message}`))
  const readAll = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])))
  const readDownload = async (download) => JSON.parse(fs.readFileSync(await download.path(), 'utf8'))
  const message = () => page.getByTestId('progress-backup-message').textContent()

  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  const original = await readAll()
  for (const [k, v] of Object.entries(seed)) if (original[k] !== v) fail(`backup: η εφαρμογή άλλαξε το «${k}» κατά τη φόρτωση`)

  // Εξαγωγή: η νέα μορφή, ακριβώς τα δεδομένα του store.
  const [exportDl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Εξαγωγή προόδου (JSON)' }).click()])
  const exported = await readDownload(exportDl)
  if (exported.format !== 'study-progress' || exported.version !== 1) fail('backup: λάθος format/version στο export')
  if (JSON.stringify(exported.events) !== seed[EV] || JSON.stringify(exported.state) !== seed[ST]) fail('backup: το export δεν περιέχει ακριβώς την τρέχουσα πρόοδο')

  // Η τοπική πρόοδος «χάνεται» (άδειο log) — το αρχείο θα την επαναφέρει.
  await page.evaluate((k) => localStorage.setItem(k, '[]'), EV)
  await page.reload({ waitUntil: 'networkidle' })
  const tampered = await readAll()

  // Άκυρο αρχείο και αρχείο της παλιάς μορφής → απόρριψη, τίποτα δεν αλλάζει.
  const input = page.getByTestId('progress-import-input')
  await input.setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"format":"nope"}') })
  await page.getByText('Το αρχείο απορρίφθηκε').waitFor({ timeout: 5000 }).catch(() => fail('backup: δεν εμφανίστηκε μήνυμα απόρριψης'))
  await input.setInputFiles({ name: 'legacy.json', mimeType: 'application/json', buffer: legacyFile })
  await page.getByText('παλιά μορφή').waitFor({ timeout: 5000 }).catch(() => fail('backup: το παλιό αρχείο δεν απορρίφθηκε με σαφές μήνυμα'))
  if (JSON.stringify(await readAll()) !== JSON.stringify(tampered)) fail('backup: τα απορριφθέντα αρχεία άλλαξαν το localStorage')

  // Έγκυρο αρχείο → προεπισκόπηση → επιβεβαίωση → raw backup → εισαγωγή (χωρίς reload).
  await input.setInputFiles({ name: 'ok.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) })
  await page.getByTestId('import-preview').waitFor({ timeout: 5000 }).catch(() => fail('backup: δεν εμφανίστηκε προεπισκόπηση'))
  const previewText = (await page.getByTestId('import-preview').textContent().catch(() => '')) ?? ''
  if (!/PSD115/.test(previewText) || !/\+21 κάρτες/.test(previewText)) fail(`backup: η προεπισκόπηση δεν δείχνει τι προστίθεται («${previewText.slice(0, 120)}»)`)
  // review #18: οι λεπτομέρειες (σε ανάπτυξη) έχουν τα ίδια τα στοιχεία — κάρτες και καταγραφές με id.
  const detailsText = (await page.getByTestId('import-details-psd115').textContent().catch(() => '')) ?? ''
  const firstCard = sample.events.find((e) => e.kind === 'flip')
  if (!detailsText.includes(firstCard.item.split('/')[1]) || !detailsText.includes(firstCard.id)) fail('backup: οι λεπτομέρειες της προεπισκόπησης δεν δείχνουν τα ίδια τα στοιχεία')
  if (JSON.stringify(await readAll()) !== JSON.stringify(tampered)) fail('backup: άλλαξαν δεδομένα πριν από την επιβεβαίωση')
  const [backupDl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Ναι, εισαγωγή' }).click()])
  const backup = await readDownload(backupDl)
  if (backup.format !== 'study-progress-raw' || backup.reason !== 'import' || backup.keys[EV] !== '[]' || backup.keys[ST] !== tampered[ST]) {
    fail('backup: το αυτόματο αντίγραφο πριν από την εισαγωγή δεν είναι τα αυτούσια δεδομένα της στιγμής εκείνης')
  }
  await page.waitForTimeout(300)
  if (!/ολοκληρώθηκε/.test((await message().catch(() => '')) ?? '')) fail('backup: δεν εμφανίστηκε μήνυμα ολοκλήρωσης')
  const afterImport = await readAll()
  if (afterImport[EV] !== seed[EV]) fail('backup: μετά την εισαγωγή τα events δεν επανήλθαν')
  if (afterImport['psd115-w1-study'] !== seed['psd115-w1-study']) fail('backup: η εισαγωγή άγγιξε legacy κλειδί')
  if (!Object.keys(afterImport).some((k) => k.startsWith('study-progress-backup-'))) fail('backup: δεν κρατήθηκε αντίγραφο στο localStorage')

  // Reset ΜΟΝΟ του PSD115 → πρώτα raw backup· τα events μένουν, γράφεται όριο reset.
  await page.getByRole('button', { name: 'Επαναφορά προόδου του PSD115' }).click()
  const [resetDl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Ναι, μηδενισμός' }).click()])
  const resetBackup = await readDownload(resetDl)
  if (resetBackup.reason !== 'reset' || resetBackup.keys[EV] !== seed[EV]) fail('backup: το αντίγραφο πριν από το reset δεν περιέχει την πρόοδο')
  const afterReset = await readAll()
  if (afterReset[EV] !== seed[EV]) fail('backup: το reset έσβησε events (το log είναι append-only)')
  if (!JSON.parse(afterReset[ST] ?? '{}')['progress:reset:psd115']?.at) fail('backup: το reset δεν έγραψε όριο')
  if (afterReset['psd115-w1-study'] !== seed['psd115-w1-study'] || afterReset['psd115-disclaimer-v1'] !== '1') fail('backup: το reset άγγιξε legacy κλειδί / ρυθμίσεις')
  if ('progress-txn-v1' in afterReset) fail('backup: έμεινε σημάδι συναλλαγής')
  await context.close()
  console.log(`${failures.length > before ? '✗' : '✓'} Προστασία προόδου: export · απόρριψη άκυρου και παλιού αρχείου · import με προεπισκόπηση και backup · reset μαθήματος με backup`)
}

// ---------- 3. Ανακάτεμα επιλογών: η σωστή απάντηση μετράει σωστά ----------
const beforeShuffle = failures.length
{
  const { quizQuestions } = await imp('content/courses/psd115/questions.js')
  const byText = new Map(quizQuestions.map((q) => [q.question.trim(), q]))
  const context = await browser.newContext()
  await context.addInitScript(() => localStorage.setItem('psd115-disclaimer-v1', '1'))
  const page = await context.newPage()
  page.on('pageerror', (e) => fail(`shuffle: σφάλμα JS: ${e.message}`))

  // Κύριο κουίζ Εβδ. 2: απαντά σε ΟΛΕΣ τις ερωτήσεις με βάση το κείμενο της σωστής επιλογής.
  await page.goto(BASE + '/study/quiz?scope=unit:psd115/k2', { waitUntil: 'networkidle' })
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
  // Φάση 6a: η πρόοδος είναι events στο νέο store.
  const events = JSON.parse((await page.evaluate(() => localStorage.getItem('study-progress-events-v1'))) ?? '[]').filter((e) => e.kind === 'answer' && e.ctx === 'quiz')
  const correct = events.filter((e) => e.ok === 1).length
  if (events.length !== answered || correct !== answered) fail(`shuffle: απαντήθηκαν σωστά ${answered}, η πρόοδος γράφει ${correct}/${events.length}`)
  if (mcqCount >= 8 && mcqNotAtOriginalSlot === 0) fail('shuffle: καμία επιλογή δεν άλλαξε θέση — το ανακάτεμα δεν εφαρμόζεται')

  // Mini κουίζ μέσα σε μάθημα (Εβδ. 2) και σε custom μάθημα (Εβδ. 1).
  const w1pavlov = await imp('content/courses/psd115/units/k1/pavlov.js')
  const lessonCases = [
    ['/psd115/topics/research-methods-overview', w2.WEEK2_TOPICS.find((t) => t.slug === 'overview').lessonQuizIds],
    ['/psd115/topics/pavlov', w1pavlov.pavlovLessonQuizIds],
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
