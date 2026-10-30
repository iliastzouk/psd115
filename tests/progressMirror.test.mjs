/**
 * Phase 1E-4c-2 — mirror wrongBook / checklists στο shadow store (G2–G9, G11).
 *
 * Κάθε ενέργεια εκτελείται όπως στον handler της εφαρμογής: πρώτα ο shadow recorder, μετά το ProgressService
 * (legacy backend στο ΙΔΙΟ storage). Μετά από ΚΑΘΕ ενέργεια το reconciliation (πλήρες snapshot) πρέπει να είναι in-sync.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { quizQuestions } from '../content/courses/psd115/questions.js'
import { newEventId } from '../src/core/progress/events.js'
import { LEGACY_BASELINE_KEY, MIGRATION_MARKER_KEY, RESET_MARKER_KEY, SHADOW_STATE_KEY } from '../src/core/progress/keys.js'
import { checklistsStateKey, wrongBookStateKey } from '../src/core/progress/namespaces.js'
import { createProgressService, WRONG_BOOK_LIMIT } from '../src/core/progress/progressService.js'
import { EVENTS_KEY, STATE_KEY } from '../src/core/progress/progressStore.js'
import { psd115ProgressAdapter as content } from '../src/core/progress/adapters/psd115.js'
import { resetProgressSafely } from '../src/utils/progressBackup.js'
import { createLegacyProgressBackend } from '../src/utils/legacyProgressBackend.js'
import { activateShadow, deactivateShadow, shadowReconciliation } from '../src/utils/progressMigration.js'
import { createShadowRecorder } from '../src/utils/progressShadow.js'
import { recoverInterrupted, TXN_KEY } from '../src/core/progress/transaction.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROD = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/progress-export.production-2026-10-05.json'), 'utf8')).keys
const T0 = Date.UTC(2026, 9, 21, 9, 0, 0)
const WB = wrongBookStateKey('psd115')
const CL = checklistsStateKey('psd115')

function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init))
  let failSet = null
  const log = { reads: [], writes: [] }
  return {
    get length() {
      return m.size
    },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => {
      log.reads.push(k)
      return m.has(k) ? m.get(k) : null
    },
    setItem(k, v) {
      if (failSet?.(k)) throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' })
      log.writes.push(k)
      m.set(k, String(v))
    },
    removeItem: (k) => void m.delete(k),
    dump: () => Object.fromEntries(m),
    log,
    fail(fn) {
      failSet = fn
    },
  }
}
const stateOf = (s) => JSON.parse(s.getItem(STATE_KEY) ?? '{}')
const eventsOf = (s) => JSON.parse(s.getItem(EVENTS_KEY) ?? '[]')
const noDownload = () => {}
const Q = (i) => quizQuestions[i]

/** Η «εφαρμογή»: ένα ProgressService (legacy) + ένας recorder, στο ίδιο storage, με τη σειρά των handlers. */
function app(s, { enabled = true } = {}) {
  let clock = T0 + 1000
  const now = () => (clock += 1000)
  const service = createProgressService({ courseId: 'psd115', content, backend: createLegacyProgressBackend(s) })
  const rec = createShadowRecorder({
    courseId: 'psd115',
    content,
    storage: s,
    now,
    enabled,
    isActive: () => service.getSnapshot().status === 'ready',
    warn: () => {},
  })
  return {
    service,
    rec,
    answer(q, ok) {
      const wrong = ok ? undefined : { uid: newEventId(), question: q.question, explanation: q.explanation, userLabel: q.options[q.correctIndex === 0 ? 1 : 0], correctLabel: q.options[q.correctIndex] }
      const p = rec.recordQuizAnswer({ questionId: q.id, ok, wrong })
      service.answerQuestion({ questionId: q.id, ok, wrong })
      return p
    },
    card(cardId) {
      const p = rec.recordFlashcardSeen({ cardId })
      service.markCardSeen(cardId)
      return p
    },
    remove(uid) {
      const p = rec.recordWrongBookRemove({ uid })
      service.removeWrong(uid)
      return p
    },
    clear() {
      const p = rec.recordWrongBookClear()
      service.clearWrongBook()
      return p
    },
    checklist(topicId, items) {
      const p = rec.recordChecklist({ topicId, items })
      service.setChecklist(topicId, items)
      return p
    },
    reset() {
      resetProgressSafely({ storage: s, download: noDownload, now })
      service.resync()
    },
  }
}

async function activated(init = PROD) {
  const s = fakeStorage({ ...init })
  const r = await activateShadow({ storage: s, now: () => T0, backup: () => {}, content })
  assert.equal(r.status, 'active', JSON.stringify(r))
  return s
}
async function assertInSync(s, label) {
  const r = await shadowReconciliation({ storage: s, content })
  assert.equal(r.status, 'in-sync', `${label}: ${JSON.stringify({ diff: r.report?.diff, unrepresented: r.report?.unrepresented, errors: r.report?.errors })}`)
}

describe('G2 · πλήρες in-sync μετά από ΚΑΘΕ ενέργεια', () => {
  test('σωστή, λάθος, κάρτα, αφαίρεση, άδειασμα, checklists (Εβδ. 1 + εβδομαδιαίο, υπάρχον + νέο)', async () => {
    const s = await activated()
    const a = app(s)
    await assertInSync(s, 'μετά την ενεργοποίηση')
    const steps = [
      ['σωστή', () => a.answer(Q(0), true)],
      ['λάθος', () => a.answer(Q(1), false)],
      ['λάθος 2', () => a.answer(Q(2), false)],
      ['κάρτα', () => a.card('fc-pavlov-1')],
      ['αφαίρεση λάθους', () => a.remove(a.service.getSnapshot().courses.psd115.wrongBook.at(-1).uid)],
      ['checklist Εβδ. 1 (υπάρχον)', () => a.checklist('definition', [true, false, true])],
      ['checklist Εβδ. 1 (νέο)', () => a.checklist('philosophers', [true, true])],
      ['checklist εβδομαδιαίο (υπάρχον)', () => a.checklist('empiricism', [false, true, false, true])],
      ['checklist εβδομαδιαίο (νέο)', () => a.checklist('neuron', [true])],
      ['άδειασμα wrongBook', () => a.clear()],
      ['λάθος μετά το άδειασμα', () => a.answer(Q(3), false)],
    ]
    for (const [label, run] of steps) {
      const r = await run()
      assert.equal(r.status, 'recorded', `${label}: ${JSON.stringify(r)}`)
      await assertInSync(s, label)
    }
  })

  test('ενέργειες χωρίς αλλαγή (ίδιο checklist, άγνωστο uid, άδειο wrongBook) → unchanged, καμία εγγραφή, in-sync', async () => {
    const s = await activated()
    const a = app(s)
    await a.checklist('definition', [true])
    const before = s.dump()
    assert.equal((await a.checklist('definition', [true])).status, 'unchanged')
    assert.equal((await a.remove('δεν-υπάρχει')).status, 'unchanged')
    await a.clear()
    const afterClear = s.dump()
    assert.equal((await a.clear()).status, 'unchanged')
    assert.deepEqual(s.dump(), afterClear)
    assert.notDeepEqual(before, afterClear)
    await assertInSync(s, 'unchanged')
  })

  test(`όριο ${WRONG_BOOK_LIMIT} (FIFO): τα παλαιότερα φεύγουν ίδια και στα δύο`, async () => {
    const s = await activated()
    const a = app(s)
    for (let i = 0; i < WRONG_BOOK_LIMIT + 5; i++) await a.answer(Q(i % quizQuestions.length), false)
    assert.equal(stateOf(s)[WB].entries.length, WRONG_BOOK_LIMIT)
    assert.equal(a.service.getSnapshot().courses.psd115.wrongBook.length, WRONG_BOOK_LIMIT)
    await assertInSync(s, 'cap')
  })

  test('reset: reset marker + κενά namespaces στην ίδια συναλλαγή → in-sync, και οι επόμενες ενέργειες in-sync', async () => {
    const s = await activated()
    const a = app(s)
    await a.answer(Q(0), false)
    await a.checklist('definition', [true])
    a.reset()
    const st = stateOf(s)
    assert.ok(st[RESET_MARKER_KEY])
    assert.deepEqual(st[WB], { version: 1, entries: [] })
    assert.deepEqual(st[CL], { version: 1, topics: {} })
    assert.ok(st[LEGACY_BASELINE_KEY] && st[MIGRATION_MARKER_KEY], 'baseline/σημάδι μένουν')
    await assertInSync(s, 'μετά το reset')
    await a.answer(Q(1), false)
    await a.checklist('empiricism', [true, false])
    await assertInSync(s, 'μετά το reset + ενέργειες')
  })
})

describe('G3 · ένα uid, κοινό για shadow και ProgressService', () => {
  test('το λάθος έχει το ΙΔΙΟ uid στο namespace και στο legacy wrongBook', async () => {
    const s = await activated()
    const a = app(s)
    await a.answer(Q(5), false)
    const shadowUid = stateOf(s)[WB].entries.at(-1).uid
    assert.equal(a.service.getSnapshot().courses.psd115.wrongBook.at(-1).uid, shadowUid)
    assert.equal(JSON.parse(s.getItem('psd115-w1-study')).wrongBook.at(-1).uid, shadowUid)
  })
  test('διαφορετικό uid (π.χ. το service αγνοεί το wrong.uid) → diverged μόνο στο wrongBook', async () => {
    const s = await activated()
    const a = app(s)
    const q = Q(5)
    const wrong = { uid: 'shadow-uid', question: q.question, explanation: q.explanation, userLabel: q.options[q.correctIndex === 0 ? 1 : 0], correctLabel: q.options[q.correctIndex] }
    await a.rec.recordQuizAnswer({ questionId: q.id, ok: false, wrong })
    a.service.answerQuestion({ questionId: q.id, ok: false, wrong: { ...wrong, uid: 'other-uid' } })
    const r = await shadowReconciliation({ storage: s, content })
    assert.equal(r.status, 'diverged')
    assert.deepEqual(Object.keys(r.report.diff), ['wrongBook'])
  })
  test('λάθος απάντηση χωρίς wrong.uid → ο recorder αποτυγχάνει (δεν επινοεί uid)', async () => {
    const s = await activated()
    const r = await app(s).rec.recordQuizAnswer({ questionId: Q(5).id, ok: false })
    assert.equal(r.status, 'failed')
    assert.equal(eventsOf(s).length, 0)
  })
})

describe('G4 · υλοποίηση των namespaces στο migration', () => {
  test('αμέσως μετά την ενεργοποίηση: namespaces = legacy snapshot, in-sync, μηδέν events', async () => {
    const s = await activated()
    const st = stateOf(s)
    assert.ok(Array.isArray(st[WB].entries) && st[WB].entries.length === JSON.parse(PROD['psd115-w1-study']).wrongBook.length)
    assert.ok(Object.keys(st[CL].topics).length > 0)
    assert.equal(s.getItem(EVENTS_KEY), null)
    await assertInSync(s, 'migration')
  })
})

describe('G5 · επανενεργοποίηση χωρίς υλοποιημένα namespaces → άρνηση', () => {
  for (const key of [WB, CL]) {
    test(`λείπει το ${key} → not-materialized, καμία εγγραφή`, async () => {
      const s = await activated()
      await deactivateShadow({ storage: s })
      const st = stateOf(s)
      delete st[key]
      s.setItem(STATE_KEY, JSON.stringify(st))
      const before = s.dump()
      const r = await activateShadow({ storage: s, content, backup: () => assert.fail('όχι backup') })
      assert.equal(r.status, 'not-activated')
      assert.equal(r.reason, 'not-materialized')
      assert.deepEqual(s.dump(), before)
    })
  }
  test('με namespaces και in-sync → active', async () => {
    const s = await activated()
    const a = app(s)
    await a.answer(Q(0), false)
    await deactivateShadow({ storage: s })
    assert.equal((await activateShadow({ storage: s, content })).status, 'active')
  })
  test('με namespaces αλλά mirror που δεν ενημερώθηκε (shadow off, legacy άλλαξε checklist) → diverged', async () => {
    const s = await activated()
    await deactivateShadow({ storage: s })
    app(s).checklist('definition', [true, true, true])
    const r = await activateShadow({ storage: s, content })
    assert.equal(r.reason, 'diverged')
    assert.deepEqual(Object.keys(r.report.diff), ['checklists'])
  })
})

describe('G6 · ατομικότητα του reset', () => {
  test('αποτυχία στην εγγραφή του state → rollback: legacy, state, events byte-identical', async () => {
    const s = await activated()
    const a = app(s)
    await a.answer(Q(0), false)
    const isBackup = (k) => k.startsWith('psd115-backup-')
    const strip = (d) => Object.fromEntries(Object.entries(d).filter(([k]) => !isBackup(k)))
    const before = strip(s.dump())
    s.fail((k) => k === STATE_KEY)
    assert.throws(() => resetProgressSafely({ storage: s, download: noDownload, now: () => T0 + 99_000 }))
    s.fail(null)
    assert.deepEqual(strip(s.dump()), before)
  })
  test('χωρίς σημάδι migration: το reset δεν γράφει namespaces (ούτε state)', () => {
    const s = fakeStorage({ ...PROD })
    resetProgressSafely({ storage: s, download: noDownload })
    assert.equal(s.getItem(STATE_KEY), null)
  })
})

describe('G7 · degraded mode → ο recorder είναι αδρανής', () => {
  test('κατεστραμμένη legacy πρόοδος: καμία ανάγνωση/εγγραφή του store από τον recorder', async () => {
    const s = await activated()
    s.setItem('psd115-w1-study', '{ όχι json')
    const a = app(s)
    assert.equal(a.service.getSnapshot().status, 'degraded')
    s.log.reads.length = 0
    s.log.writes.length = 0
    const before = s.dump()
    for (const r of [await a.answer(Q(0), false), await a.card('fc-pavlov-1'), await a.checklist('definition', [true]), await a.clear(), await a.remove('x')]) {
      assert.equal(r.status, 'inactive')
    }
    assert.deepEqual(s.dump(), before)
    assert.deepEqual(s.log.writes, [])
    assert.equal(s.log.reads.filter((k) => k.startsWith('study-progress-')).length, 0)
  })
})

describe('G8 · απομόνωση αποτυχιών', () => {
  test('το store δεν γράφεται (quota) → failed, το legacy εφαρμόζεται κανονικά, καμία μισή εγγραφή', async () => {
    const s = await activated()
    const a = app(s)
    const stBefore = s.getItem(STATE_KEY)
    s.fail((k) => k === EVENTS_KEY)
    const r = await a.answer(Q(0), false)
    s.fail(null)
    assert.equal(r.status, 'failed')
    assert.equal(s.getItem(EVENTS_KEY), null)
    assert.deepEqual(JSON.parse(s.getItem(STATE_KEY))[WB], JSON.parse(stBefore)[WB], 'το namespace δεν άλλαξε χωρίς το event')
    assert.equal(JSON.parse(s.getItem('psd115-w1-study')).quizAnswered, JSON.parse(PROD['psd115-w1-study']).quizAnswered + 1)
  })
  test('F4: λείπει το namespace → failed + καταγραφή· ΔΕΝ δημιουργείται', async () => {
    for (const [key, run] of [
      [WB, (a) => a.answer(Q(0), false)],
      [WB, (a) => a.clear()],
      [CL, (a) => a.checklist('definition', [true])],
    ]) {
      const s = await activated()
      const st = stateOf(s)
      delete st[key]
      s.setItem(STATE_KEY, JSON.stringify(st))
      const a = app(s)
      const r = await run(a)
      assert.equal(r.status, 'failed', key)
      assert.equal(stateOf(s)[key], undefined, `${key} δεν δημιουργήθηκε`)
      assert.equal(stateOf(s)[SHADOW_STATE_KEY].failures, 1)
      assert.equal(eventsOf(s).length, 0)
    }
  })
  test('λάθος απάντηση με αποτυχία ΚΑΙ του rollback → failed· το service ΔΕΝ γράφει το legacy (εκκρεμές σημάδι) → degraded· η ανάκτηση επαναφέρει το store', async () => {
    const s = await activated()
    const a = app(s)
    await a.answer(Q(1), true) // υπάρχει log: το rollback του χρειάζεται setItem (που θα αποτύχει)
    const storeBefore = { e: s.getItem(EVENTS_KEY), st: s.getItem(STATE_KEY) }
    let eventWrites = 0
    s.fail((k) => k === STATE_KEY || (k === EVENTS_KEY && ++eventWrites > 1))
    const r = await a.answer(Q(0), false)
    s.fail(null)
    assert.equal(r.status, 'failed')
    assert.match(r.error, /αναίρεση δεν ολοκληρώθηκε/)
    // review PR #11: με εκκρεμές σημάδι η legacy εγγραφή θα χανόταν στην ανάκτηση → απορρίπτεται, το service σε degraded.
    assert.equal(JSON.parse(s.getItem('psd115-w1-study')).quizAnswered, JSON.parse(PROD['psd115-w1-study']).quizAnswered + 1, 'μόνο η πρώτη (πριν από την αποτυχία) απάντηση')
    assert.equal(a.service.getSnapshot().status, 'degraded')
    assert.equal(a.service.getSnapshot().courses.psd115.quizAnswered, JSON.parse(PROD['psd115-w1-study']).quizAnswered + 1, 'η μνήμη δεν δηλώνει την απορριφθείσα απάντηση')
    assert.notEqual(s.getItem(TXN_KEY), null)
    assert.equal(recoverInterrupted(s).status, 'rolled-back')
    assert.deepEqual({ e: s.getItem(EVENTS_KEY), st: s.getItem(STATE_KEY) }, storeBefore)
  })
  test('άγνωστο θέμα checklist → failed, τίποτα στο store', async () => {
    const s = await activated()
    const before = stateOf(s)[CL]
    const r = await app(s).rec.recordChecklist({ topicId: 'δεν-υπάρχει', items: [true] })
    assert.equal(r.status, 'failed')
    assert.deepEqual(stateOf(s)[CL], before)
  })
})

describe('G9 · κανονικό build: μηδέν study-progress-*', () => {
  test('recorder με το build flag κλειστό + όλες οι ενέργειες → κανένα κλειδί study-progress-*', async () => {
    const s = fakeStorage({ ...PROD })
    const a = app(s, { enabled: false })
    for (const r of [await a.answer(Q(0), true), await a.answer(Q(1), false), await a.card('fc-pavlov-1'), await a.checklist('definition', [true]), await a.clear()]) {
      assert.equal(r.status, 'disabled')
    }
    assert.deepEqual(Object.keys(s.dump()).filter((k) => k.startsWith('study-progress-') || k === 'progress-txn-v1'), [])
    assert.equal(s.log.reads.filter((k) => k.startsWith('study-progress-')).length, 0)
  })
  test('ο προεπιλεγμένος recorder (χωρίς enabled) είναι disabled', async () => {
    const s = fakeStorage({ ...PROD })
    const r = await createShadowRecorder({ courseId: 'psd115', content, storage: s }).recordChecklist({ topicId: 'definition', items: [true] })
    assert.equal(r.status, 'disabled')
    assert.deepEqual(s.log.reads, [])
  })
})

// Φάση 6a: οι handlers δεν καλούν πια τον shadow recorder (το G11 αφορούσε τη σειρά recorder → legacy service).
// Βλ. tests/progressRuntime.test.mjs.
