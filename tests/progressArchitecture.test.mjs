/**
 * Φάση 6b — αρχιτεκτονικά όρια της ενεργής υποδομής προόδου (μεταφέρθηκαν από τα progressSnapshot / progressService,
 * που έλεγχαν και τον legacy κώδικα):
 *  - ο engine (courseProgress & co) δεν ξέρει μάθημα, storage, React ή URLs· μόνο pure modules
 *  - το contract του content adapter
 *  - το UI δεν αγγίζει storage· μόνο AppShell / ProgressBackupPanel χρησιμοποιούν την υποδομή backup / import / reset
 *  - ο service δημιουργείται και εγκαθίσταται ΜΟΝΟ στο main.jsx, μία φορά
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkContentAdapter, unknownCourseAdapter } from '../src/core/progress/contentAdapter.js'
import { checklistsStateKey, resetStateKey, wrongBookStateKey } from '../src/core/progress/namespaces.js'
import { studyContentAdapters } from '../src/core/progress/adapters/studyContent.js'
import { fakeStorage, service } from './helpers/progressFixtures.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
const rel = (f) => path.relative(root, f)

describe('ο engine δεν ξέρει μάθημα, storage, React ή URLs', () => {
  const ENGINE = ['courseProgress.js', 'contentAdapter.js', 'namespaces.js', 'snapshotShape.js', 'resetBoundary.js', 'events.js', 'items.js'].map((f) => path.join(root, 'src/core/progress', f))

  test('κανένα PSD115 / εβδομάδα / route / browser API στα αρχεία του engine', () => {
    for (const f of ENGINE) {
      const code = fs.readFileSync(f, 'utf8')
      assert.doesNotMatch(code, /psd1\d\d|week|\/week\/|WEEK\d|legacySlug/i, rel(f))
      assert.doesNotMatch(code, /\b(localStorage|sessionStorage|window|document|globalThis|navigator)\s*(\.[A-Za-z_$]|\[)/, rel(f))
      assert.doesNotMatch(code, /from '(react|react-dom|react-router-dom)'/, rel(f))
    }
  })

  test('μεταβατικά imports: μόνο pure modules — κανένα περιεχόμενο, storage ή utils', () => {
    const visited = new Set()
    const visit = (file) => {
      if (visited.has(file)) return
      visited.add(file)
      for (const [, spec] of fs.readFileSync(file, 'utf8').matchAll(/from '([^']+)'/g)) {
        assert.ok(spec.startsWith('.'), `${rel(file)}: εξωτερικό import ${spec}`)
        visit(path.resolve(path.dirname(file), spec))
      }
    }
    for (const f of ENGINE) visit(f)
    assert.deepEqual([...visited].map(rel).sort(), [
      'src/core/academic/ids.js',
      'src/core/progress/contentAdapter.js',
      'src/core/progress/courseProgress.js',
      'src/core/progress/events.js',
      'src/core/progress/items.js',
      'src/core/progress/namespaces.js',
      'src/core/progress/resetBoundary.js',
      'src/core/progress/snapshotShape.js',
    ])
  })

  test('namespaces: λογικά κλειδιά μέσα στο state, ανά μάθημα', () => {
    assert.equal(wrongBookStateKey('psd125'), 'progress:wrongbook:psd125')
    assert.equal(checklistsStateKey('psd115'), 'progress:checklists:psd115')
    assert.equal(resetStateKey('psd200'), 'progress:reset:psd200')
    for (const f of [wrongBookStateKey, checklistsStateKey, resetStateKey]) assert.throws(() => f('PSD115'))
  })

  test("το παλιό string 'progress-reset:' δεν υπάρχει πουθενά στο src/", () => {
    for (const f of walk(path.join(root, 'src'))) assert.ok(!fs.readFileSync(f, 'utf8').includes('progress-reset:'), rel(f))
  })
})

describe('contract του content adapter', () => {
  test('οι adapters του STUDY_CONTENT και ο unknown adapter τηρούν το contract', () => {
    for (const [courseId, a] of Object.entries(studyContentAdapters())) assert.deepEqual(checkContentAdapter(a, courseId), [], courseId)
    assert.deepEqual(checkContentAdapter(unknownCourseAdapter('psd125'), 'psd125'), [])
    assert.deepEqual(checkContentAdapter(unknownCourseAdapter('psd125')), [], 'χωρίς αναμενόμενο courseId')
  })
  test('παραβιάσεις → σφάλματα', () => {
    const a = studyContentAdapters().psd115
    assert.match(checkContentAdapter(a, 'psd125').join(), /όχι για «psd125»/)
    assert.deepEqual(checkContentAdapter(null), ['content adapter: αναμενόταν αντικείμενο'])
    assert.match(checkContentAdapter({ ...a, courseId: 'PSD 115' }).join(), /άκυρο courseId/)
    const { isCard: _isCard, ...missing } = a
    assert.match(checkContentAdapter(missing, 'psd115').join(), /λείπει το isCard\(\)/)
  })
  test('Φάση 6b: κανένα legacy πεδίο στο contract — οι adapters δεν έχουν `legacy`, ο έλεγχος δεν το εξετάζει', () => {
    for (const a of Object.values(studyContentAdapters())) assert.equal('legacy' in a, false)
    assert.equal('legacy' in unknownCourseAdapter('psd125'), false)
    assert.deepEqual(checkContentAdapter({ ...studyContentAdapters().psd115, legacy: {} }, 'psd115'), [])
    assert.doesNotMatch(fs.readFileSync(path.join(root, 'src/core/progress/contentAdapter.js'), 'utf8'), /legacy|LegacyCodec|decode\(|encode\(/i)
  })
  test('unknownCourseAdapter: δεν επινοεί τίποτα· άκυρο courseId → σφάλμα', () => {
    const u = unknownCourseAdapter('psd210')
    assert.ok(Object.isFrozen(u))
    for (const f of ['hasGroup', 'isQuestion', 'isCard', 'hasTopic']) assert.equal(u[f]('x'), false, f)
    assert.equal(u.groupOf('x'), null)
    assert.throws(() => unknownCourseAdapter('PSD210'), /Άκυρο courseId/)
  })
})

describe('Φάση 6b · καμία αναφορά σε αφαιρεμένα modules ή στο legacy API', () => {
  test('ούτε σε σχόλια: ονόματα των αφαιρεμένων modules και του LegacyCodec', () => {
    const RE = /legacyProgressStore|legacyProgressBackend|progressMigration|progressShadow|legacyBaseline|\breconcile\b|progressValidate|\bprogressBackup\b|utils\/progressTransaction|\b(boundary|keys|snapshot)\.js\b|adapters\/psd115|LegacyCodec/
    for (const f of walk(path.join(root, 'src')).filter((x) => /\.(m?js|jsx)$/.test(x))) {
      const hit = fs.readFileSync(f, 'utf8').match(RE)
      assert.equal(hit, null, `${rel(f)}: ${hit?.[0]}`)
    }
  })
  test('καμία κλήση των αφαιρεμένων μεθόδων του store (.readEvents( / .importAllSync( ) στο src/ και scripts/', () => {
    for (const f of ['src', 'scripts'].flatMap((d) => walk(path.join(root, d))).filter((x) => /\.(m?js|jsx)$/.test(x))) {
      assert.doesNotMatch(fs.readFileSync(f, 'utf8'), /\.(readEvents|importAllSync)\(/, rel(f))
    }
  })
})

describe('UI και εγκατάσταση του service', () => {
  const uiFiles = ['src/components', 'src/pages', 'src/layouts', 'src/hooks'].flatMap((d) => walk(path.join(root, d)))

  test('components/pages/layouts/hooks: κανένα progressStore, localStorage/sessionStorage/indexedDB', () => {
    for (const f of uiFiles) {
      const code = fs.readFileSync(f, 'utf8')
      assert.doesNotMatch(code, /core\/progress\/(progressStore|transaction)\.js'/, rel(f))
      assert.doesNotMatch(code, /\b(localStorage|sessionStorage|indexedDB)\b/, rel(f))
    }
  })

  test('υποδομή backup / import / reset μόνο από AppShell / ProgressBackupPanel', () => {
    const ALLOWED = new Map([
      ['src/layouts/AppShell.jsx', ['progressFailureMessage', 'studyProgressBackup']],
      ['src/components/ProgressBackupPanel.jsx', ['progressFailureMessage', 'studyProgressBackup']],
    ])
    for (const f of uiFiles) {
      const used = [...fs.readFileSync(f, 'utf8').matchAll(/utils\/(\w*[Pp]rogress\w*)\.js'/g)].map((m) => m[1]).sort()
      assert.deepEqual(used, ALLOWED.get(rel(f)) ?? [], rel(f))
    }
  })

  test('createStoreProgressService / installProgressService: μόνο στο main.jsx', () => {
    for (const f of walk(path.join(root, 'src'))) {
      const r = rel(f)
      const code = fs.readFileSync(f, 'utf8')
      if (r !== 'src/main.jsx' && r !== 'src/core/progress/storeProgressService.js') assert.doesNotMatch(code, /createStoreProgressService\(/, r)
      if (r !== 'src/main.jsx' && r !== 'src/hooks/useProgress.js') assert.doesNotMatch(code, /installProgressService\(/, r)
    }
  })

  test('install: πριν → σφάλμα· δεύτερη εγκατάσταση → σφάλμα· getProgressService επιστρέφει τον ίδιο', async () => {
    const m = await import('../src/hooks/useProgress.js')
    assert.throws(() => m.getProgressService(), /δεν έχει εγκατασταθεί/)
    const svc = service(fakeStorage())
    m.installProgressService(svc)
    assert.throws(() => m.installProgressService(svc), /ήδη/)
    assert.equal(m.getProgressService(), svc)
  })
})
