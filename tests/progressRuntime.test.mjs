/**
 * Φάση 6a — η νέα υποδομή είναι η ΜΟΝΗ runtime πηγή προόδου. Guards στον κώδικα:
 *  - από το main.jsx (static + dynamic imports) δεν φτάνει κανένα legacy module (backend, shadow, migration, baseline,
 *    reconcile, legacy service / backup / validate, adapter του PSD115)
 *  - το hook και η συνεδρία δεν καλούν shadow recorder· οι ενέργειες πηγαίνουν στο forCourse
 *  - το UI κάνει reset ανά μάθημα και import με προεπισκόπηση (studyProgressBackup)
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = (f) => fs.readFileSync(path.join(root, f), 'utf8')

/** Όλα τα αρχεία του src/ (και content/) που φτάνει η εφαρμογή από το main.jsx. */
function runtimeGraph(entry = 'src/main.jsx') {
  const seen = new Set()
  const stack = [entry]
  while (stack.length) {
    const f = stack.pop()
    if (seen.has(f)) continue
    seen.add(f)
    const code = src(f)
    for (const m of code.matchAll(/(?:import|export)\s[^'"]*?from\s+['"](\.[^'"]+)['"]|import\(\s*['"](\.[^'"]+)['"]\s*\)/g)) {
      const spec = m[1] ?? m[2]
      const target = path.relative(root, path.resolve(path.dirname(path.join(root, f)), spec)).split(path.sep).join('/')
      if (fs.existsSync(path.join(root, target))) stack.push(target)
    }
  }
  return seen
}

const LEGACY = [
  'src/utils/legacyProgressBackend.js',
  'src/utils/progressShadow.js',
  'src/utils/progressMigration.js',
  'src/utils/progressBackup.js',
  'src/utils/progressValidate.js',
  'src/core/progress/legacyBaseline.js',
  'src/core/progress/reconcile.js',
  'src/core/progress/progressService.js',
  'src/core/progress/adapters/psd115.js',
  // review #18: ούτε ο μηχανισμός migration ούτε οι legacy μετατροπές του snapshot ούτε το legacy async store.
  'src/core/progress/boundary.js',
  'src/core/progress/keys.js',
  'src/core/progress/snapshot.js',
  'src/core/progress/legacyProgressStore.js',
]

/** Φάση 6b: τα legacy modules έχουν αφαιρεθεί από το repository (όχι μόνο από τον γράφο της εφαρμογής). */
const REMOVED = [
  'src/utils/legacyProgressBackend.js',
  'src/utils/progressShadow.js',
  'src/utils/progressMigration.js',
  'src/utils/progressBackup.js',
  'src/utils/progressValidate.js',
  'src/utils/progressTransaction.js',
  'src/core/progress/progressService.js',
  'src/core/progress/reconcile.js',
  'src/core/progress/legacyBaseline.js',
  'src/core/progress/legacyProgressStore.js',
  'src/core/progress/snapshot.js',
  'src/core/progress/adapters/psd115.js',
  'src/core/progress/boundary.js',
  'src/core/progress/keys.js',
]

describe('Φάση 6b · ο legacy κώδικας αφαιρέθηκε', () => {
  test('όλα τα legacy modules του 6a (+ το re-export utils/progressTransaction.js) — 14 αρχεία', () => {
    assert.deepEqual(REMOVED.filter((f) => !LEGACY.includes(f)), ['src/utils/progressTransaction.js'])
    assert.deepEqual(LEGACY.filter((f) => !REMOVED.includes(f)), [])
    assert.equal(REMOVED.length, 14)
  })
  test('τα αρχεία δεν υπάρχουν', () => {
    assert.deepEqual(REMOVED.filter((f) => fs.existsSync(path.join(root, f))), [])
  })
  test('κανένα legacy κλειδί προόδου στο src/ (ίδιο pattern με τον έλεγχο του production bundle)· οι ρυθμίσεις μένουν', async () => {
    const { LEGACY_KEY_RE, SETTINGS_KEY_RES } = await import('../scripts/legacy-keys.mjs')
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
    const files = walk(path.join(root, 'src')).filter((x) => /\.(m?js|jsx)$/.test(x))
    for (const f of files) {
      const hit = fs.readFileSync(f, 'utf8').match(LEGACY_KEY_RE)
      assert.equal(hit, null, `${path.relative(root, f)}: ${hit?.[0]}`)
    }
    // Θετικός έλεγχος στον ΚΩΔΙΚΑ (όχι σε σχόλια), όπως στο minified bundle.
    const code = files.map((f) => fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')).join('\n')
    for (const re of SETTINGS_KEY_RES) assert.match(code, re)
  })
  test('κανένα αρχείο του src/, scripts/ ή tests/ δεν τα εισάγει', () => {
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
    const names = REMOVED.map((f) => path.basename(f, '.js'))
    const re = new RegExp(`from\\s+['"][^'"]*/(${names.join('|')})\\.js['"]|import\\(\\s*['"][^'"]*/(${names.join('|')})\\.js['"]`)
    for (const f of ['src', 'scripts', 'tests'].flatMap((d) => walk(path.join(root, d))).filter((x) => /\.(m?js|jsx)$/.test(x))) {
      assert.doesNotMatch(fs.readFileSync(f, 'utf8'), re, path.relative(root, f))
    }
  })
})

describe('Φάση 6a · runtime', () => {
  const graph = runtimeGraph()
  test('ο γράφος της εφαρμογής βρίσκεται (sanity)', () => {
    for (const f of ['src/core/progress/storeProgressService.js', 'src/utils/studyProgressBackup.js', 'src/core/progress/courseProgress.js', 'src/core/progress/importMerge.js']) assert.ok(graph.has(f), f)
  })
  test('κανένα legacy module δεν φτάνει στην εφαρμογή (ούτε dynamic import, ούτε στο DEV block)', () => {
    assert.deepEqual(LEGACY.filter((f) => graph.has(f)), [])
  })
  test('main.jsx: ο service πολλών μαθημάτων με τους adapters του STUDY_CONTENT· κανένα legacy backend / recorder', () => {
    const main = src('src/main.jsx')
    assert.match(main, /createStoreProgressService\(\{\s*adapters: studyContentAdapters\(\),\s*storage,\s*recovery,/)
    assert.doesNotMatch(main, /createLegacyProgressBackend|createShadowRecorder|installShadowRecorder|psd115ProgressAdapter|courseId: 'psd115'/)
  })
  test('συνεδρία / hooks: καμία κλήση shadow recorder· ενέργειες μέσω forCourse', () => {
    for (const f of ['src/hooks/useStudySession.js', 'src/hooks/useProgress.js', 'src/core/study/session.js']) {
      assert.doesNotMatch(src(f), /record(QuizAnswer|FlashcardSeen|WrongBookClear|WrongBookRemove|Checklist)\b|progressShadow/, f)
    }
    assert.match(src('src/core/study/session.js'), /act\(service\.forCourse\(course\.courseId\)\)/)
    assert.match(src('src/hooks/useProgress.js'), /service\.forCourse\(courseId\)\.setChecklist\(/)
  })
  test('UI: reset ΜΟΝΟ του τρέχοντος μαθήματος· import με προεπισκόπηση και αποτύπωμα', () => {
    const shell = src('src/layouts/AppShell.jsx')
    assert.match(shell, /resetCourseSafely\(\{ courseId: study\.studyCourse\.courseId/)
    assert.match(shell, /describeCourseReset\(courseId/)
    const panel = src('src/components/ProgressBackupPanel.jsx')
    assert.match(panel, /planImport\(data/)
    assert.match(panel, /applyImport\(plan, data/)
    assert.match(panel, /getProgressService\(\)\.resync\(\)/)
  })
  test('μόνο το studyProgressBackup και ο service γράφουν στο store· κανένα UI component δεν αγγίζει storage', () => {
    for (const f of [...graph].filter((x) => /^src\/(components|pages|layouts|hooks)\//.test(x))) {
      assert.doesNotMatch(src(f), /\b(localStorage|sessionStorage|indexedDB)\b|createStoreCore|createProgressStore/, f)
    }
  })
  test('ο πυρήνας του store δεν ξέρει migration: μόνο το όριο reset, κανένα σημάδι / baseline migration', () => {
    const core = src('src/core/progress/progressStore.js')
    assert.doesNotMatch(core, /boundary\.js|keys\.js|migration:|MIGRATION_MARKER|migrationBoundary|importBoundary|boundaryViolations/)
    assert.match(core, /from '\.\/resetBoundary\.js'/)
    for (const f of [...graph].filter((x) => x.startsWith('src/'))) assert.doesNotMatch(src(f), /MIGRATION_MARKER_KEY|LEGACY_BASELINE_KEY|SHADOW_STATE_KEY/, f)
  })
  test('progressSync: μόνο τα δύο κλειδιά του store και το σημάδι', () => {
    const code = src('src/utils/progressSync.js')
    assert.match(code, /new Set\(\[EVENTS_KEY, STATE_KEY, TXN_KEY\]\)/)
    assert.doesNotMatch(code, /isProgressKey|psd115/)
  })
})
