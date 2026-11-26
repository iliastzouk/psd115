/**
 * Φάση 3 — πολλά tabs (G1–G5), μεταφερμένα στη νέα υποδομή (Φάση 6a).
 *
 *  G1  κάθε ενέργεια υπολογίζεται πάνω στην ΤΡΕΧΟΥΣΑ αποθηκευμένη κατάσταση (φρέσκια ανάγνωση + ίδια επικύρωση με τη φόρτωση)
 *  G2  checklist: refresh → φρέσκα items → toggle → forCourse().setChecklist (στο hook)
 *  G3  `storage` event → refresh(): μόνο ανάγνωση, notify μόνο όταν αλλάζει πραγματικά το snapshot
 *  G4  η ειδοποίηση αποτυχίας (Φάση 2) δεν εξαφανίζεται ψευδώς
 *  G5  χωρίς cross-tab lock: πραγματικά ταυτόχρονες εγγραφές μπορούν ακόμα να χάσουν αλλαγή (τεκμηριώνεται)
 *
 * Δύο «tabs» = δύο ανεξάρτητα ProgressService στο ΙΔΙΟ storage.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { TXN_KEY } from '../src/core/progress/transaction.js'
import { WRONG_BOOK_LIMIT } from '../src/core/progress/courseProgress.js'
import { applyChecklistUpdate } from '../src/hooks/useProgress.js'
import { resetCourseSafely } from '../src/utils/studyProgressBackup.js'
import { ALL_ADAPTERS, EVENTS_KEY, STATE_KEY, T0, fakeStorage, readEvents, readState, service } from './helpers/progressFixtures.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const tab = (s) => service(s)
const wrong = (uid) => ({ uid, question: 'Q', explanation: 'E', userLabel: 'A', correctLabel: 'B' })
const snap = (svc, c = 'psd115') => svc.getSnapshot().courses[c]
/** Ο ΠΡΑΓΜΑΤΙΚΟΣ setter του useChecklist (G2), με toggle όπως τα lessons. */
const toggle = (svc, topicId, index, length = 9) =>
  applyChecklistUpdate({ service: svc, courseId: 'psd115', topicId, length, next: (prev) => prev.map((x, i) => (i === index ? !x : x)) })
const quota = () => Object.assign(new Error('q'), { name: 'QuotaExceededError' })

describe('διαδοχικές ενέργειες από δύο tabs: κρατιούνται όλες', () => {
  test('1) το A απαντά, μετά το B απαντά → μετράνε ΚΑΙ οι δύο', () => {
    const s = fakeStorage()
    const A = tab(s)
    const B = tab(s)
    A.forCourse('psd115').answerQuestion({ questionId: 'q-w2-var-1', ok: true })
    B.forCourse('psd115').answerQuestion({ questionId: 'q-w2-var-2', ok: true })
    assert.equal(readEvents(s).length, 2)
    assert.equal(snap(tab(s)).quizCorrect, 2)
  })
  test('2) το A βλέπει μία κάρτα, το B άλλη → κρατιούνται ΚΑΙ οι δύο', () => {
    const s = fakeStorage()
    const A = tab(s)
    const B = tab(s)
    A.forCourse('psd115').markCardSeen('fc-freud-1')
    B.forCourse('psd115').markCardSeen('fc-freud-2')
    assert.deepEqual(snap(tab(s)).flashcardSeenIds, ['psd115/fc-freud-1', 'psd115/fc-freud-2'])
  })
  test('3) ίδιο checklist: το A τσεκάρει το 1ο, το B το 3ο → κρατιούνται ΚΑΙ τα δύο', () => {
    const s = fakeStorage()
    const A = tab(s)
    const B = tab(s)
    toggle(A, 'pavlov', 0)
    toggle(B, 'pavlov', 2)
    const items = readState(s)['progress:checklists:psd115'].topics.pavlov.items
    assert.deepEqual([items[0], items[2]], [true, true])
  })
})

describe('G1 · ενέργειες πάνω στην τρέχουσα αποθηκευμένη κατάσταση', () => {
  test('αφαίρεση λάθους στο A + νέο λάθος στο B → ισχύουν και τα δύο', () => {
    const s = fakeStorage()
    tab(s).forCourse('psd115').answerQuestion({ questionId: 'q-w2-var-1', ok: false, wrong: wrong('u-a') })
    const A = tab(s)
    const B = tab(s)
    A.forCourse('psd115').removeWrong('u-a')
    B.forCourse('psd115').answerQuestion({ questionId: 'q-w2-var-1', ok: false, wrong: wrong('u-b') })
    assert.deepEqual(snap(tab(s)).wrongBook.map((w) => w.uid), ['u-b'])
  })
  test(`όριο ${WRONG_BOOK_LIMIT} με λάθη από ΚΑΙ τα δύο tabs: ακριβώς ${WRONG_BOOK_LIMIT}, τα νεότερα`, () => {
    const s = fakeStorage()
    const A = tab(s)
    const B = tab(s)
    for (let i = 0; i < WRONG_BOOK_LIMIT + 3; i++) (i % 2 ? A : B).forCourse('psd115').answerQuestion({ questionId: 'q-w2-var-1', ok: false, wrong: wrong(`u${String(i).padStart(3, '0')}`) })
    const uids = snap(tab(s)).wrongBook.map((w) => w.uid)
    assert.equal(uids.length, WRONG_BOOK_LIMIT)
    assert.equal(uids.at(-1), `u${String(WRONG_BOOK_LIMIT + 2).padStart(3, '0')}`)
    assert.equal(snap(tab(s)).quizAnswered, WRONG_BOOK_LIMIT + 3)
  })
  test('reset στο A, μετά ενέργεια στο B → εφαρμόζεται πάνω στην κατάσταση ΜΕΤΑ το reset', () => {
    const s = fakeStorage()
    const A = tab(s)
    const B = tab(s)
    A.forCourse('psd115').answerQuestion({ questionId: 'q-w2-var-1', ok: true })
    toggle(A, 'pavlov', 0)
    resetCourseSafely({ courseId: 'psd115', adapters: ALL_ADAPTERS, storage: s, download: () => {}, now: () => T0 })
    A.resync()
    B.forCourse('psd115').answerQuestion({ questionId: 'q-w2-var-2', ok: true })
    assert.equal(snap(tab(s)).quizAnswered, 1, 'μόνο η απάντηση μετά το reset')
    assert.deepEqual(snap(tab(s)).checklists, {}, 'το B δεν ξαναφέρνει checklist του πριν')
  })
  test('κατεστραμμένη εγγραφή από άλλο tab → το B περνά σε degraded, false, ΚΑΜΙΑ εγγραφή', () => {
    const s = fakeStorage()
    const B = tab(s)
    s.setItem(EVENTS_KEY, '{oops')
    s.writes.length = 0
    assert.equal(B.forCourse('psd115').answerQuestion({ questionId: 'q-w2-var-1', ok: true }), false)
    assert.equal(B.getSnapshot().status, 'degraded')
    assert.deepEqual(s.writes, [])
    assert.equal(s.getItem(EVENTS_KEY), '{oops')
  })
  test('Φάση 2 ισχύει: αποτυχημένη εγγραφή πάνω σε φρέσκο snapshot δεν εφαρμόζεται στη μνήμη', () => {
    const s = fakeStorage()
    const A = tab(s)
    const B = tab(s)
    A.forCourse('psd115').answerQuestion({ questionId: 'q-w2-var-1', ok: true }) // το B είναι πλέον «παλιό»
    s.hooks.fail = (k) => (k === EVENTS_KEY ? quota() : null)
    assert.equal(B.forCourse('psd115').answerQuestion({ questionId: 'q-w2-var-2', ok: true }), false)
    s.hooks.fail = null
    assert.equal(snap(B).quizAnswered, 1, 'μνήμη = storage (η απάντηση του A), όχι η αποτυχημένη του B')
    assert.equal(B.getSnapshot().writeFailure.kind, 'quota')
  })
})

describe('G2 · checklist στο hook (applyChecklistUpdate)', () => {
  test('το B βλέπει το τσεκ του A πριν από το δικό του (φρέσκα items)', () => {
    const s = fakeStorage()
    const A = tab(s)
    const B = tab(s)
    toggle(A, 'pavlov', 0)
    toggle(B, 'pavlov', 2)
    assert.deepEqual(snap(B).checklists.pavlov.items.slice(0, 3), [true, false, true])
  })
  test('η φρέσκια ανάγνωση αποτυγχάνει μέσα στον setter → καμία εγγραφή, false', () => {
    for (const [label, breakIt] of [
      ['κατεστραμμένη πρόοδος από άλλο tab', (s) => s.setItem(STATE_KEY, '{oops')],
      ['εκκρεμές σημάδι από άλλο tab', (s) => s.setItem(TXN_KEY, JSON.stringify({ v: 1, op: 'x', before: {}, after: {} }))],
    ]) {
      const s = fakeStorage()
      const B = tab(s)
      breakIt(s)
      const before = s.dump()
      s.writes.length = 0
      assert.equal(toggle(B, 'pavlov', 0), false, label)
      assert.deepEqual(s.writes, [], `${label}: καμία εγγραφή`)
      assert.deepEqual(s.dump(), before)
      assert.equal(B.getSnapshot().status, 'degraded')
    }
  })
  test('μάθημα που δεν εξυπηρετεί το service → τίποτα (ούτε refresh)', () => {
    const s = fakeStorage()
    const svc = tab(s)
    let refreshed = 0
    const spy = { ...svc, refresh: () => void refreshed++ }
    assert.equal(applyChecklistUpdate({ service: spy, courseId: 'psd200', topicId: 'pavlov', length: 9, next: (p) => p }), false)
    assert.deepEqual([refreshed, s.writes], [0, []])
  })
})

describe('G3 · refresh(): μόνο ανάγνωση', () => {
  test('άλλο tab άλλαξε την πρόοδο → νέο snapshot, ΕΝΑ notify, καμία εγγραφή', () => {
    const s = fakeStorage()
    const A = tab(s)
    const B = tab(s)
    let n = 0
    B.subscribe(() => n++)
    A.forCourse('psd115').answerQuestion({ questionId: 'q-w2-var-1', ok: true })
    s.writes.length = 0
    assert.equal(B.refresh(), true)
    assert.equal(snap(B).quizAnswered, 1)
    assert.equal(n, 1)
    assert.deepEqual(s.writes, [])
  })
  test('καμία αλλαγή → ίδιο αντικείμενο, κανένα notify', () => {
    const B = tab(fakeStorage())
    let n = 0
    B.subscribe(() => n++)
    const before = B.getSnapshot()
    assert.equal(B.refresh(), false)
    assert.equal(B.getSnapshot(), before)
    assert.equal(n, 0)
  })
  test('αλλαγή σε κλειδί ρυθμίσεων (theme) ή legacy → το snapshot ίδιο, κανένα notify', () => {
    const s = fakeStorage()
    const B = tab(s)
    let n = 0
    B.subscribe(() => n++)
    const before = B.getSnapshot()
    s.setItem('psd115-w1-theme', 'dark')
    s.setItem('psd115-w1-study', '{}')
    B.refresh()
    assert.equal(B.getSnapshot(), before)
    assert.equal(n, 0)
  })
  test('εκκρεμές σημάδι στο τρέχον storage → degraded', () => {
    const s = fakeStorage()
    const B = tab(s)
    s.setItem(TXN_KEY, JSON.stringify({ v: 1, op: 'x', before: {}, after: {} }))
    B.refresh()
    assert.equal(B.getSnapshot().status, 'degraded')
  })
  test('σημάδι που ΕΧΕΙ ήδη καθαρίσει όταν τρέχει το refresh → παραμένει ready', () => {
    const s = fakeStorage()
    const B = tab(s)
    s.setItem(TXN_KEY, '{}')
    s.removeItem(TXN_KEY)
    B.refresh()
    assert.equal(B.getSnapshot().status, 'ready')
  })
  test('σε degraded: το refresh δεν κάνει τίποτα (μένει μέχρι το reload ή resync)', () => {
    const s = fakeStorage({ [EVENTS_KEY]: '{oops' })
    const B = tab(s)
    s.setItem(EVENTS_KEY, '[]')
    assert.equal(B.refresh(), false)
    assert.equal(B.getSnapshot().status, 'degraded')
  })
  test('G4: το refresh δεν καθαρίζει την ειδοποίηση αποτυχίας', () => {
    const s = fakeStorage()
    const A = tab(s)
    const B = tab(s)
    s.hooks.fail = () => quota()
    B.forCourse('psd115').setChecklist('pavlov', [true])
    s.hooks.fail = null
    A.forCourse('psd115').answerQuestion({ questionId: 'q-w2-var-1', ok: true })
    B.refresh()
    assert.equal(B.getSnapshot().writeFailure?.kind, 'quota')
  })
})

describe('G3 · storage listener', () => {
  const load = () => import('../src/utils/progressSync.js')
  const fakeService = () => {
    let calls = 0
    return { refresh: () => calls++, calls: () => calls }
  }
  const evt = (key, storageArea) => Object.assign(new Event('storage'), { key, storageArea })
  test('τα δύο κλειδιά του store, σημάδι συναλλαγής και clear() (key null) → refresh', async () => {
    const { installStorageSync } = await load()
    const target = new EventTarget()
    const storage = {}
    const svc = fakeService()
    installStorageSync(svc, { target, storage })
    for (const key of [EVENTS_KEY, STATE_KEY, TXN_KEY, null]) target.dispatchEvent(evt(key, storage))
    assert.equal(svc.calls(), 4)
  })
  test('άσχετα κλειδιά (legacy psd115-*, backups, ρυθμίσεις) ή άλλο storage area → κανένα refresh', async () => {
    const { installStorageSync } = await load()
    const target = new EventTarget()
    const storage = {}
    const svc = fakeService()
    installStorageSync(svc, { target, storage })
    for (const key of ['psd115-w1-study', 'psd115-w1-theme', 'study-progress-backup-2026', 'other-app']) target.dispatchEvent(evt(key, storage))
    target.dispatchEvent(evt(EVENTS_KEY, { other: true }))
    assert.equal(svc.calls(), 0)
  })
  test('unsubscribe → κανένα refresh μετά', async () => {
    const { installStorageSync } = await load()
    const target = new EventTarget()
    const storage = {}
    const svc = fakeService()
    const off = installStorageSync(svc, { target, storage })
    off()
    target.dispatchEvent(evt(EVENTS_KEY, storage))
    assert.equal(svc.calls(), 0)
  })
})

describe('guards στον κώδικα', () => {
  const src = (f) => fs.readFileSync(path.join(root, f), 'utf8')
  test('useChecklist: supports → refresh → φρέσκα items → forCourse().setChecklist', () => {
    const code = src('src/hooks/useProgress.js')
    const order = ['service.supports(courseId)', 'service.refresh()', 'normalizeChecklist(course.checklists', 'service.forCourse(courseId).setChecklist(']
    const at = order.map((x) => code.indexOf(x))
    assert.ok(at.every((x, i) => x > 0 && (i === 0 || x > at[i - 1])), `σειρά ${at}`)
    assert.match(code, /\(next\) => applyChecklistUpdate\(\{ service: getProgressService\(\)/, 'ο setter του hook είναι η applyChecklistUpdate')
  })
  test('main.jsx εγκαθιστά τον storage listener', () => {
    assert.match(src('src/main.jsx'), /installStorageSync\(progressService/)
  })
  test('G5: τεκμηριωμένος υπολειπόμενος κίνδυνος (χωρίς cross-tab lock) στην ενεργή τεκμηρίωση', () => {
    const doc = src('docs/progress.md')
    const at = doc.indexOf('## Υπολειπόμενος κίνδυνος: ταυτόχρονα tabs (χωρίς cross-tab lock)')
    assert.ok(at >= 0, 'λείπει η ενότητα του υπολειπόμενου κινδύνου')
    const body = doc.slice(at).split('\n## ')[0].split('\n').slice(1).join('\n') // χωρίς τον τίτλο
    assert.match(body, /cross-tab lock/)
    assert.match(body, /ταυτόχρονες εγγραφές[\s\S]*χάσουν μία αλλαγή/)
    // Το ιστορικό σχέδιο μένει διαθέσιμο, αμετάβλητο, στο docs/history/.
    assert.match(src('docs/history/progress-migration.md'), /## 20\. Νέα υποδομή ως ενεργή πηγή προόδου/)
  })
})
