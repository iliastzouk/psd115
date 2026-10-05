/**
 * Tests του shadow mode και του ορίου migration (Phase 1E-3). Run: npm test
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { quizQuestions } from '../content/courses/psd115/questions.js'
import { newEventId } from '../src/core/progress/events.js'
import { MIGRATION_MARKER_KEY, RESET_MARKER_KEY, SHADOW_STATE_KEY, LEGACY_BASELINE_KEY } from '../src/core/progress/keys.js'
import { createProgressStore, EVENTS_KEY, STATE_KEY } from '../src/core/progress/progressStore.js'
import { reconcileShadow } from '../src/core/progress/reconcile.js'
import { applyImport, resetProgressSafely } from '../src/utils/progressBackup.js'
import { activateShadow, deactivateShadow, shadowReconciliation } from '../src/utils/progressMigration.js'
import { createShadowRecorder, LEGACY_PROGRESS_SHADOW_ENABLED, SHADOW_BUILD_ENABLED } from '../src/utils/progressShadow.js'
import { validateExport } from '../src/utils/progressValidate.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROD = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/progress-export.production-2026-10-05.json'), 'utf8'))
const T0 = Date.UTC(2026, 9, 7, 9, 0, 0)
const fixed = (t) => () => t
const noBackup = () => {}
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function fakeStorage(init = {}, { failSet } = {}) {
  const m = new Map(Object.entries(init))
  let reads = 0
  return {
    get length() {
      return m.size
    },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => {
      reads += 1
      return m.has(k) ? m.get(k) : null
    },
    setItem(k, v) {
      if (failSet?.(k)) {
        const e = new Error('quota')
        e.name = 'QuotaExceededError'
        throw e
      }
      m.set(k, String(v))
    },
    removeItem: (k) => void m.delete(k),
    dump: () => Object.fromEntries(m),
    reads: () => reads,
    failSet: (fn) => {
      failSet = fn
    },
  }
}
const legacyOnly = (d) => Object.fromEntries(Object.entries(d).filter(([k]) => k.startsWith('psd115-')))
const events = (s) => JSON.parse(s.getItem(EVENTS_KEY) ?? '[]')
const state = (s) => JSON.parse(s.getItem(STATE_KEY) ?? '{}')
const ev = (t, extra = {}) => ({ id: newEventId(), t, item: 'psd115/q-w2-var-1', kind: 'answer', ok: 1, ctx: 'quiz', ...extra })

/** Storage μετά από ενεργοποίηση: production fixture + baseline/marker στο T0 + shadow enabled. */
async function activated() {
  const s = fakeStorage({ ...PROD.keys })
  const r = await activateShadow({ storage: s, now: fixed(T0), backup: noBackup })
  assert.equal(r.status, 'active')
  return s
}
const recorder = (s, t = T0 + 1000, extra = {}) => createShadowRecorder({ storage: s, now: fixed(t), enabled: true, warn: () => {}, ...extra })

describe('όριο migration: event με t πριν από το marker.at απορρίπτεται σε ΚΑΘΕ δρόμο', () => {
  test('append: T0 − 1 → απόρριψη χωρίς καμία εγγραφή· T0 και T0 + 1 → δεκτά', async () => {
    const s = await activated()
    const store = createProgressStore({ storage: s })
    const before = s.dump()
    await assert.rejects(store.append(ev(T0 - 1)), /πριν από το όριο migration/)
    assert.deepEqual(s.dump(), before, 'καμία μεταβολή')
    await store.append(ev(T0))
    await store.append(ev(T0 + 1))
    assert.equal(events(s).length, 2)
  })
  test('importAll: ένα παλιό event ακυρώνει όλη την εισαγωγή (μηδέν μεταβολή)', async () => {
    const s = await activated()
    const before = s.dump()
    const store = createProgressStore({ storage: s })
    await assert.rejects(store.importAll({ format: 'study-progress', version: 1, events: [ev(T0 + 5), ev(T0 - 1)], state: {} }), /όριο migration/)
    assert.deepEqual(s.dump(), before)
  })
  test('importAll: το σημάδι του αρχείου ορίζει όριο σε store χωρίς σημάδι· διαφορετικό σημάδι → απόρριψη', async () => {
    const marker = { version: 1, at: new Date(T0).toISOString(), sourceHash: 'sha256:x' }
    const empty = fakeStorage()
    await assert.rejects(
      createProgressStore({ storage: empty }).importAll({ format: 'study-progress', version: 1, events: [ev(T0 - 1)], state: { [MIGRATION_MARKER_KEY]: marker } }),
      /όριο migration/,
    )
    assert.deepEqual(empty.dump(), {})
    const s = await activated()
    const before = s.dump()
    await assert.rejects(
      createProgressStore({ storage: s }).importAll({ format: 'study-progress', version: 1, events: [], state: { [MIGRATION_MARKER_KEY]: { ...marker, sourceHash: 'other' } } }),
      /διαφορετικό σημάδι/,
    )
    assert.deepEqual(s.dump(), before)
  })
  test('import αρχείου v2 (backup): παλιό event → απόρριψη, μηδέν εγγραφές, χωρίς σημάδι συναλλαγής', async () => {
    const s = await activated()
    const before = s.dump()
    const file = { format: 'psd115-progress-export', version: 2, keys: {}, progressStore: { [EVENTS_KEY]: JSON.stringify([ev(T0 - 1)]) } }
    assert.equal(validateExport(file).ok, true, 'το αρχείο μόνο του είναι έγκυρο (δεν έχει σημάδι)')
    assert.throws(() => applyImport(file, s), /όριο migration/)
    assert.deepEqual(s.dump(), before)
    assert.equal(s.getItem('progress-txn-v1'), null)
  })
  test('έλεγχος αρχείου v2: events πριν από το σημάδι του ίδιου αρχείου → άκυρο', () => {
    const marker = { version: 1, at: new Date(T0).toISOString(), sourceHash: 'sha256:x' }
    const file = {
      format: 'psd115-progress-export',
      version: 2,
      keys: {},
      progressStore: { [EVENTS_KEY]: JSON.stringify([ev(T0 - 1)]), [STATE_KEY]: JSON.stringify({ [MIGRATION_MARKER_KEY]: marker }) },
    }
    const r = validateExport(file)
    assert.equal(r.ok, false)
    assert.match(r.errors.join(' '), /όριο migration/)
  })
  test('χωρίς σημάδι δεν υπάρχει όριο (συμπεριφορά 0B αμετάβλητη)', async () => {
    const s = fakeStorage()
    await createProgressStore({ storage: s }).append(ev(Date.UTC(2021, 0, 1)))
    assert.equal(events(s).length, 1)
  })
  test('άκυρο marker.at → το append απορρίπτεται (δεν μαντεύει όριο)', async () => {
    const s = fakeStorage({ [STATE_KEY]: JSON.stringify({ [MIGRATION_MARKER_KEY]: { at: 'nope' } }) })
    await assert.rejects(createProgressStore({ storage: s }).append(ev(T0)), /άκυρο σημάδι/)
    assert.equal(s.getItem(EVENTS_KEY), null)
  })
})

describe('πύλες του shadow mode', () => {
  test('build flag κλειστό από προεπιλογή', () => {
    assert.equal(LEGACY_PROGRESS_SHADOW_ENABLED, false)
    assert.equal(SHADOW_BUILD_ENABLED, false)
  })
  test('flag κλειστό → καμία πρόσβαση στο storage, καμία εγγραφή', async () => {
    const s = await activated()
    const before = s.dump()
    const reads = s.reads()
    const r = createShadowRecorder({ storage: s })
    assert.deepEqual(await r.recordQuizAnswer({ questionId: 'q-w2-var-1', ok: true }), { status: 'disabled' })
    assert.deepEqual(await r.recordFlashcardSeen({ cardId: 'fc-def-1' }), { status: 'disabled' })
    assert.equal(s.reads(), reads, 'ούτε καν ανάγνωση')
    assert.deepEqual(s.dump(), before)
  })
  test('χωρίς σημάδι migration → inactive, μηδέν εγγραφές (το stream δεν ξεκινά πριν από το baseline)', async () => {
    const s = fakeStorage({ ...PROD.keys, [STATE_KEY]: JSON.stringify({ [SHADOW_STATE_KEY]: { enabled: true } }) })
    const before = s.dump()
    assert.equal((await recorder(s).recordQuizAnswer({ questionId: 'q-w2-var-1', ok: true })).status, 'inactive')
    assert.deepEqual(s.dump(), before)
  })
  test('με σημάδι αλλά χωρίς runtime ενεργοποίηση → inactive', async () => {
    const s = fakeStorage({ ...PROD.keys })
    const { migrateLegacyBaseline } = await import('../src/utils/progressMigration.js')
    await migrateLegacyBaseline({ storage: s, now: fixed(T0), enabled: true, backup: noBackup })
    const before = s.dump()
    assert.equal((await recorder(s).recordQuizAnswer({ questionId: 'q-w2-var-1', ok: true })).status, 'inactive')
    assert.deepEqual(s.dump(), before)
  })
  test('activateShadow δεν ενεργοποιεί αν το migration απορριφθεί· deactivate σταματά τα writes', async () => {
    const bad = fakeStorage({ ...PROD.keys, 'psd115-w1-study': '{oops' })
    assert.equal((await activateShadow({ storage: bad, now: fixed(T0), backup: noBackup })).status, 'not-activated')
    assert.equal(bad.getItem(STATE_KEY), null)
    const s = await activated()
    await recorder(s).recordQuizAnswer({ questionId: 'q-w2-var-1', ok: true })
    await deactivateShadow({ storage: s })
    assert.equal((await recorder(s).recordQuizAnswer({ questionId: 'q-w2-var-2', ok: true })).status, 'inactive')
    assert.equal(events(s).length, 1)
  })
})

describe('δημιουργία events', () => {
  test('μία απάντηση κουίζ → ακριβώς ένα event (σταθερό ID ερώτησης, ctx quiz, πραγματικό t)', async () => {
    const s = await activated()
    const legacyBefore = legacyOnly(s.dump())
    const r = await recorder(s, T0 + 4242).recordQuizAnswer({ questionId: 'q-w2-var-4', ok: false })
    assert.equal(r.status, 'recorded')
    const list = events(s)
    assert.equal(list.length, 1)
    const [e] = list
    assert.match(e.id, UUID_RE)
    assert.deepEqual({ ...e, id: 'x' }, { id: 'x', t: T0 + 4242, item: 'psd115/q-w2-var-4', kind: 'answer', ok: 0, ctx: 'quiz' })
    assert.doesNotMatch(e.item, /\/week\/|^\//)
    assert.deepEqual(legacyOnly(s.dump()), legacyBefore, 'ο recorder δεν αγγίζει το legacy')
  })
  test('μία «Επόμενη κάρτα» → ακριβώς ένα event (σταθερό ID κάρτας, kind flip, ctx flash)', async () => {
    const s = await activated()
    await recorder(s, T0 + 7).recordFlashcardSeen({ cardId: 'fc-pavlov-1' })
    const list = events(s)
    assert.equal(list.length, 1)
    assert.deepEqual({ ...list[0], id: 'x' }, { id: 'x', t: T0 + 7, item: 'psd115/fc-pavlov-1', kind: 'flip', ctx: 'flash' })
  })
  test('η εγγραφή γίνεται συγχρονικά, μέσα στην κλήση (πριν από το legacy write του React)', async () => {
    const s = await activated()
    const p = recorder(s).recordQuizAnswer({ questionId: 'q-w2-var-1', ok: true })
    assert.equal(events(s).length, 1, 'ήδη στο storage πριν από οποιοδήποτε await')
    await p
  })
  test('άγνωστο ID ερώτησης/κάρτας → failed, κανένα event', async () => {
    const s = await activated()
    assert.equal((await recorder(s).recordQuizAnswer({ questionId: 'nope', ok: true })).status, 'failed')
    assert.equal((await recorder(s).recordFlashcardSeen({ cardId: 'nope' })).status, 'failed')
    assert.equal(s.getItem(EVENTS_KEY), null)
  })
})

describe('απομόνωση αποτυχιών (το legacy δεν επηρεάζεται)', () => {
  test('αποτυχία εγγραφής event (quota) → η κλήση ΔΕΝ απορρίπτεται· καταγράφεται στο shadow:psd115', async () => {
    const s = await activated()
    const legacyBefore = legacyOnly(s.dump())
    s.failSet((k) => k === EVENTS_KEY)
    const r = await recorder(s).recordQuizAnswer({ questionId: 'q-w2-var-1', ok: true })
    assert.equal(r.status, 'failed')
    s.failSet(null)
    assert.equal(s.getItem(EVENTS_KEY), null)
    const sh = state(s)[SHADOW_STATE_KEY]
    assert.equal(sh.failures, 1)
    assert.equal(sh.recentFailures[0].action, 'quiz-answer')
    assert.equal(sh.recentFailures[0].item, 'q-w2-var-1')
    assert.deepEqual(legacyOnly(s.dump()), legacyBefore)
  })
  test('ρολόι πριν από το όριο → failed και καταγραφή, κανένα event', async () => {
    const s = await activated()
    const r = await recorder(s, T0 - 60_000).recordQuizAnswer({ questionId: 'q-w2-var-1', ok: true })
    assert.equal(r.status, 'failed')
    assert.equal(s.getItem(EVENTS_KEY), null)
    assert.match(state(s)[SHADOW_STATE_KEY].recentFailures[0].error, /όριο migration/)
  })
  test('κατεστραμμένο state → failed χωρίς exception, καμία εγγραφή', async () => {
    const s = fakeStorage({ ...PROD.keys, [STATE_KEY]: '{corrupt' })
    const before = s.dump()
    const r = await recorder(s).recordQuizAnswer({ questionId: 'q-w2-var-1', ok: true })
    assert.equal(r.status, 'failed')
    assert.deepEqual(s.dump(), before)
  })
  test('ούτε η καταγραφή αποτυχίας δεν πετάει (όλα τα writes αποτυγχάνουν)', async () => {
    const s = await activated()
    s.failSet(() => true)
    const r = await recorder(s).recordFlashcardSeen({ cardId: 'fc-def-1' })
    assert.equal(r.status, 'failed')
  })
})

describe('διπλότυπα', () => {
  test('ίδιο event id → δεύτερη εγγραφή απορρίπτεται (duplicate-resistant), ένα event', async () => {
    const s = await activated()
    const r = recorder(s, T0 + 1, { newId: () => '00000000-0000-4000-8000-000000000001' })
    assert.equal((await r.recordQuizAnswer({ questionId: 'q-w2-var-1', ok: true })).status, 'recorded')
    assert.equal((await r.recordQuizAnswer({ questionId: 'q-w2-var-1', ok: true })).status, 'failed')
    assert.equal(events(s).length, 1)
  })
  test('ο handler του hook καλεί τον recorder μία φορά, ΕΞΩ από τους setProgress updaters', () => {
    const src = fs.readFileSync(path.join(root, 'src/hooks/useStudySession.js'), 'utf8')
    for (const call of ['recordQuizAnswer(', 'recordFlashcardSeen(']) {
      const at = [...src.matchAll(new RegExp(call.replace('(', '\\('), 'g'))].map((m) => m.index)
      assert.equal(at.length, 1, call)
      // Κάθε updater «setProgress((p) => { … })»: ο recorder δεν βρίσκεται μέσα σε κανέναν.
      for (const m of src.matchAll(/setProgress\(\(p\) => \{/g)) {
        const end = src.indexOf('\n    })', m.index)
        assert.ok(!(at[0] > m.index && at[0] < end), `${call} μέσα σε setProgress updater`)
      }
    }
  })
})

describe('reconciliation', () => {
  const questions = quizQuestions.filter((q) => q.categoryId.startsWith('w3-')).slice(0, 10)

  async function scenario({ dropEvent = false } = {}) {
    const s = await activated()
    const baseline = state(s)[LEGACY_BASELINE_KEY]
    const legacy = structuredClone(baseline.progress)
    delete legacy.checklists
    let t = T0
    for (const [i, q] of questions.entries()) {
      const ok = i % 2 === 0 // 5 σωστές, 5 λάθος
      // legacy update (όπως ο handler του κουίζ)
      legacy.quizAnswered += 1
      if (ok) legacy.quizCorrect += 1
      const c = (legacy.byCategory[q.categoryId] ??= { correct: 0, wrong: 0 })
      if (ok) c.correct += 1
      else c.wrong += 1
      if (dropEvent && i === 3) continue
      t += 1000
      await recorder(s, t).recordQuizAnswer({ questionId: q.id, ok })
    }
    return { s, baseline, legacy }
  }

  test('10 απαντήσεις (5 σωστές / 5 λάθος) + 10 events → legacy delta == event delta', async () => {
    const { s, baseline, legacy } = await scenario()
    assert.equal(events(s).length, 10)
    const r = reconcileShadow({ baseline, legacy, events: events(s) })
    assert.equal(r.ok, true, JSON.stringify(r))
    assert.deepEqual(r.quiz.legacy.answered, 10)
    assert.deepEqual(r.quiz.legacy.correct, 5)
    assert.deepEqual(r.quiz.events.byCategory, r.quiz.legacy.byCategory)
  })
  test('ένα χαμένο event εντοπίζεται (απόκλιση, όχι σιωπηλή απώλεια)', async () => {
    const { s, baseline, legacy } = await scenario({ dropEvent: true })
    const r = reconcileShadow({ baseline, legacy, events: events(s) })
    assert.equal(r.ok, false)
    assert.equal(r.quiz.legacy.answered - r.quiz.events.answered, 1)
    assert.equal(r.quiz.byCategoryMismatch.length, 1)
  })
  test('κάρτες: νέες κάρτες legacy == νέα flip events· κάρτα του baseline που ξαναπατήθηκε δεν μετράει', async () => {
    const s = await activated()
    const baseline = state(s)[LEGACY_BASELINE_KEY]
    const legacy = { ...structuredClone(baseline.progress), flashcardSeenIds: [...baseline.progress.flashcardSeenIds, 'fc-pavlov-1', 'fc-pavlov-2'] }
    for (const id of ['fc-def-1', 'fc-pavlov-1', 'fc-pavlov-2', 'fc-pavlov-1']) await recorder(s).recordFlashcardSeen({ cardId: id })
    assert.equal(events(s).length, 4, 'ένα event ανά πάτημα')
    assert.equal(reconcileShadow({ baseline, legacy, events: events(s) }).ok, true)
    const missing = reconcileShadow({ baseline, legacy: { ...legacy, flashcardSeenIds: [...legacy.flashcardSeenIds, 'fc-pavlov-3'] }, events: events(s) })
    assert.deepEqual(missing.cards.missingEvents, ['fc-pavlov-3'])
  })
  test('το wrongBook δεν συμμετέχει· το quizCorrect ναι', async () => {
    const { s, baseline, legacy } = await scenario()
    assert.equal(reconcileShadow({ baseline, legacy: { ...legacy, wrongBook: [] }, events: events(s) }).ok, true)
    assert.equal(reconcileShadow({ baseline, legacy: { ...legacy, quizCorrect: legacy.quizCorrect + 1 }, events: events(s) }).ok, false)
  })
  test('legacy «πίσω» από το baseline χωρίς reset marker → issue', () => {
    const baseline = { courseId: 'psd115', progress: { quizAnswered: 5, quizCorrect: 2, byCategory: {}, flashcardSeenIds: [] } }
    const r = reconcileShadow({ baseline, legacy: { quizAnswered: 0, quizCorrect: 0 }, events: [] })
    assert.equal(r.ok, false)
    assert.equal(r.issues.length, 1)
  })
  test('shadowReconciliation από το storage: in-sync μετά από πραγματικά writes', async () => {
    const s = await activated()
    await recorder(s).recordQuizAnswer({ questionId: 'q-w2-var-1', ok: true })
    const study = JSON.parse(s.getItem('psd115-w1-study'))
    study.quizAnswered += 1
    study.quizCorrect += 1
    study.byCategory['w2-variables'].correct += 1
    s.setItem('psd115-w1-study', JSON.stringify(study))
    const r = await shadowReconciliation({ storage: s })
    assert.equal(r.status, 'in-sync', JSON.stringify(r.report))
  })
})

describe('reset μετά το migration', () => {
  test('γράφεται reset marker στην ίδια συναλλαγή· events και baseline μένουν· backup και των δύο', async () => {
    const s = await activated()
    await recorder(s).recordQuizAnswer({ questionId: 'q-w2-var-1', ok: true })
    let downloaded = null
    resetProgressSafely({ storage: s, download: (d) => (downloaded = d), now: fixed(T0 + 9000) })
    const st = state(s)
    assert.deepEqual(st[RESET_MARKER_KEY], { at: new Date(T0 + 9000).toISOString(), reason: 'legacy-reset' })
    assert.ok(st[LEGACY_BASELINE_KEY] && st[MIGRATION_MARKER_KEY])
    assert.equal(events(s).length, 1, 'κανένα event δεν χάνεται')
    assert.equal(s.getItem('psd115-w1-study'), null)
    assert.equal(JSON.parse(downloaded.progressStore[EVENTS_KEY]).length, 1, 'το backup έχει τα events')
    assert.equal(s.getItem('progress-txn-v1'), null)
  })
  test('μετά το reset, το reconciliation ξεκινά από το μηδέν (events από το reset και μετά)', async () => {
    const s = await activated()
    await recorder(s, T0 + 1).recordQuizAnswer({ questionId: 'q-w2-var-1', ok: true })
    resetProgressSafely({ storage: s, download: noBackup, now: fixed(T0 + 100) })
    await recorder(s, T0 + 200).recordQuizAnswer({ questionId: 'q-w2-var-2', ok: false })
    const cat = quizQuestions.find((q) => q.id === 'q-w2-var-2').categoryId
    s.setItem('psd115-w1-study', JSON.stringify({ quizAnswered: 1, quizCorrect: 0, byCategory: { [cat]: { correct: 0, wrong: 1 } }, flashcardSeenIds: [], wrongBook: [] }))
    const r = await shadowReconciliation({ storage: s })
    assert.equal(r.status, 'in-sync', JSON.stringify(r.report))
  })
})

describe('πολλά tabs', () => {
  test('δύο «tabs» (ανεξάρτητοι recorders/stores) → και τα δύο events διατηρούνται', async () => {
    const s = await activated()
    const tabA = recorder(s, T0 + 10)
    const tabB = recorder(s, T0 + 20)
    await tabA.recordQuizAnswer({ questionId: 'q-w2-var-1', ok: true })
    await tabB.recordQuizAnswer({ questionId: 'q-w2-var-2', ok: false })
    await tabA.recordFlashcardSeen({ cardId: 'fc-def-1' })
    assert.deepEqual(events(s).map((e) => e.item), ['psd115/q-w2-var-1', 'psd115/q-w2-var-2', 'psd115/fc-def-1'])
  })
})
