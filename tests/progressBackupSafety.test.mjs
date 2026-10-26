/**
 * Φάση 1 (μετά το 1E-4c-2) — ασφάλεια backup και αποθήκευσης.
 *
 *  T1  όριο 3 τοπικών backups· σύγκρουση timestamp (D3: μοναδικό κλειδί, κανένα backup δεν αντικαθίσταται)
 *  T2  reset με γεμάτο storage → BackupError, η πρόοδος ανέπαφη, κανένα σημάδι, τα παλιά backups μένουν (D4)
 *  T3  import: αποτυχία backup / πριν από τη συναλλαγή / rolled-back / rollback-incomplete — η ακεραιότητα της προόδου
 *      ελέγχεται ΧΩΡΙΣΤΑ από την κατάσταση των backups (D4: backup + κλάδεμα μπορεί να έχουν γίνει)
 *  T4  εκκρεμές σημάδι (D1): reset/import ακυρώνονται ΠΡΙΝ από backup/λήψη/κλάδεμα· αποτυχία ελέγχου → fail-closed
 *  T5  μηνύματα ανά πραγματικό αποτέλεσμα (D2)
 *
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildExport, importWithBackup, listLocalBackups, resetProgressSafely, createSafetyBackup } from '../src/utils/progressBackup.js'
import { recoverInterrupted, TXN_KEY } from '../src/utils/progressTransaction.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROD = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/progress-export.production-2026-10-05.json'), 'utf8')).keys
const PREFIX = 'psd115-backup-'
const T0 = Date.UTC(2026, 9, 27, 9, 0, 0)

function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init))
  const hooks = { set: null, remove: null, get: null }
  return {
    get length() {
      return m.size
    },
    key: (i) => [...m.keys()][i] ?? null,
    getItem(k) {
      if (hooks.get?.(k)) throw new Error('SecurityError')
      return m.has(k) ? m.get(k) : null
    },
    setItem(k, v) {
      if (hooks.set?.(k)) throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' })
      m.set(k, String(v))
    },
    removeItem(k) {
      if (hooks.remove?.(k)) throw new Error('remove failed')
      m.delete(k)
    },
    dump: () => Object.fromEntries(m),
    hooks,
  }
}
const isBackup = (k) => k.startsWith(PREFIX)
/** Μόνο τα δεδομένα προόδου (legacy + νέο store), χωρίς backups και σημάδι. */
const progress = (s) => Object.fromEntries(Object.entries(s.dump()).filter(([k]) => !isBackup(k) && k !== TXN_KEY))
const backups = (s) => Object.fromEntries(Object.entries(s.dump()).filter(([k]) => isBackup(k)))
const noDownload = () => {}
/** Έγκυρο αρχείο εισαγωγής που διαφέρει από τα τρέχοντα δεδομένα. */
const importFile = () =>
  buildExport('export', fakeStorage({ ...PROD, 'psd115-w1-pavlov-checklist': JSON.stringify(Array(9).fill(true)), 'psd115-w4-checklists': '{}' }))

/** Ρολόι υπό έλεγχο (το createSafetyBackup παίρνει τον χρόνο από το Date). */
function withClock(t, start = T0) {
  t.mock.timers.enable({ apis: ['Date'], now: start })
  return { tick: (ms = 1) => t.mock.timers.tick(ms) }
}

describe('T1 · όριο 3 τοπικών backups', () => {
  test('5 διαδοχικά backups → μένουν ακριβώς τα 3 νεότερα, έγκυρα, σε χρονολογική σειρά', (t) => {
    const clock = withClock(t)
    const s = fakeStorage({ ...PROD })
    const keys = []
    for (let i = 0; i < 5; i++) {
      keys.push(createSafetyBackup('reset', { storage: s, download: noDownload }).key)
      clock.tick(1000)
    }
    assert.deepEqual(listLocalBackups(s), keys.slice(-3))
    for (const k of listLocalBackups(s)) assert.deepEqual(JSON.parse(s.getItem(k)).keys, PROD)
  })

  test('αποτυχία στο κλάδεμα παλιών → το νέο backup μένει έγκυρο (το κλάδεμα δεν το επηρεάζει)', (t) => {
    const clock = withClock(t)
    const s = fakeStorage({ ...PROD })
    for (let i = 0; i < 3; i++) {
      createSafetyBackup('reset', { storage: s, download: noDownload })
      clock.tick(1000)
    }
    s.hooks.remove = (k) => isBackup(k)
    const r = createSafetyBackup('reset', { storage: s, download: noDownload })
    assert.equal(r.storedLocally, true)
    assert.equal(s.getItem(r.key), JSON.stringify(r.data))
    assert.equal(listLocalBackups(s).length, 4, 'τα παλιά δεν κλαδεύτηκαν (best effort)')
  })

  test('D3: δύο backups στο ΙΔΙΟ ms → δύο διαφορετικά κλειδιά, το πρώτο ΔΕΝ αντικαθίσταται', (t) => {
    withClock(t)
    const s = fakeStorage({ ...PROD })
    const a = createSafetyBackup('reset', { storage: s, download: noDownload })
    const firstRaw = s.getItem(a.key)
    s.setItem('psd115-w1-pavlov-checklist', '[true]') // το 2ο backup έχει άλλο περιεχόμενο
    const b = createSafetyBackup('import', { storage: s, download: noDownload })
    assert.notEqual(a.key, b.key)
    assert.equal(s.getItem(a.key), firstRaw, 'το πρώτο backup έμεινε byte-identical')
    assert.equal(s.getItem(b.key), JSON.stringify(b.data))
    assert.deepEqual(listLocalBackups(s), [a.key, b.key], 'χρονολογική σειρά: το αρχικό κλειδί πριν από το suffix')
    assert.ok(a.key === `${PREFIX}${new Date(T0).toISOString()}`, 'χωρίς σύγκρουση η μορφή του κλειδιού δεν αλλάζει')
  })

  test('D3: 12 backups στο ίδιο ms → μένουν τα 3 τελευταία που δημιουργήθηκαν (σωστή σειρά και μετά το 10ο)', (t) => {
    withClock(t)
    const s = fakeStorage({ ...PROD })
    const keys = []
    for (let i = 0; i < 12; i++) keys.push(createSafetyBackup('reset', { storage: s, download: noDownload }).key)
    assert.equal(new Set(keys).size, 12)
    assert.deepEqual(listLocalBackups(s), keys.slice(-3))
  })
})

describe('T2 · reset με γεμάτο storage (D4: πρώτα το νέο backup, μετά το κλάδεμα)', () => {
  for (const existing of [0, 3]) {
    test(`${existing} υπάρχοντα backups, το νέο δεν χωρά → BackupError· πρόοδος ανέπαφη· κανένα σημάδι· τα παλιά μένουν`, (t) => {
      const clock = withClock(t)
      const s = fakeStorage({ ...PROD })
      for (let i = 0; i < existing; i++) {
        createSafetyBackup('reset', { storage: s, download: noDownload })
        clock.tick(1000)
      }
      const before = { progress: progress(s), backups: backups(s) }
      s.hooks.set = (k) => isBackup(k)
      assert.throws(() => resetProgressSafely({ storage: s, download: noDownload }), (e) => e.name === 'BackupError')
      assert.deepEqual(progress(s), before.progress)
      assert.deepEqual(backups(s), before.backups, 'κανένα παλιό backup δεν σβήστηκε εκ των προτέρων')
      assert.equal(s.getItem(TXN_KEY), null)
    })
  }
})

describe('T3 · import: ακεραιότητα προόδου ανά σημείο αποτυχίας (χωριστά από τα backups)', () => {
  test('αποτυχία backup → BackupError· η πρόοδος δεν αλλάζει· κανένα σημάδι', () => {
    const s = fakeStorage({ ...PROD })
    const before = progress(s)
    s.hooks.set = (k) => isBackup(k)
    assert.throws(() => importWithBackup(importFile(), { storage: s, download: noDownload }), (e) => e.name === 'BackupError')
    assert.deepEqual(progress(s), before)
    assert.equal(s.getItem(TXN_KEY), null)
  })

  test('αποτυχία πριν αρχίσει η συναλλαγή (το σημάδι δεν χωρά) → not-started· η πρόοδος ανέπαφη (το backup μπορεί να υπάρχει)', () => {
    const s = fakeStorage({ ...PROD })
    const before = progress(s)
    s.hooks.set = (k) => k === TXN_KEY
    assert.throws(() => importWithBackup(importFile(), { storage: s, download: noDownload }), (e) => e.outcome === 'not-started')
    assert.deepEqual(progress(s), before)
    assert.equal(s.getItem(TXN_KEY), null)
    assert.equal(listLocalBackups(s).length, 1, 'D4: το backup δημιουργήθηκε (αποδεκτό) — δεν είναι πρόοδος')
  })

  test('αποτυχία στη μέση, επιτυχές rollback → rolled-back· αρχικές τιμές, το σημάδι καθαρίστηκε', () => {
    const s = fakeStorage({ ...PROD })
    const before = progress(s)
    s.hooks.set = (k) => k === 'psd115-w4-checklists'
    assert.throws(() => importWithBackup(importFile(), { storage: s, download: noDownload }), (e) => e.outcome === 'rolled-back')
    assert.deepEqual(progress(s), before)
    assert.equal(s.getItem(TXN_KEY), null)
  })

  test('αποτυχία στη μέση ΚΑΙ στο rollback → rollback-incomplete· το σημάδι μένει, η κατάσταση ΔΕΝ είναι αποκατεστημένη· η ανάκτηση επαναφέρει', () => {
    const s = fakeStorage({ ...PROD })
    const before = progress(s)
    let pavlovWrites = 0
    s.hooks.set = (k) => k === 'psd115-w4-checklists' || (k === 'psd115-w1-pavlov-checklist' && ++pavlovWrites > 1)
    assert.throws(() => importWithBackup(importFile(), { storage: s, download: noDownload }), (e) => e.outcome === 'rollback-incomplete')
    assert.notEqual(s.getItem(TXN_KEY), null, 'το σημάδι μένει μέχρι την ανάκτηση')
    assert.notDeepEqual(progress(s), before, 'μισή κατάσταση: δεν παρουσιάζεται ως αποκατεστημένη')
    s.hooks.set = null
    assert.equal(recoverInterrupted(s).status, 'rolled-back')
    assert.deepEqual(progress(s), before)
    assert.equal(s.getItem(TXN_KEY), null)
  })

  test('reset: αποτυχία στη μέση ΚΑΙ στο rollback → rollback-incomplete, σημάδι· η ανάκτηση επαναφέρει', () => {
    const s = fakeStorage({ ...PROD })
    const before = progress(s)
    // Το backup γράφεται κανονικά· μετά η 2η διαγραφή αποτυγχάνει και από εκεί και πέρα αποτυγχάνει και η επαναφορά.
    let removes = 0
    let blockRestore = false
    s.hooks.remove = (k) => !isBackup(k) && k.startsWith('psd115-') && ++removes === 2 && (blockRestore = true)
    s.hooks.set = (k) => blockRestore && k.startsWith('psd115-w')
    assert.throws(() => resetProgressSafely({ storage: s, download: noDownload }), (e) => e.outcome === 'rollback-incomplete')
    assert.notEqual(s.getItem(TXN_KEY), null, 'το σημάδι μένει μέχρι την ανάκτηση')
    assert.notDeepEqual(progress(s), before)
    s.hooks.set = null
    s.hooks.remove = null
    assert.equal(recoverInterrupted(s).status, 'rolled-back')
    assert.deepEqual(progress(s), before)
  })
})

describe('T4 · εκκρεμές σημάδι (D1): ακύρωση ΠΡΙΝ από backup, λήψη ή κλάδεμα', () => {
  const MARKER = JSON.stringify({ v: 1, op: 'import-v2', startedAt: new Date(T0).toISOString(), before: { 'psd115-w4-checklists': PROD['psd115-w4-checklists'] }, after: { 'psd115-w4-checklists': '{}' } })
  function threeBackupsThenMarker(t) {
    const clock = withClock(t)
    const s = fakeStorage({ ...PROD })
    for (let i = 0; i < 3; i++) {
      createSafetyBackup('reset', { storage: s, download: noDownload })
      clock.tick(1000)
    }
    s.setItem(TXN_KEY, MARKER)
    return s
  }
  const ACTIONS = {
    reset: (s, download) => resetProgressSafely({ storage: s, download }),
    import: (s, download) => importWithBackup(importFile(), { storage: s, download }),
  }
  for (const [name, run] of Object.entries(ACTIONS)) {
    test(`${name} με εκκρεμές σημάδι → PendingTransactionError(pending)· καμία λήψη· τα 3 backups, η πρόοδος και το σημάδι byte-identical`, (t) => {
      const s = threeBackupsThenMarker(t)
      const before = s.dump()
      let downloads = 0
      assert.throws(() => run(s, () => downloads++), (e) => e.name === 'PendingTransactionError' && e.reason === 'pending')
      assert.equal(downloads, 0)
      assert.deepEqual(s.dump(), before)
    })
    test(`${name}: ο έλεγχος του σημαδιού πετάει → fail-closed, PendingTransactionError(unverifiable), τίποτα δεν αλλάζει`, () => {
      const s = fakeStorage({ ...PROD })
      s.hooks.get = (k) => k === TXN_KEY
      const before = s.dump()
      let downloads = 0
      assert.throws(() => run(s, () => downloads++), (e) => e.name === 'PendingTransactionError' && e.reason === 'unverifiable')
      assert.equal(downloads, 0)
      assert.deepEqual(s.dump(), before)
    })
  }
  test('χωρίς σημάδι: reset και import λειτουργούν κανονικά (backup + αλλαγή)', () => {
    const s = fakeStorage({ ...PROD })
    importWithBackup(importFile(), { storage: s, download: noDownload })
    assert.equal(s.getItem('psd115-w4-checklists'), '{}')
    resetProgressSafely({ storage: s, download: noDownload })
    assert.equal(s.getItem('psd115-w1-study'), null)
    assert.ok(listLocalBackups(s).length >= 1)
  })
})

describe('T5 · μηνύματα ανά πραγματικό αποτέλεσμα (D2)', () => {
  const load = () => import('../src/utils/progressFailureMessage.js')
  const err = (props) => Object.assign(new Error('x'), props)
  for (const action of ['reset', 'import']) {
    test(`${action}: BackupError → ακυρώθηκε, η πρόοδος δεν άλλαξε`, async () => {
      const { describeProgressFailure } = await load()
      assert.match(describeProgressFailure(action, err({ name: 'BackupError' })), /αντίγραφο ασφαλείας.*ακυρώθηκε.*δεν άλλαξε/)
    })
    for (const outcome of ['not-started', 'rolled-back']) {
      test(`${action}: ${outcome} → η πρόοδος δεν άλλαξε (επιβεβαιωμένο)`, async () => {
        const { describeProgressFailure } = await load()
        assert.match(describeProgressFailure(action, err({ name: 'ProgressTransactionError', outcome })), /δεν άλλαξε/)
      })
    }
    test(`${action}: rollback-incomplete → «δεν ολοκληρώθηκε με ασφάλεια… επαναφόρτωσε», ΧΩΡΙΣ «δεν άλλαξε» και χωρίς υπόσχεση επιτυχίας`, async () => {
      const { describeProgressFailure } = await load()
      const m = describeProgressFailure(action, err({ name: 'ProgressTransactionError', outcome: 'rollback-incomplete' }))
      assert.match(m, /δεν ολοκληρώθηκε με ασφάλεια/)
      assert.match(m, /Επαναφόρτωσε τη σελίδα για να επιχειρηθεί ανάκτηση/)
      assert.doesNotMatch(m, /δεν άλλαξε|διατηρήθηκε|θα ανακτηθεί/)
    })
    test(`${action}: εκκρεμές σημάδι → «Εκκρεμεί ανάκτηση· επαναφόρτωσε…»`, async () => {
      const { describeProgressFailure } = await load()
      assert.match(describeProgressFailure(action, err({ name: 'PendingTransactionError', reason: 'pending' })), /Εκκρεμεί ανάκτηση· επαναφόρτωσε τη σελίδα πριν δοκιμάσεις ξανά/)
    })
    test(`${action}: ο έλεγχος δεν έγινε → «δεν μπόρεσε να ελεγχθεί… ακυρώθηκε», χωρίς ισχυρισμό εκκρεμούς ανάκτησης`, async () => {
      const { describeProgressFailure } = await load()
      const m = describeProgressFailure(action, err({ name: 'PendingTransactionError', reason: 'unverifiable' }))
      assert.match(m, /δεν μπόρεσε να ελεγχθεί/)
      assert.match(m, /ακυρώθηκε/)
      assert.doesNotMatch(m, /Εκκρεμεί ανάκτηση/)
    })
    test(`${action}: άγνωστο σφάλμα → ΔΕΝ ισχυρίζεται ότι η πρόοδος δεν άλλαξε`, async () => {
      const { describeProgressFailure } = await load()
      assert.doesNotMatch(describeProgressFailure(action, new Error('κάτι άλλο')), /δεν άλλαξε|διατηρήθηκε/)
    })
  }
  test('import: άκυρο αρχείο (πριν από κάθε εγγραφή) → not-started → «δεν άλλαξε»', async () => {
    const { describeProgressFailure } = await load()
    const s = fakeStorage({ ...PROD })
    let e
    try {
      importWithBackup({ format: 'psd115-progress-export', version: 1, keys: { 'psd115-w1-study': '{oops' } }, { storage: s, download: noDownload })
    } catch (x) {
      e = x
    }
    assert.equal(e?.outcome, 'not-started')
    assert.match(describeProgressFailure('import', e), /δεν άλλαξε/)
  })
})
