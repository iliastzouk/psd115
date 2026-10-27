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

/** Μονοπάτια που (Φάση 1, D1) ελέγχουν το σημάδι ΠΡΙΝ από το safety backup. */
const EARLY = new Set(['importWithBackup', 'resetProgressSafely'])

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
        const all = s.dump()
        let err
        try {
          await run(s, file)
        } catch (e) {
          err = e
        }
        if (EARLY.has(name)) {
          // Φάση 1 (D1): reset/import απορρίπτονται ΠΡΙΝ από το backup — ούτε νέο backup ούτε κλάδεμα παλιού.
          assert.equal(err?.name, 'PendingTransactionError', `${name}: ${err?.message ?? 'δεν απορρίφθηκε'}`)
          assert.equal(err.reason, 'pending')
          assert.deepEqual(s.dump(), all, 'καμία αλλαγή, ΟΥΤΕ στα backups')
        } else assert.equal(err?.outcome, 'not-started', `${name}: ${err?.message ?? 'δεν απορρίφθηκε'}`)
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

describe('review PR #11 · legacy εγγραφή ΕΝΟΣ κλειδιού με εκκρεμές σημάδι → απόρριψη + degraded', async () => {
  const { createProgressService } = await import('../src/core/progress/progressService.js')
  const PAVLOV = 'psd115-w1-pavlov-checklist'
  const W4 = 'psd115-w4-checklists'
  // Μισή κατάσταση με ΕΓΚΥΡΕΣ τιμές: ο reader τη διαβάζει κανονικά, ώστε το degraded να οφείλεται ΜΟΝΟ στο σημάδι.
  const HALF = { [PAVLOV]: '[true,true]', [W4]: '{}' }
  const service = (s) => createProgressService({ courseId: 'psd115', content, backend: createLegacyProgressBackend(s) })
  /** Ρεαλιστικό σημάδι: legacy εγγραφή 2 κλειδιών αποτυγχάνει ΚΑΙ στο rollback (όπως ένα αποτυχημένο import/reset). */
  function pendingFromLegacy() {
    const s = fakeStorage({ ...PROD })
    breakAfterFirst(s, PAVLOV, W4)
    assert.throws(() => createLegacyProgressBackend(s).write(HALF), (e) => e.outcome === 'rollback-incomplete')
    s.fail(null)
    return s
  }

  test('χωρίς σημάδι: η εγγραφή ενός κλειδιού γίνεται κανονικά (backend και service)', () => {
    const s = fakeStorage({ ...PROD })
    createLegacyProgressBackend(s).write({ [PAVLOV]: '[true]' })
    assert.equal(s.getItem(PAVLOV), '[true]')
    const svc = service(s)
    assert.equal(svc.setChecklist('pavlov', [false, true]), true)
    assert.equal(s.getItem(PAVLOV), '[false,true]')
    assert.equal(svc.getSnapshot().status, 'ready')
  })

  test('με εκκρεμές σημάδι: backend.write ενός κλειδιού → not-started, δεδομένα και σημάδι byte-identical', () => {
    const s = pendingFromLegacy()
    const marker = s.getItem(TXN_KEY)
    const before = s.dump()
    assert.throws(() => createLegacyProgressBackend(s).write({ 'psd115-w1-study': PROD['psd115-w1-study'].replace('"quizAnswered":', '"quizAnswered":1') }), (e) => e.outcome === 'not-started')
    assert.deepEqual(s.dump(), before)
    assert.equal(s.getItem(TXN_KEY), marker)
  })

  test('αποτυχημένο rollback → η ΕΠΟΜΕΝΗ ενέργεια (κάρτα / checklist / απάντηση) δεν γράφεται, δεν δηλώνεται επιτυχία, degraded', () => {
    const s = fakeStorage({ ...PROD })
    const svc = service(s) // ready, πριν από την αποτυχία
    const notified = []
    svc.subscribe(() => notified.push(svc.getSnapshot().status))
    breakAfterFirst(s, PAVLOV, W4)
    assert.throws(() => createLegacyProgressBackend(s).write(HALF), (e) => e.outcome === 'rollback-incomplete')
    s.fail(null)
    const marker = s.getItem(TXN_KEY)
    const before = s.dump()
    const snapBefore = svc.getSnapshot()

    assert.equal(svc.markCardSeen('fc-freud-1'), false, 'η ενέργεια ΔΕΝ δηλώνεται ως επιτυχής')
    assert.deepEqual(s.dump(), before, 'καμία εγγραφή')
    assert.equal(s.getItem(TXN_KEY), marker, 'το σημάδι δεν αγγίζεται')
    const st = svc.getSnapshot()
    assert.equal(st.status, 'degraded')
    assert.match(st.issues.join(' '), /ανάκτηση/)
    assert.deepEqual(st.courses.psd115, snapBefore.courses.psd115, 'η μνήμη μένει στο snapshot πριν από την ενέργεια')
    assert.deepEqual(notified, ['degraded'], 'ένα notify: η μετάβαση σε degraded (το UI δείχνει το μήνυμα)')

    // Σε degraded: οι επόμενες ενέργειες είναι no-op (ούτε εγγραφή ούτε αλλαγή μνήμης).
    assert.equal(svc.setChecklist('pavlov', [true, true]), false)
    assert.equal(svc.answerQuestion({ questionId: 'q-w2-var-1', ok: true }), false)
    assert.deepEqual(s.dump(), before)
    assert.equal(svc.getSnapshot(), st)
  })

  test('εκκρεμές σημάδι στη φόρτωση/resync (π.χ. μετά από αποτυχημένο reset) → degraded, καμία εγγραφή', () => {
    const s = pendingFromLegacy()
    const before = s.dump()
    // Η μισή κατάσταση είναι αναγνώσιμη: χωρίς σημάδι το service θα ήταν ready (άρα το degraded οφείλεται στο σημάδι).
    assert.equal(service(fakeStorage(Object.fromEntries(Object.entries(before).filter(([k]) => k !== TXN_KEY)))).getSnapshot().status, 'ready')
    assert.equal(service(s).getSnapshot().status, 'degraded')
    const svc = service(fakeStorage({ ...PROD }))
    assert.equal(svc.getSnapshot().status, 'ready')
    const s2 = pendingFromLegacy()
    const svc2 = service(s2)
    svc2.resync()
    assert.equal(svc2.getSnapshot().status, 'degraded')
    assert.deepEqual(s.dump(), before)
  })

  test('reload: η υπάρχουσα ανάκτηση επαναφέρει τις αρχικές τιμές και το νέο service είναι ready', () => {
    const s = fakeStorage({ ...PROD })
    const svc = service(s)
    breakAfterFirst(s, PAVLOV, W4)
    assert.throws(() => createLegacyProgressBackend(s).write(HALF), (e) => e.outcome === 'rollback-incomplete')
    s.fail(null)
    svc.markCardSeen('fc-freud-1') // απορρίπτεται
    const recovery = recoverInterrupted(s) // όπως το main.jsx στην εκκίνηση
    assert.equal(recovery.status, 'rolled-back')
    for (const [k, v] of Object.entries(PROD)) assert.equal(s.getItem(k), v, k)
    assert.equal(s.getItem(TXN_KEY), null)
    const fresh = createProgressService({ courseId: 'psd115', content, backend: createLegacyProgressBackend(s), recovery })
    assert.equal(fresh.getSnapshot().status, 'ready')
    assert.equal(fresh.markCardSeen('fc-freud-1'), true, 'μετά την ανάκτηση οι εγγραφές συνεχίζουν')
  })

  test('αποτυχία εγγραφής ΧΩΡΙΣ σημάδι (π.χ. quota σε ένα κλειδί) → ready, όχι degraded· Φάση 2: false + writeFailure', () => {
    const s = fakeStorage({ ...PROD })
    const warns = []
    const svc = createProgressService({ courseId: 'psd115', content, backend: createLegacyProgressBackend(s), warn: (...a) => warns.push(a) })
    s.fail((k) => k === PAVLOV)
    assert.equal(svc.setChecklist('pavlov', [true]), false)
    assert.equal(svc.getSnapshot().status, 'ready')
    assert.equal(svc.getSnapshot().writeFailure.kind, 'quota')
    assert.equal(warns.length, 1)
  })
})

describe('review PR #11 · ο ΙΔΙΟΣ ο έλεγχος του σημαδιού αποτυγχάνει → fail-closed (degraded), ποτέ εξαίρεση', async () => {
  const { createProgressService } = await import('../src/core/progress/progressService.js')
  const PAVLOV = 'psd115-w1-pavlov-checklist'
  /** Storage όπου η ανάγνωση του σημαδιού πετάει όσο `broken.marker` είναι true· `broken.set` για αποτυχία εγγραφής. */
  function flakyStorage() {
    const s = fakeStorage({ ...PROD })
    const broken = { marker: false, set: null }
    const writes = []
    const { getItem, setItem } = s
    s.getItem = (k) => {
      if (k === TXN_KEY && broken.marker) throw new Error('SecurityError: storage δεν είναι διαθέσιμο')
      return getItem(k)
    }
    s.setItem = (k, v) => {
      if (broken.set?.(k)) throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' })
      writes.push(k)
      setItem(k, v)
    }
    return { s, broken, writes }
  }
  const service = (s, warn = () => {}) => createProgressService({ courseId: 'psd115', content, backend: createLegacyProgressBackend(s), warn })

  test('αρχική φόρτωση: ο έλεγχος πετάει → το service δημιουργείται σε degraded (σαφές μήνυμα), καμία εγγραφή', () => {
    const { s, broken, writes } = flakyStorage()
    broken.marker = true
    let svc
    assert.doesNotThrow(() => (svc = service(s)))
    const st = svc.getSnapshot()
    assert.equal(st.status, 'degraded')
    assert.match(st.issues.join(' '), /δεν ήταν δυνατός ο έλεγχος/)
    assert.equal(svc.setChecklist('pavlov', [true]), false)
    assert.equal(svc.markCardSeen('fc-freud-1'), false)
    assert.deepEqual(writes, [])
    assert.deepEqual(s.dump(), PROD)
  })

  test('resync: ο έλεγχος πετάει → degraded, χωρίς εξαίρεση', () => {
    const { s, broken } = flakyStorage()
    const svc = service(s)
    assert.equal(svc.getSnapshot().status, 'ready')
    broken.marker = true
    assert.doesNotThrow(() => svc.resync())
    assert.equal(svc.getSnapshot().status, 'degraded')
  })

  test('αποτυχημένη εγγραφή ΚΑΙ αποτυχία του ελέγχου → καμία εξαίρεση, false, degraded, snapshot πριν από την ενέργεια', () => {
    const { s, broken, writes } = flakyStorage()
    const warns = []
    const svc = service(s, (...a) => warns.push(a))
    const before = svc.getSnapshot()
    broken.set = (k) => k === PAVLOV // η εγγραφή αποτυγχάνει…
    broken.marker = true //            …και ο έλεγχος του σημαδιού επίσης
    let r
    assert.doesNotThrow(() => (r = svc.setChecklist('pavlov', [true, true])))
    assert.equal(r, false, 'καμία ψευδής επιτυχία')
    assert.equal(svc.getSnapshot().status, 'degraded')
    assert.deepEqual(svc.getSnapshot().courses.psd115, before.courses.psd115)
    assert.deepEqual(writes, [])
    assert.deepEqual(s.dump(), PROD)
    assert.equal(warns.length, 1)
  })

  test('ο έλεγχος πετάει ενώ η εγγραφή θα πετύχαινε → το backend αρνείται, το service σε degraded (fail-closed), καμία εγγραφή', () => {
    const { s, broken, writes } = flakyStorage()
    const svc = service(s)
    broken.marker = true
    let r
    assert.doesNotThrow(() => (r = svc.markCardSeen('fc-freud-1')))
    assert.equal(r, false)
    assert.equal(svc.getSnapshot().status, 'degraded')
    assert.deepEqual(writes, [])
  })

  test('storage κανονικό: αμετάβλητη συμπεριφορά (ready, εγγραφή, true)', () => {
    const { s, writes } = flakyStorage()
    const svc = service(s)
    assert.equal(svc.setChecklist('pavlov', [true]), true)
    assert.equal(svc.getSnapshot().status, 'ready')
    assert.deepEqual(writes, [PAVLOV])
  })
})
