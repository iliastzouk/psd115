/**
 * Tests του backup v2 / import / reset και της συναλλαγής πολλών κλειδιών (Phase 1E-1). Run: npm test
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProgressStore, EVENTS_KEY, STATE_KEY } from '../src/core/progress/progressStore.js'
import {
  applyImport,
  buildExport,
  describeReset,
  createSafetyBackup,
  legacyResetKeys,
  planImport,
  resetProgressSafely,
} from '../src/utils/progressBackup.js'
import { recoverInterrupted, runTransaction, TXN_KEY } from '../src/utils/progressTransaction.js'
import { validateExport } from '../src/utils/progressValidate.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const sampleV1 = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/progress-export.sample.json'), 'utf8'))

/** localStorage σε Node, με προαιρετική αποτυχία ανά εγγραφή (π.χ. quota). */
function fakeStorage(init = {}, { failSet } = {}) {
  const m = new Map(Object.entries(init))
  return {
    get length() {
      return m.size
    },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem(k, v) {
      if (failSet?.(k, String(v))) {
        const e = new Error('quota')
        e.name = 'QuotaExceededError'
        throw e
      }
      m.set(k, String(v))
    },
    removeItem: (k) => void m.delete(k),
    dump: () => Object.fromEntries(m),
    failSet: (fn) => {
      failSet = fn
    },
  }
}
const noDownload = () => {}
const storeKeysIn = (dump) => Object.keys(dump).filter((k) => k.startsWith('study-progress-'))

const EV = (n, extra = {}) => ({
  id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  t: Date.UTC(2026, 9, 1) + n,
  item: `psd115/q-${n}`,
  kind: 'answer',
  ok: 1,
  ctx: 'quiz',
  ...extra,
})

const LEGACY = {
  'psd115-w1-study': JSON.stringify({ quizAnswered: 1, quizCorrect: 0, byCategory: { 'w2-ethics': { correct: 0, wrong: 1 } }, flashcardSeenIds: [], wrongBook: [{ uid: 'u', id: 'q-1', categoryId: 'w2-ethics', question: 'Q', explanation: 'E', userLabel: 'A', correctLabel: 'B' }] }),
  'psd115-w4-checklists': JSON.stringify({ overview: [false, false] }),
  'psd115-w1-pavlov-checklist': JSON.stringify([true, false]),
  'psd115-w1-theme': 'light',
  'psd115-disclaimer-v1': '1',
}

describe('export v2', () => {
  test('μορφή: legacy keys + raw κλειδιά νέου store + migration metadata', () => {
    const s = fakeStorage({ ...LEGACY, [EVENTS_KEY]: JSON.stringify([EV(1)]), [STATE_KEY]: '{"x":1}', 'psd115-backup-old': '{}', other: 'x' })
    const data = buildExport('export', s)
    assert.equal(data.format, 'psd115-progress-export')
    assert.equal(data.version, 2)
    assert.deepEqual(data.keys, LEGACY)
    assert.deepEqual(data.progressStore, { [EVENTS_KEY]: JSON.stringify([EV(1)]), [STATE_KEY]: '{"x":1}' })
    assert.deepEqual(data.migration, { markerKey: 'migration:psd115-v1', marker: null })
    assert.ok(validateExport(data).ok)
  })
  test('άδειο νέο store → progressStore = {} (τίποτα δεν δημιουργείται)', () => {
    const s = fakeStorage({ ...LEGACY })
    const data = buildExport('export', s)
    assert.deepEqual(data.progressStore, {})
    assert.deepEqual(storeKeysIn(s.dump()), [])
  })
  test('κατεστραμμένα δεδομένα αντιγράφονται αυτούσια (το backup δεν αποτυγχάνει)', () => {
    const s = fakeStorage({ 'psd115-w1-study': '{broken', [EVENTS_KEY]: 'not json' })
    const data = buildExport('reset', s)
    assert.equal(data.keys['psd115-w1-study'], '{broken')
    assert.equal(data.progressStore[EVENTS_KEY], 'not json')
    assert.equal(validateExport(data).ok, false)
  })
  test('migration metadata: διαβάζει το σημάδι από το state αν υπάρχει (δεν το γράφει)', () => {
    const marker = { at: '2026-10-05T00:00:00.000Z', sourceHash: 'abc' }
    const s = fakeStorage({ [STATE_KEY]: JSON.stringify({ 'migration:psd115-v1': marker }) })
    assert.deepEqual(buildExport('export', s).migration.marker, marker)
  })
})

describe('import v1 (συμβατότητα)', () => {
  test('το sample v1 εισάγεται· άγνωστα και άλλα κλειδιά μένουν· τίποτα στο νέο store', () => {
    const s = fakeStorage({ 'psd115-extra-unknown': 'keep-me', 'psd115-w1-theme': 'dark' })
    const r = applyImport(sampleV1, s)
    const d = s.dump()
    for (const [k, v] of Object.entries(sampleV1.keys)) assert.equal(d[k], v, k)
    assert.equal(d['psd115-extra-unknown'], 'keep-me')
    assert.deepEqual(storeKeysIn(d), [])
    assert.equal(d[TXN_KEY], undefined)
    assert.equal(r.store.added, 0)
  })
  test('κατεστραμμένο legacy JSON στο αρχείο → απόρριψη, καμία εγγραφή', () => {
    const s = fakeStorage({ ...LEGACY })
    const before = s.dump()
    const bad = { ...sampleV1, keys: { ...sampleV1.keys, 'psd115-w1-study': '{oops' } }
    assert.throws(() => applyImport(bad, s))
    assert.deepEqual(s.dump(), before)
  })
  test('νεότερη έκδοση (3) → απόρριψη', () => {
    assert.equal(validateExport({ ...sampleV1, version: 3 }).ok, false)
  })
})

describe('import v2', () => {
  test('round-trip: export → import σε άδειο storage → ίδια raw κλειδιά και στα δύο μέρη', () => {
    const src = fakeStorage({ ...LEGACY, [EVENTS_KEY]: JSON.stringify([EV(1), EV(2)]), [STATE_KEY]: JSON.stringify({ a: [1, 2] }) })
    const data = JSON.parse(JSON.stringify(buildExport('export', src)))
    const dst = fakeStorage()
    applyImport(data, dst)
    const again = buildExport('export', dst)
    assert.deepEqual(again.keys, data.keys)
    assert.deepEqual(JSON.parse(again.progressStore[EVENTS_KEY]), JSON.parse(data.progressStore[EVENTS_KEY]))
    assert.deepEqual(JSON.parse(again.progressStore[STATE_KEY]), JSON.parse(data.progressStore[STATE_KEY]))
    assert.equal(dst.dump()[TXN_KEY], undefined)
  })
  test('με άδειο νέο store στο αρχείο: δεν γράφεται κανένα study-progress-* κλειδί', () => {
    const data = buildExport('export', fakeStorage({ ...LEGACY }))
    const dst = fakeStorage()
    applyImport(data, dst)
    assert.deepEqual(storeKeysIn(dst.dump()), [])
  })
  test('δεδομένα μόνο νέου store: τα legacy κλειδιά μένουν ανέγγιχτα', () => {
    const s = fakeStorage({ ...LEGACY })
    applyImport({ format: 'psd115-progress-export', version: 2, keys: {}, progressStore: { [EVENTS_KEY]: JSON.stringify([EV(5)]) } }, s)
    for (const [k, v] of Object.entries(LEGACY)) assert.equal(s.getItem(k), v, k)
    assert.equal(JSON.parse(s.getItem(EVENTS_KEY)).length, 1)
  })
  test('ίδιοι κανόνες με progressStore.importAll (ένωση events, state overwrite ανά κλειδί)', async () => {
    const current = { [EVENTS_KEY]: JSON.stringify([EV(1)]), [STATE_KEY]: JSON.stringify({ keep: 1, over: 'old' }) }
    const file = { events: [EV(1), EV(2)], state: { over: 'new', add: true } }

    const a = fakeStorage({ ...current })
    await createProgressStore({ storage: a }).importAll({ format: 'study-progress', version: 1, ...file })

    const b = fakeStorage({ ...current })
    applyImport({ format: 'psd115-progress-export', version: 2, keys: {}, progressStore: { [EVENTS_KEY]: JSON.stringify(file.events), [STATE_KEY]: JSON.stringify(file.state) } }, b)

    assert.deepEqual(JSON.parse(b.getItem(EVENTS_KEY)), JSON.parse(a.getItem(EVENTS_KEY)))
    assert.deepEqual(JSON.parse(b.getItem(STATE_KEY)), JSON.parse(a.getItem(STATE_KEY)))
  })
  test('ίδιο event id με άλλο περιεχόμενο → απόρριψη όλης της εισαγωγής (και του legacy μέρους)', () => {
    const s = fakeStorage({ ...LEGACY, [EVENTS_KEY]: JSON.stringify([EV(1)]) })
    const before = s.dump()
    const data = { format: 'psd115-progress-export', version: 2, keys: { 'psd115-w1-theme': 'dark' }, progressStore: { [EVENTS_KEY]: JSON.stringify([EV(1, { ok: 0 })]) } }
    assert.equal(planImport(data, s).ok, false)
    assert.throws(() => applyImport(data, s))
    assert.deepEqual(s.dump(), before)
  })
  test('κατεστραμμένο νέο store στο αρχείο → απόρριψη (άκυρο JSON, άκυρο event, διπλό id, άγνωστο κλειδί)', () => {
    const base = { format: 'psd115-progress-export', version: 2, keys: { 'psd115-w1-theme': 'dark' } }
    for (const progressStore of [
      { [EVENTS_KEY]: '{nope' },
      { [EVENTS_KEY]: JSON.stringify([{ ...EV(1), kind: 'wat' }]) },
      { [EVENTS_KEY]: JSON.stringify([EV(1), EV(1)]) },
      { [STATE_KEY]: '[1,2]' },
      { 'study-progress-other': '[]' },
    ]) {
      assert.equal(validateExport({ ...base, progressStore }).ok, false, JSON.stringify(progressStore))
    }
    assert.equal(validateExport({ ...base }).ok, false, 'v2 χωρίς progressStore')
  })
  test('κατεστραμμένα ΤΡΕΧΟΝΤΑ δεδομένα νέου store → απόρριψη, τίποτα δεν αντικαθίσταται', () => {
    const s = fakeStorage({ ...LEGACY, [EVENTS_KEY]: '{corrupt' })
    const before = s.dump()
    assert.throws(() => applyImport({ format: 'psd115-progress-export', version: 2, keys: {}, progressStore: { [EVENTS_KEY]: JSON.stringify([EV(1)]) } }, s))
    assert.deepEqual(s.dump(), before)
  })
  for (const [label, corrupt] of [
    ['EVENTS_KEY άκυρο JSON', { [EVENTS_KEY]: '{corrupt' }],
    ['EVENTS_KEY άκυρο event', { [EVENTS_KEY]: JSON.stringify([{ ...EV(1), kind: 'wat' }]) }],
    ['STATE_KEY άκυρο JSON', { [STATE_KEY]: '{corrupt' }],
    ['STATE_KEY όχι αντικείμενο', { [STATE_KEY]: '[1,2]' }],
  ]) {
    test(`v2 με progressStore = {} + κατεστραμμένο τρέχον νέο store (${label}) → απόρριψη, μηδέν εγγραφές`, () => {
      const s = fakeStorage({ ...LEGACY, ...corrupt })
      const before = s.dump()
      const data = buildExport('export', fakeStorage({ ...LEGACY, 'psd115-w1-theme': 'dark' }))
      assert.deepEqual(data.progressStore, {})
      assert.equal(validateExport(data).ok, true, 'το αρχείο είναι έγκυρο')
      assert.equal(planImport(data, s).ok, false)
      assert.throws(() => applyImport(data, s))
      assert.deepEqual(s.dump(), before, 'legacy και νέο store αμετάβλητα')
      assert.equal(s.getItem(TXN_KEY), null, 'κανένα σημάδι συναλλαγής')
    })
  }
  // v1: ίδια συμπεριφορά με πριν (δεν απορρίπτεται λόγω δεδομένων νέου store που δεν διαχειρίζεται).
  test('κατεστραμμένο τρέχον νέο store αλλά αρχείο χωρίς δεδομένα store → legacy εισάγεται, το raw μένει ως έχει', () => {
    const s = fakeStorage({ [EVENTS_KEY]: '{corrupt' })
    applyImport(sampleV1, s)
    assert.equal(s.getItem(EVENTS_KEY), '{corrupt')
    assert.equal(s.getItem('psd115-w1-study'), sampleV1.keys['psd115-w1-study'])
  })
})

describe('συναλλαγή: αποτυχία, rollback, διακοπή', () => {
  test('αποτυχία στη μέση των εγγραφών → rollback όλων, χωρίς σημάδι', () => {
    const s = fakeStorage({ ...LEGACY, [EVENTS_KEY]: JSON.stringify([EV(1)]) })
    const before = s.dump()
    const data = { format: 'psd115-progress-export', version: 2, keys: { 'psd115-w1-theme': 'dark', 'psd115-w1-study': LEGACY['psd115-w1-study'].replace('"quizAnswered":1', '"quizAnswered":2') }, progressStore: { [EVENTS_KEY]: JSON.stringify([EV(2)]) } }
    // Η εγγραφή του νέου store αποτυγχάνει (quota) αφού έχουν ήδη γραφτεί τα legacy κλειδιά.
    s.failSet((k) => k === EVENTS_KEY)
    assert.throws(() => applyImport(data, s), (e) => e.outcome === 'rolled-back')
    s.failSet(null)
    assert.deepEqual(s.dump(), before)
  })
  test('αποτυχία στο σημάδι (πριν από κάθε εγγραφή) → τίποτα δεν αλλάζει', () => {
    const s = fakeStorage({ ...LEGACY })
    const before = s.dump()
    s.failSet((k) => k === TXN_KEY)
    assert.throws(() => runTransaction(s, { op: 't', targets: { 'psd115-w1-theme': 'dark' } }), (e) => e.outcome === 'not-started')
    assert.deepEqual(s.dump(), before)
  })
  test('αποτυχία και στο rollback → το σημάδι μένει· η ανάκτηση στην εκκίνηση επαναφέρει', () => {
    const s = fakeStorage({ a: '1', b: '1' })
    let calls = 0
    // b αποτυγχάνει πάντα όσο ισχύει ο κανόνας· η επαναφορά του a επίσης αποτυγχάνει.
    s.failSet((k) => k === 'b' || (k === 'a' && ++calls > 1))
    assert.throws(() => runTransaction(s, { op: 't', targets: { a: '2', b: '2' } }), (e) => e.outcome === 'rollback-incomplete')
    assert.ok(s.getItem(TXN_KEY))
    s.failSet(null)
    assert.equal(recoverInterrupted(s).status, 'rolled-back')
    assert.deepEqual(s.dump(), { a: '1', b: '1' })
  })
  test('διακοπή μετά από μισές εγγραφές → recoverInterrupted επαναφέρει τα before', () => {
    const s = fakeStorage({ a: '1', b: '1' })
    s.setItem(TXN_KEY, JSON.stringify({ v: 1, op: 'import-v2', startedAt: 'x', before: { a: '1', b: '1' }, after: { a: '2', b: '2' } }))
    s.setItem('a', '2') // «κλείσιμο tab» πριν γραφτεί το b
    assert.deepEqual(recoverInterrupted(s), { status: 'rolled-back', op: 'import-v2' })
    assert.deepEqual(s.dump(), { a: '1', b: '1' })
  })
  test('διακοπή αφού γράφτηκαν όλα (πριν σβηστεί το σημάδι) → ολοκληρώνεται, όχι αναίρεση', () => {
    const s = fakeStorage({ a: '2', b: '2' })
    s.setItem(TXN_KEY, JSON.stringify({ v: 1, op: 'reset', startedAt: 'x', before: { a: '1', b: '1' }, after: { a: '2', b: '2' } }))
    assert.deepEqual(recoverInterrupted(s), { status: 'completed', op: 'reset' })
    assert.deepEqual(s.dump(), { a: '2', b: '2' })
  })
  test('διαγραφές (null) καταγράφονται και επαναφέρονται σωστά', () => {
    const s = fakeStorage({ b: '1' })
    s.setItem(TXN_KEY, JSON.stringify({ v: 1, op: 'reset', startedAt: 'x', before: { a: null, b: '1' }, after: { a: '9', b: null } }))
    s.setItem('a', '9')
    assert.equal(recoverInterrupted(s).status, 'rolled-back')
    assert.deepEqual(s.dump(), { b: '1' })
  })
  test('κατεστραμμένο ή άγνωστο σημάδι → κανένα δεδομένο δεν αγγίζεται', () => {
    for (const marker of ['{x', JSON.stringify({ v: 99, before: {}, after: {} })]) {
      const s = fakeStorage({ a: '1', [TXN_KEY]: marker })
      assert.equal(recoverInterrupted(s).status, 'corrupt-marker')
      assert.equal(s.getItem('a'), '1')
    }
  })
  test('χωρίς σημάδι: καμία εγγραφή', () => {
    const s = fakeStorage({ ...LEGACY })
    s.failSet(() => true) // οποιαδήποτε εγγραφή θα αποτύγχανε
    assert.deepEqual(recoverInterrupted(s), { status: 'none' })
  })
  test('δεύτερη συναλλαγή ενώ υπάρχει σημάδι → δεν ξεκινά', () => {
    const s = fakeStorage({ a: '1', [TXN_KEY]: JSON.stringify({ v: 1, before: {}, after: {} }) })
    assert.throws(() => runTransaction(s, { op: 't', targets: { a: '2' } }), (e) => e.outcome === 'not-started')
    assert.equal(s.getItem('a'), '1')
  })
})

describe('reset', () => {
  test('σβήνει μόνο legacy πρόοδο/checklists· theme, disclaimer, άγνωστα και νέο store μένουν· backup και των δύο', () => {
    const s = fakeStorage({ ...LEGACY, 'psd115-extra-unknown': 'x', [EVENTS_KEY]: JSON.stringify([EV(1)]) })
    let downloaded = null
    const r = resetProgressSafely({ storage: s, download: (data) => (downloaded = data) })
    const d = s.dump()
    assert.equal(d['psd115-w1-study'], undefined)
    assert.equal(d['psd115-w4-checklists'], undefined)
    assert.equal(d['psd115-w1-pavlov-checklist'], undefined)
    assert.equal(d['psd115-w1-theme'], 'light')
    assert.equal(d['psd115-disclaimer-v1'], '1')
    assert.equal(d['psd115-extra-unknown'], 'x')
    assert.equal(d[EVENTS_KEY], JSON.stringify([EV(1)]))
    assert.equal(d[TXN_KEY], undefined)
    assert.equal(downloaded.version, 2)
    assert.deepEqual(downloaded.keys, { ...LEGACY, 'psd115-extra-unknown': 'x' })
    assert.deepEqual(downloaded.progressStore, { [EVENTS_KEY]: JSON.stringify([EV(1)]) })
    assert.equal(r.removed.length, 3)
  })
  test('ίδιο σύνολο κλειδιών με το storage.resetProgress (όλα τα checklists που γράφει η εφαρμογή)', () => {
    const src = fs.readFileSync(path.join(root, 'src/utils/storage.js'), 'utf8')
    const keys = [...src.matchAll(/_KEY = '(psd115-[^']+)'/g)].map((m) => m[1]).filter((k) => k !== 'psd115-disclaimer-v1' && k !== 'psd115-w1-theme')
    assert.equal(keys.length, 22)
    const s = fakeStorage(Object.fromEntries([...keys, 'psd115-w1-theme', 'psd115-disclaimer-v1'].map((k) => [k, '[]'])))
    assert.deepEqual(legacyResetKeys(s).sort(), [...keys].sort())
  })
  test('αποτυχία στη μέση του reset → τίποτα δεν σβήνεται', () => {
    const s = fakeStorage({ ...LEGACY })
    let removes = 0
    const orig = s.removeItem
    s.removeItem = (k) => {
      if (k.startsWith('psd115-') && !k.startsWith('psd115-backup-') && ++removes === 2) throw new Error('boom')
      orig(k)
    }
    assert.throws(() => resetProgressSafely({ storage: s, download: noDownload }), (e) => e.outcome === 'rolled-back')
    for (const [k, v] of Object.entries(LEGACY)) assert.equal(s.getItem(k), v, k)
  })
})

describe('reset: δεν παρουσιάζεται ως πλήρες όταν μένουν δεδομένα του νέου store', () => {
  test('άδειο νέο store → πλήρες reset («όλη η αποθηκευμένη πρόοδος»)', () => {
    const r = describeReset(fakeStorage({ ...LEGACY }))
    assert.equal(r.full, true)
    assert.deepEqual(r.keptStoreKeys, [])
    assert.match(r.description, /όλη η αποθηκευμένη πρόοδος/)
  })
  test('populated study-progress-* → όχι πλήρες· το κείμενο λέει ότι μένουν και δεν λέει «όλη»', () => {
    for (const store of [{ [EVENTS_KEY]: JSON.stringify([EV(1)]) }, { [STATE_KEY]: '{"a":1}' }, { [EVENTS_KEY]: '{corrupt' }]) {
      const r = describeReset(fakeStorage({ ...LEGACY, ...store }))
      assert.equal(r.full, false, JSON.stringify(store))
      assert.deepEqual(r.keptStoreKeys, Object.keys(store))
      assert.doesNotMatch(r.description, /όλη η αποθηκευμένη πρόοδος/)
      assert.match(r.description, /ΔΕΝ διαγράφονται/)
    }
  })
  test('μετά το reset τα δεδομένα του νέου store αναφέρονται ως διατηρημένα', () => {
    const s = fakeStorage({ ...LEGACY, [STATE_KEY]: '{"a":1}' })
    const r = resetProgressSafely({ storage: s, download: noDownload })
    assert.deepEqual(r.keptStoreKeys, [STATE_KEY])
    assert.equal(s.getItem(STATE_KEY), '{"a":1}')
  })
  test('το UI παίρνει το κείμενο του reset από το describeReset (όχι σταθερό «όλη η πρόοδος»)', () => {
    const src = fs.readFileSync(path.join(root, 'src/layouts/AppShell.jsx'), 'utf8')
    assert.match(src, /describeReset\(\)\.description/)
    assert.doesNotMatch(src, /όλη η αποθηκευμένη πρόοδος/)
  })
})

describe('καμία εγγραφή στο νέο store στην κανονική εκτέλεση', () => {
  test('safety backup / export: δεν γράφουν study-progress-*', () => {
    const s = fakeStorage({ ...LEGACY })
    createSafetyBackup('import', { storage: s, download: noDownload })
    buildExport('export', s)
    assert.deepEqual(storeKeysIn(s.dump()), [])
  })
  test('ο κώδικας της εφαρμογής δεν δημιουργεί το νέο store (μόνο το DEV block του main.jsx)', () => {
    const walk = (dir) =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))
    const users = walk(path.join(root, 'src'))
      .filter((f) => !f.includes(`${path.sep}core${path.sep}progress${path.sep}`))
      .filter((f) => /getProgressStore\(|createProgressStore\(/.test(fs.readFileSync(f, 'utf8')))
      .map((f) => path.relative(root, f))
    // main.jsx: μόνο στο DEV block. progressMigration: δεν εισάγεται από την εφαρμογή. progressShadow: πίσω από build flag (1E-3).
    assert.deepEqual(users, ['src/main.jsx', 'src/utils/progressMigration.js', 'src/utils/progressShadow.js'])
    assert.match(fs.readFileSync(path.join(root, 'src/main.jsx'), 'utf8'), /if \(import\.meta\.env\.DEV\) \{[\s\S]*getProgressStore\(\)/)
  })
  test('μόνο το applyImport γράφει κλειδιά του νέου store, και μόνο ως στόχους συναλλαγής', () => {
    const src = fs.readFileSync(path.join(root, 'src/utils/progressBackup.js'), 'utf8')
    assert.doesNotMatch(src, /setItem\((EVENTS_KEY|STATE_KEY)/)
  })
})
