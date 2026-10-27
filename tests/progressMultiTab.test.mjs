/**
 * Φάση 3 — πολλά tabs (G1–G5).
 *
 *  G1  κάθε ενέργεια υπολογίζεται πάνω στην ΤΡΕΧΟΥΣΑ αποθηκευμένη κατάσταση (φρέσκια ανάγνωση + ίδια επικύρωση με τη φόρτωση)
 *  G2  checklist: refresh → φρέσκα items → toggle → recorder → setChecklist (στο hook· χωρίς updater στο service)
 *  G3  `storage` event → refresh(): μόνο ανάγνωση, notify μόνο όταν αλλάζει πραγματικά το snapshot
 *  G4  η ειδοποίηση αποτυχίας (Φάση 2) δεν εξαφανίζεται ψευδώς
 *  G5  χωρίς cross-tab lock: πραγματικά ανταγωνιστικές εγγραφές μπορούν ακόμα να χάσουν αλλαγή (τεκμηριώνεται εδώ)
 *
 * Δύο «tabs» = δύο ανεξάρτητα ProgressService στο ΙΔΙΟ storage.
 * Tests με `todo` = υλοποιούνται σε επόμενο commit του ίδιου PR (test-first)· το `todo` αφαιρείται εκεί.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProgressService, WRONG_BOOK_LIMIT } from '../src/core/progress/progressService.js'
import { psd115ProgressAdapter as content } from '../src/core/progress/adapters/psd115.js'
import { createLegacyProgressBackend } from '../src/utils/legacyProgressBackend.js'
import { resetProgressSafely } from '../src/utils/progressBackup.js'
import { TXN_KEY } from '../src/utils/progressTransaction.js'
import { normalizeChecklist } from '../src/hooks/useProgress.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROD = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/progress-export.production-2026-10-05.json'), 'utf8')).keys
const STUDY = 'psd115-w1-study'
const PAVLOV = 'psd115-w1-pavlov-checklist'
const BASE = JSON.parse(PROD[STUDY])

function sharedStorage(init = PROD) {
  const m = new Map(Object.entries(init))
  const hooks = { fail: null }
  const writes = []
  return {
    get length() {
      return m.size
    },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem(k, v) {
      const err = hooks.fail?.(k)
      if (err) throw err
      writes.push(k)
      m.set(k, String(v))
    },
    removeItem: (k) => void m.delete(k),
    dump: () => Object.fromEntries(m),
    hooks,
    writes,
  }
}
const tab = (s) => createProgressService({ courseId: 'psd115', content, backend: createLegacyProgressBackend(s), warn: () => {} })
const study = (s) => JSON.parse(s.getItem(STUDY))
const wrong = (uid) => ({ uid, question: 'Q', explanation: 'E', userLabel: 'A', correctLabel: 'B' })
/** Ό,τι κάνει ο setter του useChecklist (G2): refresh → φρέσκα items → toggle → setChecklist. */
function toggle(svc, topicId, index, length = 9) {
  svc.refresh()
  const prev = normalizeChecklist(svc.getSnapshot().courses.psd115.checklists[topicId]?.items, length)
  const items = prev.map((x, i) => (i === index ? !x : x))
  return svc.setChecklist(topicId, items)
}

describe('αναπαραγωγή (αποτυγχάνει στο main): διαδοχικές ενέργειες από δύο tabs χάνονταν', () => {
  test('1) το A απαντά, μετά το B απαντά → μετράνε ΚΑΙ οι δύο', () => {
    const s = sharedStorage()
    const A = tab(s)
    const B = tab(s)
    A.answerQuestion({ questionId: 'q-w2-var-1', ok: true })
    B.answerQuestion({ questionId: 'q-w2-var-2', ok: true })
    assert.equal(study(s).quizAnswered, BASE.quizAnswered + 2)
    assert.equal(study(s).quizCorrect, BASE.quizCorrect + 2)
  })
  test('2) το A βλέπει μία κάρτα, το B άλλη → κρατιούνται ΚΑΙ οι δύο', () => {
    const s = sharedStorage()
    const A = tab(s)
    const B = tab(s)
    A.markCardSeen('fc-freud-1')
    B.markCardSeen('fc-freud-2')
    const seen = study(s).flashcardSeenIds
    assert.ok(seen.includes('fc-freud-1') && seen.includes('fc-freud-2'))
  })
  test('3) ίδιο checklist: το A τσεκάρει το 1ο, το B το 3ο → κρατιούνται ΚΑΙ τα δύο', () => {
    const s = sharedStorage()
    const A = tab(s)
    const B = tab(s)
    toggle(A, 'pavlov', 0)
    toggle(B, 'pavlov', 2)
    const items = JSON.parse(s.getItem(PAVLOV))
    assert.equal(items[0], true)
    assert.equal(items[2], true)
  })
})

describe('G1 · ενέργειες πάνω στην τρέχουσα αποθηκευμένη κατάσταση', () => {
  test('αφαίρεση λάθους στο A + νέο λάθος στο B → ισχύουν και τα δύο', () => {
    const s = sharedStorage()
    const A = tab(s)
    const B = tab(s)
    const existing = A.getSnapshot().courses.psd115.wrongBook[0].uid
    A.removeWrong(existing)
    B.answerQuestion({ questionId: 'q-w2-var-1', ok: false, wrong: wrong('u-b') })
    const uids = study(s).wrongBook.map((w) => w.uid)
    assert.ok(!uids.includes(existing), 'η αφαίρεση του A κρατήθηκε')
    assert.ok(uids.includes('u-b'), 'το λάθος του B κρατήθηκε')
  })
  test(`όριο ${WRONG_BOOK_LIMIT} με λάθη από ΚΑΙ τα δύο tabs: ακριβώς ${WRONG_BOOK_LIMIT}, τα νεότερα`, () => {
    const s = sharedStorage()
    const A = tab(s)
    const B = tab(s)
    for (let i = 0; i < WRONG_BOOK_LIMIT; i++) (i % 2 ? A : B).answerQuestion({ questionId: 'q-w2-var-1', ok: false, wrong: wrong(`u${i}`) })
    const uids = study(s).wrongBook.map((w) => w.uid)
    assert.equal(uids.length, WRONG_BOOK_LIMIT)
    assert.equal(uids.at(-1), `u${WRONG_BOOK_LIMIT - 1}`)
    assert.equal(study(s).quizAnswered, BASE.quizAnswered + WRONG_BOOK_LIMIT)
  })
  test('reset στο A, μετά ενέργεια στο B → εφαρμόζεται πάνω στην κατάσταση ΜΕΤΑ το reset', () => {
    const s = sharedStorage()
    const A = tab(s)
    const B = tab(s)
    resetProgressSafely({ storage: s, download: () => {} })
    A.resync()
    B.answerQuestion({ questionId: 'q-w2-var-1', ok: true })
    assert.equal(study(s).quizAnswered, 1, 'όχι το παλιό σύνολο του B + 1')
    assert.equal(s.getItem(PAVLOV), null, 'το B δεν ξαναγράφει checklist που σβήστηκε')
  })
  test('κατεστραμμένη εγγραφή από άλλο tab → το B περνά σε degraded, false, ΚΑΜΙΑ εγγραφή', () => {
    const s = sharedStorage()
    const B = tab(s)
    s.setItem(STUDY, '{oops')
    s.writes.length = 0
    assert.equal(B.answerQuestion({ questionId: 'q-w2-var-1', ok: true }), false)
    assert.equal(B.getSnapshot().status, 'degraded')
    assert.deepEqual(s.writes, [])
    assert.equal(s.getItem(STUDY), '{oops')
  })
  test('Φάση 2 ισχύει: αποτυχημένη εγγραφή πάνω σε φρέσκο snapshot δεν εφαρμόζεται στη μνήμη', () => {
    const s = sharedStorage()
    const A = tab(s)
    const B = tab(s)
    A.answerQuestion({ questionId: 'q-w2-var-1', ok: true }) // το B είναι πλέον «παλιό»
    s.hooks.fail = (k) => (k === STUDY ? Object.assign(new Error('q'), { name: 'QuotaExceededError' }) : null)
    assert.equal(B.answerQuestion({ questionId: 'q-w2-var-2', ok: true }), false)
    s.hooks.fail = null
    assert.equal(B.getSnapshot().courses.psd115.quizAnswered, BASE.quizAnswered + 1, 'μνήμη = storage (η απάντηση του A), όχι η αποτυχημένη του B')
    assert.equal(B.getSnapshot().writeFailure.kind, 'quota')
    assert.equal(study(s).quizAnswered, BASE.quizAnswered + 1)
  })
})

describe('G3 · refresh(): μόνο ανάγνωση', () => {
  test('άλλο tab άλλαξε την πρόοδο → νέο snapshot, ΕΝΑ notify, καμία εγγραφή', () => {
    const s = sharedStorage()
    const A = tab(s)
    const B = tab(s)
    let n = 0
    B.subscribe(() => n++)
    A.answerQuestion({ questionId: 'q-w2-var-1', ok: true })
    s.writes.length = 0
    assert.equal(B.refresh(), true)
    assert.equal(B.getSnapshot().courses.psd115.quizAnswered, BASE.quizAnswered + 1)
    assert.equal(n, 1)
    assert.deepEqual(s.writes, [])
  })
  test('καμία αλλαγή → ίδιο αντικείμενο, κανένα notify', () => {
    const s = sharedStorage()
    const B = tab(s)
    let n = 0
    B.subscribe(() => n++)
    const before = B.getSnapshot()
    assert.equal(B.refresh(), false)
    assert.equal(B.getSnapshot(), before)
    assert.equal(n, 0)
  })
  test('αλλαγή σε μη-προοδευτικό κλειδί (theme) → το snapshot ίδιο, κανένα notify', () => {
    const s = sharedStorage()
    const B = tab(s)
    let n = 0
    B.subscribe(() => n++)
    const before = B.getSnapshot()
    s.setItem('psd115-w1-theme', 'dark')
    B.refresh()
    assert.equal(B.getSnapshot(), before)
    assert.equal(n, 0)
  })
  test('εκκρεμές σημάδι στο τρέχον storage → degraded (κρίνεται από το storage, όχι από το event)', () => {
    const s = sharedStorage()
    const B = tab(s)
    s.setItem(TXN_KEY, JSON.stringify({ v: 1, op: 'x', before: {}, after: {} }))
    B.refresh()
    assert.equal(B.getSnapshot().status, 'degraded')
  })
  test('σημάδι που ΕΧΕΙ ήδη καθαρίσει όταν τρέχει το refresh → παραμένει ready', () => {
    const s = sharedStorage()
    const B = tab(s)
    s.setItem(TXN_KEY, '{}')
    s.removeItem(TXN_KEY) // π.χ. η ανάκτηση άλλου tab ολοκληρώθηκε πριν από το refresh
    B.refresh()
    assert.equal(B.getSnapshot().status, 'ready')
  })
  test('σε degraded: το refresh δεν κάνει τίποτα (μένει μέχρι το reload)', () => {
    const s = sharedStorage({ ...PROD, [STUDY]: '{oops' })
    const B = tab(s)
    s.setItem(STUDY, PROD[STUDY])
    assert.equal(B.refresh(), false)
    assert.equal(B.getSnapshot().status, 'degraded')
  })
  test('G4: το refresh δεν καθαρίζει την ειδοποίηση αποτυχίας', () => {
    const s = sharedStorage()
    const A = tab(s)
    const B = tab(s)
    s.hooks.fail = () => Object.assign(new Error('q'), { name: 'QuotaExceededError' })
    B.setChecklist('pavlov', [true])
    s.hooks.fail = null
    A.answerQuestion({ questionId: 'q-w2-var-1', ok: true })
    B.refresh()
    assert.equal(B.getSnapshot().writeFailure?.kind, 'quota')
  })
})

describe('G3 · storage listener', { todo: 'Φάση 3 listener' }, () => {
  const load = () => import('../src/utils/progressSync.js')
  const fakeService = () => {
    let calls = 0
    return { refresh: () => calls++, calls: () => calls }
  }
  const evt = (key, storageArea) => Object.assign(new Event('storage'), { key, storageArea })
  test('κλειδιά προόδου, σημάδι συναλλαγής και clear() (key null) → refresh', async () => {
    const { installStorageSync } = await load()
    const target = new EventTarget()
    const storage = {}
    const svc = fakeService()
    installStorageSync(svc, { target, storage })
    for (const key of [STUDY, PAVLOV, 'psd115-w4-checklists', TXN_KEY, null]) target.dispatchEvent(evt(key, storage))
    assert.equal(svc.calls(), 5)
  })
  test('άσχετα κλειδιά (backups, νέο store) ή άλλο storage area → κανένα refresh', async () => {
    const { installStorageSync } = await load()
    const target = new EventTarget()
    const storage = {}
    const svc = fakeService()
    installStorageSync(svc, { target, storage })
    for (const key of ['psd115-backup-2026', 'study-progress-events-v1', 'other-app']) target.dispatchEvent(evt(key, storage))
    target.dispatchEvent(evt(STUDY, { other: true })) // sessionStorage κ.λπ.
    assert.equal(svc.calls(), 0)
  })
  test('unsubscribe → κανένα refresh μετά', async () => {
    const { installStorageSync } = await load()
    const target = new EventTarget()
    const storage = {}
    const svc = fakeService()
    const off = installStorageSync(svc, { target, storage })
    off()
    target.dispatchEvent(evt(STUDY, storage))
    assert.equal(svc.calls(), 0)
  })
})

describe('G2 / G5 · guards στον κώδικα', () => {
  const src = (f) => fs.readFileSync(path.join(root, f), 'utf8')
  test('useChecklist: refresh ΠΡΙΝ από τον υπολογισμό, recorder ΠΡΙΝ από το setChecklist', { todo: 'Φάση 3 hook' }, () => {
    const code = src('src/hooks/useProgress.js')
    const r = code.indexOf('service.refresh()')
    const prev = code.indexOf('normalizeChecklist(service.getSnapshot()')
    const rec = code.indexOf('recordChecklist(')
    const set = code.indexOf('service.setChecklist(')
    assert.ok(r > 0 && r < prev && prev < rec && rec < set, `σειρά: refresh ${r} < prev ${prev} < recorder ${rec} < setChecklist ${set}`)
  })
  test('main.jsx εγκαθιστά τον storage listener', { todo: 'Φάση 3 listener' }, () => {
    assert.match(src('src/main.jsx'), /installStorageSync\(progressService/)
  })
  test('G5: τεκμηριωμένος υπολειπόμενος κίνδυνος (χωρίς cross-tab lock)', { todo: 'Φάση 3 docs' }, () => {
    const doc = src('docs/progress-migration.md')
    assert.match(doc, /## 17\./)
    assert.match(doc, /ανταγωνιστικ/)
    assert.doesNotMatch(doc.slice(doc.indexOf('## 17.')), /1 ms/)
  })
})
