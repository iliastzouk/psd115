/**
 * Φάση 2 — αποτυχίες αποθήκευσης ΧΩΡΙΣ εκκρεμές σημάδι συναλλαγής (E1–E4).
 *
 *  - E1(α): η αλλαγή που δεν αποθηκεύτηκε ΔΕΝ εφαρμόζεται στη μνήμη· `false`· `ready`· μνήμη ≡ storage.
 *  - Η επόμενη ενέργεια αποθηκεύει ΜΟΝΟ τη δική της αλλαγή (καμία αυτόματη επανάληψη της αποτυχημένης).
 *  - E2: `writeFailure: { at, kind: 'quota' | 'other' } | null`· καθαρίζει ΜΟΝΟ με πραγματικά επιτυχημένη εγγραφή ή ρητή
 *    απόρριψη (που ΔΕΝ σημαίνει ότι η αλλαγή σώθηκε)· no-op ενέργεια δεν το καθαρίζει.
 *  - `quota` μόνο από αναγνωρίσιμα στοιχεία του σφάλματος (name/code), ποτέ από το κείμενο· τυλιγμένα σφάλματα
 *    συναλλαγής (`not-started` / `rolled-back`) → `other`.
 *  - Προγραμματιστικά σφάλματα (άκυρο θέμα κ.λπ.) εξακολουθούν να πετούν.
 *  - E3: shadow event χωρίς legacy εγγραφή → το reconciliation το δείχνει (diverged).
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProgressService } from '../src/core/progress/progressService.js'
import { psd115ProgressAdapter as content } from '../src/core/progress/adapters/psd115.js'
import { createLegacyProgressBackend } from '../src/utils/legacyProgressBackend.js'
import { ProgressTransactionError, TXN_KEY } from '../src/utils/progressTransaction.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROD = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/progress-export.production-2026-10-05.json'), 'utf8')).keys
const PAVLOV = 'psd115-w1-pavlov-checklist'
const STUDY = 'psd115-w1-study'
const T0 = Date.UTC(2026, 9, 28, 9, 0, 0)

function fakeStorage(init = PROD) {
  const m = new Map(Object.entries(init))
  const hooks = { fail: null }
  return {
    get length() {
      return m.size
    },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem(k, v) {
      const err = hooks.fail?.(k)
      if (err) throw err
      m.set(k, String(v))
    },
    removeItem: (k) => void m.delete(k),
    dump: () => Object.fromEntries(m),
    hooks,
  }
}
const quota = () => Object.assign(new Error('The quota has been exceeded.'), { name: 'QuotaExceededError', code: 22 })
function app(s = fakeStorage(), { now = () => T0 } = {}) {
  const svc = createProgressService({ courseId: 'psd115', content, backend: createLegacyProgressBackend(s), now, warn: () => {} })
  let notifications = 0
  svc.subscribe(() => notifications++)
  return { s, svc, notified: () => notifications }
}
const course = (svc) => svc.getSnapshot().courses.psd115

describe('αναπαραγωγή του ελαττώματος (πρέπει να αποτυγχάνει στο main, να περνά μετά)', () => {
  test('αποτυχία checklist (quota) → μετά από επόμενη επιτυχημένη εγγραφή, μνήμη ≡ storage', { todo: 'Φάση 2 service' }, () => {
    const { s, svc } = app()
    s.hooks.fail = (k) => (k === PAVLOV ? quota() : null)
    svc.setChecklist('pavlov', [true, true, true])
    s.hooks.fail = null
    svc.markCardSeen('fc-freud-1')
    assert.deepEqual(course(svc).checklists.pavlov.items, JSON.parse(s.getItem(PAVLOV)), 'η μνήμη δεν δείχνει μη αποθηκευμένη αλλαγή')
  })
})

describe('E1(α) · η αλλαγή που δεν αποθηκεύτηκε δεν εφαρμόζεται', { todo: 'Φάση 2 service' }, () => {
  test('ένα κλειδί (quota) → false, snapshot ΙΔΙΟ, ready, writeFailure quota, storage ανέγγιχτο, ένα notify', () => {
    const { s, svc, notified } = app()
    const before = course(svc)
    s.hooks.fail = (k) => (k === PAVLOV ? quota() : null)
    assert.equal(svc.setChecklist('pavlov', [true, true]), false)
    assert.equal(course(svc), before, 'το snapshot του μαθήματος είναι το ίδιο αντικείμενο')
    assert.equal(svc.getSnapshot().status, 'ready')
    assert.deepEqual(svc.getSnapshot().writeFailure, { at: T0, kind: 'quota' })
    assert.deepEqual(s.dump(), PROD)
    assert.equal(notified(), 1)
  })
  test('απάντηση κουίζ (κλειδί study) → μετρητές και wrongBook αμετάβλητοι', () => {
    const { s, svc } = app()
    const before = course(svc)
    s.hooks.fail = (k) => (k === STUDY ? quota() : null)
    assert.equal(svc.answerQuestion({ questionId: 'q-w2-var-1', ok: false, wrong: { uid: 'u1', question: 'Q', explanation: 'E', userLabel: 'A', correctLabel: 'B' } }), false)
    assert.equal(course(svc), before)
    assert.equal(s.getItem(STUDY), PROD[STUDY])
  })
})

describe('E2 · ταξινόμηση από αναγνωρίσιμα στοιχεία του σφάλματος, όχι από κείμενο', { todo: 'Φάση 2 service' }, () => {
  const CASES = {
    'QuotaExceededError (name)': [Object.assign(new Error('x'), { name: 'QuotaExceededError' }), 'quota'],
    'Firefox NS_ERROR_DOM_QUOTA_REACHED (name)': [Object.assign(new Error('x'), { name: 'NS_ERROR_DOM_QUOTA_REACHED' }), 'quota'],
    'DOMException code 22': [Object.assign(new Error('x'), { name: 'Error', code: 22 }), 'quota'],
    'κείμενο «quota» χωρίς αναγνωρίσιμο name/code': [new Error('quota exceeded'), 'other'],
    'SecurityError': [Object.assign(new Error('denied'), { name: 'SecurityError' }), 'other'],
  }
  for (const [label, [err, kind]] of Object.entries(CASES)) {
    test(`${label} → ${kind}`, () => {
      const { s, svc } = app()
      s.hooks.fail = (k) => (k === PAVLOV ? err : null)
      assert.equal(svc.setChecklist('pavlov', [true]), false)
      assert.equal(svc.getSnapshot().writeFailure.kind, kind)
    })
  }
  for (const outcome of ['not-started', 'rolled-back']) {
    test(`τυλιγμένο σφάλμα συναλλαγής (${outcome}, χωρίς σημάδι) → other, ready, false`, () => {
      const s = fakeStorage()
      const real = createLegacyProgressBackend(s)
      const backend = { ...real, write: () => { throw new ProgressTransactionError('x', outcome) } }
      const svc = createProgressService({ courseId: 'psd115', content, backend, now: () => T0, warn: () => {} })
      const before = course(svc)
      assert.equal(svc.setChecklist('pavlov', [true]), false)
      assert.equal(course(svc), before)
      assert.deepEqual(svc.getSnapshot().writeFailure, { at: T0, kind: 'other' })
      assert.equal(svc.getSnapshot().status, 'ready')
    })
  }
})

describe('ανάκαμψη και διάρκεια της ειδοποίησης', { todo: 'Φάση 2 service' }, () => {
  test('επόμενη επιτυχημένη ενέργεια: γράφει ΜΟΝΟ τη δική της αλλαγή (καμία αυτόματη επανάληψη) και καθαρίζει το writeFailure', () => {
    const { s, svc } = app()
    s.hooks.fail = (k) => (k === PAVLOV ? quota() : null)
    svc.setChecklist('pavlov', [true, true, true])
    s.hooks.fail = null
    assert.equal(svc.markCardSeen('fc-freud-1'), true)
    assert.equal(svc.getSnapshot().writeFailure, null)
    assert.equal(s.getItem(PAVLOV), PROD[PAVLOV], 'η αποτυχημένη αλλαγή ΔΕΝ επαναλήφθηκε')
    assert.ok(JSON.parse(s.getItem(STUDY)).flashcardSeenIds.includes('fc-freud-1'))
    assert.equal(svc.setChecklist('pavlov', [true, true, true]), true, 'ο χρήστης την επαναλαμβάνει → σώζεται')
    assert.deepEqual(JSON.parse(s.getItem(PAVLOV)).slice(0, 3), [true, true, true])
  })
  test('no-op ενέργεια (ίδιο checklist / κάρτα που ήδη είδε) ΔΕΝ καθαρίζει το writeFailure', () => {
    const { s, svc } = app()
    svc.markCardSeen('fc-freud-1')
    s.hooks.fail = () => quota()
    svc.setChecklist('pavlov', [true])
    const failure = svc.getSnapshot().writeFailure
    s.hooks.fail = null
    assert.equal(svc.markCardSeen('fc-freud-1'), false, 'no-op')
    assert.equal(svc.getSnapshot().writeFailure, failure)
  })
  test('διαδοχικές αποτυχίες → το writeFailure ανανεώνεται (νέο at)', () => {
    let t = T0
    const { s, svc } = app(fakeStorage(), { now: () => t })
    s.hooks.fail = () => quota()
    svc.setChecklist('pavlov', [true])
    t += 5000
    svc.markCardSeen('fc-freud-1')
    assert.deepEqual(svc.getSnapshot().writeFailure, { at: T0 + 5000, kind: 'quota' })
  })
  test('dismissWriteFailure: κρύβει την ειδοποίηση· snapshot και storage ΑΜΕΤΑΒΛΗΤΑ (δεν σημαίνει ότι σώθηκε)', () => {
    const { s, svc, notified } = app()
    s.hooks.fail = () => quota()
    svc.setChecklist('pavlov', [true])
    const before = course(svc)
    const dump = s.dump()
    svc.dismissWriteFailure()
    assert.equal(svc.getSnapshot().writeFailure, null)
    assert.equal(course(svc), before)
    assert.deepEqual(s.dump(), dump)
    const n = notified()
    svc.dismissWriteFailure()
    assert.equal(notified(), n, 'χωρίς ειδοποίηση: κανένα notify')
  })
  test('χωρίς αποτυχία: writeFailure null από την αρχή, κανονική εγγραφή', () => {
    const { s, svc } = app()
    assert.equal(svc.getSnapshot().writeFailure, null)
    assert.equal(svc.setChecklist('pavlov', [true]), true)
    assert.equal(JSON.parse(s.getItem(PAVLOV))[0], true)
  })
})

describe('όρια της αλλαγής', () => {
  test('εκκρεμές σημάδι → εξακολουθεί να ισχύει το degraded (Φάση 1E-4c-2), όχι writeFailure', () => {
    const s = fakeStorage()
    const svc = createProgressService({ courseId: 'psd115', content, backend: createLegacyProgressBackend(s), warn: () => {} })
    s.setItem(TXN_KEY, JSON.stringify({ v: 1, op: 'x', before: {}, after: {} }))
    assert.equal(svc.setChecklist('pavlov', [true]), false)
    assert.equal(svc.getSnapshot().status, 'degraded')
  })
  test('προγραμματιστικό σφάλμα (άγνωστο θέμα) εξακολουθεί να πετά — δεν κρύβεται ως αποτυχία αποθήκευσης', () => {
    const { svc } = app()
    assert.throws(() => svc.setChecklist('δεν-υπάρχει', [true]), /άγνωστο θέμα/)
  })
})

describe('E2 · κείμενα ειδοποίησης (ακριβή)', { todo: 'Φάση 2 UI' }, () => {
  test('quota / other', async () => {
    const { describeWriteFailure } = await import('../src/utils/progressFailureMessage.js')
    assert.equal(
      describeWriteFailure('quota'),
      'Η τελευταία αλλαγή δεν αποθηκεύτηκε: ο χώρος αποθήκευσης του browser φαίνεται γεμάτος. Ελευθέρωσε χώρο και επανάλαβε την ενέργεια.',
    )
    assert.equal(
      describeWriteFailure('other'),
      'Η τελευταία αλλαγή δεν αποθηκεύτηκε. Η μελέτη συνεχίζεται, αλλά η αλλαγή αυτή δεν θα επαναληφθεί αυτόματα. Επανέλαβέ την όταν η αποθήκευση λειτουργεί κανονικά.',
    )
  })
})

describe('E3 · shadow event χωρίς legacy εγγραφή → ανιχνεύσιμη απόκλιση', async () => {
  const { activateShadow, shadowReconciliation } = await import('../src/utils/progressMigration.js')
  const { createShadowRecorder } = await import('../src/utils/progressShadow.js')
  test('ο recorder γράφει (πριν από το service), το legacy αποτυγχάνει (quota) → reconciliation diverged, όχι in-sync', async () => {
    const s = fakeStorage()
    assert.equal((await activateShadow({ storage: s, now: () => T0, backup: () => {}, content })).status, 'active')
    const svc = createProgressService({ courseId: 'psd115', content, backend: createLegacyProgressBackend(s), warn: () => {} })
    const rec = createShadowRecorder({ courseId: 'psd115', content, storage: s, now: () => T0 + 1000, enabled: true, isActive: () => svc.getSnapshot().status === 'ready', warn: () => {} })
    await rec.recordFlashcardSeen({ cardId: 'fc-freud-1' })
    s.hooks.fail = (k) => (k === STUDY ? quota() : null)
    svc.markCardSeen('fc-freud-1')
    s.hooks.fail = null
    const r = await shadowReconciliation({ storage: s, content })
    assert.equal(r.status, 'diverged')
    assert.deepEqual(Object.keys(r.report.diff), ['flashcardSeenIds'])
  })
})
