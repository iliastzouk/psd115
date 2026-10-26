/**
 * Phase 1E-4c-1 — αποσύνδεση baseline / reconciliation / migration / recorder από το PSD115.
 *  - baseline byte-identical με την υλοποίηση του 1E-2 (golden SHA-256 από το main @ 61c7767, πριν το refactor)
 *  - μόνο ο content adapter ξέρει μάθημα, περιεχόμενο και παλιά κλειδιά
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildLegacyBaseline } from '../src/core/progress/legacyBaseline.js'
import { psd115ProgressAdapter as content } from '../src/core/progress/adapters/psd115.js'
import { migrateLegacyBaseline } from '../src/utils/progressMigration.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const T0 = Date.UTC(2026, 9, 6, 10, 0, 0)

/** SHA-256 του JSON.stringify({ baseline, marker }) με την ΠΑΛΙΑ υλοποίηση (1E-2), now = T0. */
const GOLDEN = {
  'progress-export.production-2026-10-05.json': '92c377a3489940323e155bca3b4abe8a7912c51b3ceaa3a73e48f901504b195b',
  'progress-export.production-2026-09-28.json': '3f9a44544a54729fe1777c15aa454d6d41b9d309b26034f0c1adf64f271df3be',
  'progress-export.sample.json': '6ac5a293e7c3016789e56c2fbd2f410e28c90bea5b566fc965fbf8950fe9a5a8',
}

describe('1E-4c-1 · baseline byte-identical με το 1E-2', () => {
  for (const [name, sha] of Object.entries(GOLDEN)) {
    test(name, () => {
      const keys = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures', name), 'utf8')).keys
      const r = buildLegacyBaseline(keys, { now: () => T0, content })
      assert.equal(r.ok, true, JSON.stringify(r.errors))
      assert.equal(crypto.createHash('sha256').update(JSON.stringify({ baseline: r.baseline, marker: r.marker })).digest('hex'), sha)
    })
  }

  test('χωρίς content adapter: το baseline/migration ΔΕΝ μαντεύει μάθημα (ρητή άρνηση)', async () => {
    const keys = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/progress-export.sample.json'), 'utf8')).keys
    assert.equal(buildLegacyBaseline(keys, { now: () => T0 }).ok, false)
    const r = await migrateLegacyBaseline({ storage: { getItem: () => null }, enabled: true, backup: () => {} })
    assert.equal(r.status, 'rejected')
  })
})

describe('1E-4c-1 · μόνο ο adapter ξέρει το μάθημα', () => {
  const GENERIC = [
    'src/core/progress/legacyBaseline.js',
    'src/core/progress/reconcile.js',
    'src/core/progress/snapshot.js',
    'src/core/progress/progressService.js',
    'src/utils/progressShadow.js',
    'src/utils/progressMigration.js',
  ]
  const code = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')

  test('κανένα import περιεχομένου μαθήματος', () => {
    for (const f of GENERIC) assert.doesNotMatch(code(f), /content\/courses\//, f)
  })
  test('κανένα παλιό κλειδί / κωδικός μαθήματος στον κώδικα (εκτός σχολίων)', () => {
    for (const f of GENERIC) assert.doesNotMatch(code(f), /psd115-w|'psd115'|"psd115"|\/week\//, f)
  })
  test('η σύνδεση με το PSD115 γίνεται μόνο στο main.jsx (adapter → service + recorder)', () => {
    const main = fs.readFileSync(path.join(root, 'src/main.jsx'), 'utf8')
    assert.match(main, /createShadowRecorder\(\{ courseId: 'psd115', content: psd115ProgressAdapter \}\)/)
    assert.match(main, /installShadowRecorder\(/)
  })
})

describe('1E-4c-2 · G10: legacy δεδομένα που το snapshot δεν αναπαριστά → ΟΧΙ in-sync', async () => {
  const { reconcileShadow } = await import('../src/core/progress/reconcile.js')
  const { legacyToSnapshot } = await import('../src/core/progress/snapshot.js')
  const PROD = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/progress-export.production-2026-10-05.json'), 'utf8')).keys
  const { baseline } = buildLegacyBaseline(PROD, { now: () => T0, content })
  const rec = (entries) => reconcileShadow({ content, baseline, legacyEntries: entries, events: [], state: {} })

  test('χωρίς τέτοια δεδομένα → in-sync, κενή λίστα', () => {
    const r = rec(PROD)
    assert.equal(r.ok, true)
    assert.deepEqual(r.unrepresented, [])
  })
  const CASES = {
    'άγνωστο κλειδί psd115-*': [{ 'psd115-extra-unknown': 'x' }, 'psd115-extra-unknown'],
    'orphan slug σε εβδομαδιαίο checklist': [{ 'psd115-w2-checklists': JSON.stringify({ ...JSON.parse(PROD['psd115-w2-checklists']), 'gone-topic': [true] }) }, 'psd115-w2-checklists#gone-topic'],
    'checklist κλειδί άγνωστου θέματος (Εβδ. 1)': [{ 'psd115-w1-gone-checklist': '[true]' }, 'psd115-w1-gone-checklist'],
  }
  for (const [label, [patch, key]] of Object.entries(CASES)) {
    test(`${label} → diverged (unrepresented), το diff κενό, το κλειδί ονομάζεται`, () => {
      const r = rec({ ...PROD, ...patch })
      assert.equal(r.ok, false)
      assert.deepEqual(r.diff, {})
      assert.deepEqual(r.unrepresented.map((u) => u.key), [key])
      // ο runtime reader της εφαρμογής εξακολουθεί να διαβάζει την πρόοδο (τα δεδομένα μένουν ανέγγιχτα)
      assert.equal(legacyToSnapshot({ ...PROD, ...patch }, { content, mode: 'runtime' }).ok, true)
    })
  }
  test('κάρτα που δεν υπάρχει πια στο περιεχόμενο: αναπαρίσταται (κρατιέται) → φαίνεται στο diff, όχι στο unrepresented', () => {
    const study = JSON.parse(PROD['psd115-w1-study'])
    const r = rec({ ...PROD, 'psd115-w1-study': JSON.stringify({ ...study, flashcardSeenIds: [...study.flashcardSeenIds, 'fc-removed'] }) })
    assert.equal(r.ok, false)
    assert.deepEqual(Object.keys(r.diff), ['flashcardSeenIds'])
    assert.deepEqual(r.unrepresented, [])
  })
})
