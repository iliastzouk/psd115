/**
 * Review PR #11 — εκκρεμές σημάδι συναλλαγής (`progress-txn-v1`): ΚΑΘΕ μονοπάτι εγγραφής πολλών κλειδιών αρνείται νέα
 * συναλλαγή (`not-started`) χωρίς να αγγίξει δεδομένα ή το σημάδι, ώστε η ανάκτηση της εκκίνησης να μην παρακάμπτεται.
 *
 * Το σημάδι δημιουργείται ρεαλιστικά: αποτυχία εγγραφής ΚΑΙ αποτυχία rollback (rollback-incomplete), είτε σε commit του
 * νέου store είτε σε legacy εγγραφή πολλών κλειδιών.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { newEventId } from '../src/core/progress/events.js'
import { createProgressStore, EVENTS_KEY, STATE_KEY } from '../src/core/progress/progressStore.js'
import { psd115ProgressAdapter as content } from '../src/core/progress/adapters/psd115.js'
import { recoverInterrupted, runTransaction, TXN_KEY } from '../src/core/progress/transaction.js'
import { applyImport, buildExport, importWithBackup, resetProgressSafely } from '../src/utils/progressBackup.js'
import { createLegacyProgressBackend } from '../src/utils/legacyProgressBackend.js'
import { activateShadow, deactivateShadow, migrateLegacyBaseline } from '../src/utils/progressMigration.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROD = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/progress-export.production-2026-10-05.json'), 'utf8')).keys
const T0 = Date.UTC(2026, 9, 22, 9, 0, 0)

function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init))
  let failSet = null
  return {
    get length() {
      return m.size
    },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem(k, v) {
      if (failSet?.(k)) throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' })
      m.set(k, String(v))
    },
    removeItem: (k) => void m.delete(k),
    dump: () => Object.fromEntries(m),
    fail(fn) {
      failSet = fn
    },
  }
}
const isBackup = (k) => k.startsWith('psd115-backup-')
const data = (d) => Object.fromEntries(Object.entries(d).filter(([k]) => !isBackup(k)))
const ev = (t) => ({ id: newEventId(), t, item: 'psd115/q-w2-var-1', kind: 'answer', ok: 1, ctx: 'quiz' })

/** 1η εγγραφή περνά, 2η αποτυγχάνει, το rollback της 1ης αποτυγχάνει → rollback-incomplete, το σημάδι μένει. */
function breakAfterFirst(s, first, second) {
  let firstWrites = 0
  s.fail((k) => k === second || (k === first && ++firstWrites > 1))
}

/** Έγκυρο αρχείο εισαγωγής που ΔΙΑΦΕΡΕΙ από τα τρέχοντα δεδομένα (export αντιγράφου με άλλο checklist). */
const importFile = () => buildExport('export', fakeStorage({ ...PROD, 'psd115-w1-pavlov-checklist': JSON.stringify([true, true, true, false, false, false, false, false, false]) }))

const SOURCES = {
  'commit του νέου store (events + state)': async () => {
    const s = fakeStorage({ ...PROD })
    assert.equal((await activateShadow({ storage: s, now: () => T0, backup: () => {}, content })).status, 'active')
    await createProgressStore({ storage: s }).append(ev(T0 + 1)) // υπάρχει log: το rollback του χρειάζεται setItem
    breakAfterFirst(s, EVENTS_KEY, STATE_KEY)
    await assert.rejects(createProgressStore({ storage: s }).commit({ events: [ev(T0 + 2)], state: { x: 1 } }), (e) => e.outcome === 'rollback-incomplete')
    return s
  },
  'legacy εγγραφή πολλών κλειδιών (ProgressService backend)': async () => {
    const s = fakeStorage({ ...PROD })
    breakAfterFirst(s, 'psd115-w1-study', 'psd115-w1-pavlov-checklist')
    assert.throws(
      () => createLegacyProgressBackend(s).write({ 'psd115-w1-study': '{"x":1}', 'psd115-w1-pavlov-checklist': '[true]' }),
      (e) => e.outcome === 'rollback-incomplete',
    )
    return s
  },
}

for (const [source, makePending] of Object.entries(SOURCES)) {
  describe(`εκκρεμές σημάδι από: ${source}`, () => {
    /** Όλα τα μονοπάτια πολλών κλειδιών (και του store) με το σημάδι να εκκρεμεί. */
    const PATHS = {
      'legacy backend (2 κλειδιά)': (s) => createLegacyProgressBackend(s).write({ 'psd115-w1-study': '{"y":2}', 'psd115-w4-checklists': '{}' }),
      'applyImport': (s, file) => applyImport(file, s),
      'importWithBackup': (s, file) => importWithBackup(file, { storage: s, download: () => {} }),
      'resetProgressSafely': (s) => resetProgressSafely({ storage: s, download: () => {}, now: () => T0 + 50 }),
      'store.append': (s) => createProgressStore({ storage: s }).append(ev(T0 + 60)),
      'store.commit': (s) => createProgressStore({ storage: s }).commit({ events: [ev(T0 + 61)], state: { y: 1 } }),
      'store.setState': (s) => createProgressStore({ storage: s }).setState('y', 1),
      'deactivateShadow': (s) => deactivateShadow({ storage: s }),
    }
    for (const [name, run] of Object.entries(PATHS)) {
      test(`${name} → not-started· δεδομένα και σημάδι byte-identical`, async () => {
        const s = await makePending()
        s.fail(null) // το storage «λειτουργεί» ξανά· μόνο το σημάδι εκκρεμεί
        const file = importFile()
        const marker = s.getItem(TXN_KEY)
        assert.notEqual(marker, null)
        const before = data(s.dump())
        let err
        try {
          await run(s, file)
        } catch (e) {
          err = e
        }
        assert.equal(err?.outcome, 'not-started', `${name}: ${err?.message ?? 'δεν απορρίφθηκε'}`)
        assert.deepEqual(data(s.dump()), before, 'καμία αλλαγή στα δεδομένα (τα safety backups εξαιρούνται)')
        assert.equal(s.getItem(TXN_KEY), marker, 'το σημάδι δεν άλλαξε')
      })
    }

    test('migration σε storage με εκκρεμές σημάδι → not-started, τίποτα δεν γράφεται', async () => {
      const pending = await makePending()
      const s = fakeStorage({ ...PROD, [TXN_KEY]: pending.getItem(TXN_KEY) })
      const before = data(s.dump())
      await assert.rejects(migrateLegacyBaseline({ storage: s, now: () => T0, enabled: true, backup: () => {}, content }), (e) => e.outcome === 'not-started')
      assert.deepEqual(data(s.dump()), before)
    })

    test('μετά από ΟΛΕΣ τις αρνήσεις: η ανάκτηση της εκκίνησης επαναφέρει ακριβώς το «before» του σημαδιού', async () => {
      const s = await makePending()
      s.fail(null)
      const marker = JSON.parse(s.getItem(TXN_KEY))
      const file = importFile()
      for (const run of Object.values(PATHS)) await Promise.resolve().then(() => run(s, file)).catch(() => {})
      assert.equal(recoverInterrupted(s).status, 'rolled-back')
      assert.equal(s.getItem(TXN_KEY), null)
      for (const [key, value] of Object.entries(marker.before)) assert.equal(s.getItem(key), value, key)
    })
  })
}

test('η άρνηση γίνεται ΠΡΙΝ από οποιαδήποτε εγγραφή (το runTransaction δεν γράφει τίποτα όταν εκκρεμεί σημάδι)', () => {
  const s = fakeStorage({ a: '1', [TXN_KEY]: JSON.stringify({ v: 1, op: 'x', before: { a: '0' }, after: { a: '1' } }) })
  const writes = []
  const set = s.setItem
  s.setItem = (k, v) => {
    writes.push(k)
    set(k, v)
  }
  s.removeItem = (k) => writes.push(`rm ${k}`)
  assert.throws(() => runTransaction(s, { op: 'y', targets: { a: '2', b: null } }), (e) => e.outcome === 'not-started')
  assert.deepEqual(writes, [])
})

test('συναλλαγή χωρίς καμία αλλαγή (π.χ. εισαγωγή πανομοιότυπου αρχείου) με εκκρεμές σημάδι → no-op: καμία εγγραφή, σημάδι ανέγγιχτο', () => {
  const marker = JSON.stringify({ v: 1, op: 'x', before: { a: '0' }, after: { a: '1' } })
  const s = fakeStorage({ a: '1', b: '2', [TXN_KEY]: marker })
  const before = s.dump()
  assert.deepEqual(runTransaction(s, { op: 'y', targets: { a: '1', b: '2' } }), { changed: [] })
  assert.deepEqual(s.dump(), before)
})
