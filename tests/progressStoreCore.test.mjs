/**
 * Φάση 6b — ο ενεργός πυρήνας του store (createStoreCore) και η επικύρωση events, απευθείας (χωρίς το legacy async
 * store). Μεταφέρει την κάλυψη των progressStore / progressCommit: ανάγνωση, ατομικό commit, ίδιοι έλεγχοι για κάθε event,
 * όριο reset ανά μάθημα, αποτελέσματα αποτυχίας (not-started / rolled-back / rollback-incomplete), απομόνωση από `psd115-*`.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { newEventId, validateEvent } from '../src/core/progress/events.js'
import { createStoreCore, EVENTS_KEY, EXPORT_FORMAT, EXPORT_VERSION, ProgressStoreError, STATE_KEY } from '../src/core/progress/progressStore.js'
import { resetStateKey, wrongBookStateKey } from '../src/core/progress/namespaces.js'
import { recoverInterrupted, TXN_KEY } from '../src/core/progress/transaction.js'
import { fakeStorage } from './helpers/progressFixtures.mjs'

const T0 = Date.UTC(2026, 9, 20, 10, 0, 0)
const ev = (t = T0, item = 'psd115/q-w2-var-1', extra = {}) => ({ id: newEventId(), t, item, kind: 'answer', ok: 1, ctx: 'quiz', ...extra })
const WB = wrongBookStateKey('psd115')
const quota = () => Object.assign(new Error('quota'), { name: 'QuotaExceededError' })
const core = (s) => createStoreCore(s, { now: () => T0 })

describe('validateEvent', () => {
  const v = (e) => validateEvent(e)
  test('έγκυρο event (και με όλα τα προαιρετικά πεδία)· τα προαιρετικά δεν εξαρτώνται από το kind', () => {
    assert.equal(v(ev()).ok, true)
    assert.equal(v({ id: newEventId(), t: T0, item: 'x/fc-1', kind: 'flip', ctx: 'flash', grade: 2, conf: 3, session: 's-1' }).ok, true)
    assert.equal(v({ id: newEventId(), t: T0, item: 'fc-pavlov-1', kind: 'self', ctx: 'exam' }).ok, true, 'ok/grade/conf/session προαιρετικά')
    const { ok: _ok, ...answerWithoutOk } = ev()
    assert.equal(v(answerWithoutOk).ok, true)
  })
  test('ctx υποχρεωτικό· μη αντικείμενο → απόρριψη', () => {
    const { ctx: _ctx, ...noCtx } = ev()
    assert.equal(v(noCtx).ok, false)
    for (const x of [null, [], 'x', 1]) assert.deepEqual(v(x), { ok: false, errors: ['το event πρέπει να είναι αντικείμενο'] })
  })
  test('άκυρο UUID / timestamp απορρίπτονται· μελλοντικό timestamp δεκτό', () => {
    for (const id of ['', 'abc', 42, null, '00000000-0000-0000-0000-000000000000x']) assert.equal(v(ev(T0, undefined, { id })).ok, false, String(id))
    for (const t of ['2026-09-28', NaN, Infinity, 1.5, -1, 0, Math.floor(T0 / 1000), Date.UTC(2019, 0, 1), undefined]) assert.equal(v({ ...ev(), t }).ok, false, String(t))
    assert.equal(v(ev(Date.UTC(2099, 0, 1))).ok, true)
  })
  test('άκυρο kind / ctx / enum τιμές', () => {
    for (const kind of ['', 'ANSWER', 'view', undefined]) assert.equal(v(ev(T0, undefined, { kind })).ok, false, String(kind))
    for (const ctx of ['', 'home', 'Quiz', 1]) assert.equal(v(ev(T0, undefined, { ctx })).ok, false, String(ctx))
    for (const ok of [2, -1, true, '1']) assert.equal(v(ev(T0, undefined, { ok })).ok, false, `ok=${ok}`)
    for (const grade of [4, -1, 1.5, '2']) assert.equal(v(ev(T0, undefined, { kind: 'self', grade })).ok, false, `grade=${grade}`)
    for (const conf of [0, 4, '2']) assert.equal(v(ev(T0, undefined, { conf })).ok, false, `conf=${conf}`)
  })
  test('άκυρο item / session / άγνωστο πεδίο', () => {
    for (const item of ['', '   ', ' q-1', 'q-1 ', 42, null, undefined]) assert.equal(v({ ...ev(), item }).ok, false, String(item))
    for (const session of ['', ' x', 'a'.repeat(200), 5]) assert.equal(v(ev(T0, undefined, { session })).ok, false, String(session))
    assert.match(v(ev(T0, undefined, { accuracy: 0.9 })).errors.join(), /άγνωστο πεδίο «accuracy»/)
  })
})

describe('createStoreCore · API (Φάση 6b: χωρίς τα legacy readEvents / importAllSync / hooks)', () => {
  test('ακριβώς οι μέθοδοι της ενεργής υποδομής', () => {
    assert.deepEqual(Object.keys(createStoreCore(fakeStorage())), ['readRaw', 'readSync', 'parseRaw', 'pending', 'readState', 'commitSync', 'exportSync'])
    assert.ok(Object.isFrozen(createStoreCore(fakeStorage())))
  })
  test('παλιά hooks (extraViolations / importCheck) δεν έχουν καμία επίδραση', () => {
    const s = fakeStorage()
    const calls = []
    const c = createStoreCore(s, { now: () => T0, extraViolations: () => (calls.push('extra'), ['x']), importCheck: () => calls.push('import') })
    c.commitSync({ events: [ev()], state: { x: 1 } })
    assert.deepEqual(calls, [])
    assert.equal(JSON.parse(s.getItem(EVENTS_KEY)).length, 1)
  })
})

describe('createStoreCore · ανάγνωση', () => {
  test('χωρίς storage → ProgressStoreError', () => {
    assert.throws(() => createStoreCore(null), ProgressStoreError)
  })
  test('απόντα κλειδιά = κενό· readRaw επιστρέφει τις raw τιμές· pending = σημάδι', () => {
    const s = fakeStorage()
    assert.deepEqual(core(s).readSync(), { events: [], state: {} })
    assert.deepEqual(core(s).readRaw(), { events: null, state: null })
    assert.equal(core(s).pending(), false)
    s.setItem(TXN_KEY, '{x')
    assert.equal(core(s).pending(), true, 'και κατεστραμμένο σημάδι μετρά ως εκκρεμές')
  })
  const CORRUPT = {
    [`${EVENTS_KEY} μη JSON`]: [{ [EVENTS_KEY]: '{x' }, /δεν είναι έγκυρο JSON/],
    [`${EVENTS_KEY} όχι πίνακας`]: [{ [EVENTS_KEY]: '{}' }, /δεν είναι πίνακας/],
    [`${STATE_KEY} μη JSON`]: [{ [STATE_KEY]: '[' }, /δεν είναι έγκυρο JSON/],
    [`${STATE_KEY} όχι αντικείμενο`]: [{ [STATE_KEY]: '[]' }, /δεν είναι αντικείμενο/],
  }
  for (const [label, [init, re]] of Object.entries(CORRUPT)) {
    test(`κατεστραμμένο: ${label} → ProgressStoreError, καμία εγγραφή (και το commit αρνείται)`, () => {
      const s = fakeStorage(init)
      assert.throws(() => core(s).readSync(), (e) => e instanceof ProgressStoreError && re.test(e.message))
      assert.throws(() => core(s).parseRaw(core(s).readRaw()), re)
      assert.throws(() => core(s).commitSync({ events: [ev()], state: { x: 1 } }), ProgressStoreError)
      assert.deepEqual(s.dump(), init)
    })
  }
  test('exportSync: μορφή study-progress v1 με τα events και το state, μόνο ανάγνωση', () => {
    const e = ev()
    const s = fakeStorage({ [EVENTS_KEY]: JSON.stringify([e]), [STATE_KEY]: JSON.stringify({ a: 1 }) })
    assert.deepEqual(core(s).exportSync(), { format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt: new Date(T0).toISOString(), events: [e], state: { a: 1 } })
    assert.deepEqual(s.writes, [])
  })
})

describe('commitSync · ατομικότητα', () => {
  test('events + state σε ένα commit (συναλλαγή, το σημάδι καθαρίζει)', () => {
    const s = fakeStorage()
    const e = ev()
    assert.deepEqual(core(s).commitSync({ events: [e], state: { [WB]: { version: 1, entries: [] } } }), { events: 1, stateKeys: 1 })
    assert.deepEqual(JSON.parse(s.getItem(EVENTS_KEY)), [e])
    assert.deepEqual(JSON.parse(s.getItem(STATE_KEY))[WB], { version: 1, entries: [] })
    assert.ok(s.writes.includes(TXN_KEY))
    assert.equal(s.getItem(TXN_KEY), null)
  })
  test('αποτυχία της 2ης εγγραφής → rolled-back: ΚΑΙ τα δύο κλειδιά byte-identical, χωρίς σημάδι', () => {
    const before = { [EVENTS_KEY]: JSON.stringify([ev(T0 - 5)]), [STATE_KEY]: JSON.stringify({ other: 1 }) }
    const s = fakeStorage(before)
    s.hooks.fail = (k) => (k === STATE_KEY ? quota() : null)
    assert.throws(() => core(s).commitSync({ events: [ev()], state: { x: 1 } }), (e) => e instanceof ProgressStoreError && e.outcome === 'rolled-back')
    assert.deepEqual(s.dump(), before)
  })
  test('ένα κλειδί: αποτυχία → not-started, με το αρχικό σφάλμα ως cause (για την ταξινόμηση quota)', () => {
    const before = { [STATE_KEY]: JSON.stringify({ other: 1 }) }
    const s = fakeStorage(before)
    s.hooks.fail = () => quota()
    assert.throws(() => core(s).commitSync({ state: { x: 1 } }), (e) => e.outcome === 'not-started' && e.cause?.name === 'QuotaExceededError')
    assert.throws(() => core(s).commitSync({ events: [ev()] }), (e) => e.outcome === 'not-started')
    assert.deepEqual(s.dump(), before)
  })
  test('state patch: undefined αφαιρεί, τα υπόλοιπα κλειδιά μένουν· χωρίς events δεν γράφεται log', () => {
    const s = fakeStorage({ [STATE_KEY]: JSON.stringify({ a: 1, b: 2 }) })
    core(s).commitSync({ state: { a: undefined, c: 3 } })
    assert.deepEqual(JSON.parse(s.getItem(STATE_KEY)), { b: 2, c: 3 })
    assert.equal(s.getItem(EVENTS_KEY), null)
  })
  test('τα αποθηκευμένα δεν αλλάζουν από μεταγενέστερη αλλαγή των inputs', () => {
    const s = fakeStorage()
    const e = ev()
    const value = { entries: [1] }
    core(s).commitSync({ events: [e], state: { v: value } })
    e.ok = 0
    value.entries.push(2)
    assert.equal(JSON.parse(s.getItem(EVENTS_KEY))[0].ok, 1)
    assert.deepEqual(JSON.parse(s.getItem(STATE_KEY)).v, { entries: [1] })
  })
})

describe('commitSync · έλεγχοι πριν από κάθε εγγραφή (τίποτα δεν γράφεται)', () => {
  const cases = {
    'άκυρο event': () => ({ events: [{ id: 'x', t: 1, item: 'psd115/q', kind: 'answer', ctx: 'quiz' }] }),
    'διπλό id μέσα στο ίδιο commit': () => {
      const e = ev(T0 + 1)
      return { events: [e, { ...e }] }
    },
    'events όχι πίνακας': () => ({ events: {} }),
    'μη αντικείμενο state': () => ({ events: [], state: [] }),
    'κενό κλειδί state': () => ({ state: { '': 1 } }),
    'τιμή που δεν γίνεται JSON': () => ({ state: { f: () => 1 } }),
  }
  for (const [label, change] of Object.entries(cases)) {
    test(label, () => {
      const before = { [STATE_KEY]: JSON.stringify({ keep: 1 }) }
      const s = fakeStorage(before)
      assert.throws(() => core(s).commitSync(change()), ProgressStoreError)
      assert.deepEqual(s.dump(), before)
      assert.deepEqual(s.writes, [])
    })
  }
  test('id που υπάρχει ήδη στο log → τα events δεν αντικαθίστανται', () => {
    const e = ev(T0 + 1)
    const before = { [EVENTS_KEY]: JSON.stringify([e]) }
    const s = fakeStorage(before)
    assert.throws(() => core(s).commitSync({ events: [{ ...e }], state: { x: 1 } }), /υπάρχει ήδη/i)
    assert.deepEqual(s.dump(), before)
  })
})

describe('commitSync · όριο reset ανά μάθημα', () => {
  const at = T0 + 100
  const state = { [resetStateKey('psd115')]: { at: new Date(at).toISOString() } }
  test('event του μαθήματος πριν από το reset του → απόρριψη (code boundary), τίποτα δεν γράφεται', () => {
    const before = { [STATE_KEY]: JSON.stringify(state) }
    const s = fakeStorage(before)
    assert.throws(() => core(s).commitSync({ events: [ev(at - 1)] }), (e) => e.code === 'boundary' && e.message.startsWith('Event πριν από το όριο reset του μαθήματος· δεν γράφτηκε τίποτα') && !/migration/.test(e.message) && e.details.length === 1)
    assert.deepEqual(s.dump(), before)
  })
  test('στο όριο (t === at) και μετά → δεκτό· άλλο μάθημα → ανεπηρέαστο', () => {
    const s = fakeStorage({ [STATE_KEY]: JSON.stringify(state) })
    core(s).commitSync({ events: [ev(at), ev(at + 1)] })
    core(s).commitSync({ events: [ev(at - 50, 'psd125/q-x-1')] })
    assert.equal(JSON.parse(s.getItem(EVENTS_KEY)).length, 3)
  })
  test('reset που γράφεται στο ΙΔΙΟ commit ισχύει για τα events του', () => {
    const s = fakeStorage()
    assert.throws(() => core(s).commitSync({ events: [ev(at - 1)], state }), /reset/)
    assert.equal(s.getItem(STATE_KEY), null)
  })
})

describe('commitSync · αποτυχία ΚΑΙ του rollback, εκκρεμές σημάδι, ανάκτηση', () => {
  /** 1η εγγραφή (events) πετυχαίνει, 2η (state) αποτυγχάνει, το rollback της 1ης αποτυγχάνει. */
  function brokenAfterFirstWrite() {
    const before = { [EVENTS_KEY]: JSON.stringify([ev(T0 - 5)]), [STATE_KEY]: JSON.stringify({ other: 1 }) }
    const s = fakeStorage(before)
    let eventWrites = 0
    s.hooks.fail = (k) => (k === STATE_KEY || (k === EVENTS_KEY && ++eventWrites > 1) ? quota() : null)
    return { s, before }
  }
  test('rollback-incomplete, ΟΧΙ «δεν άλλαξε τίποτα»· το σημάδι μένει· η πραγματική (μισή) κατάσταση', () => {
    const { s } = brokenAfterFirstWrite()
    const e = ev()
    assert.throws(() => core(s).commitSync({ events: [e], state: { x: 1 } }), (err) => {
      assert.equal(err.outcome, 'rollback-incomplete')
      assert.doesNotMatch(err.message, /δεν άλλαξε τίποτα/)
      return true
    })
    assert.notEqual(s.getItem(TXN_KEY), null)
    assert.equal(JSON.parse(s.getItem(EVENTS_KEY)).at(-1).id, e.id)
  })
  test('όσο υπάρχει το σημάδι: κάθε commit (ένα ή δύο κλειδιά) → not-started, καμία αλλαγή', () => {
    const { s } = brokenAfterFirstWrite()
    assert.throws(() => core(s).commitSync({ events: [ev()], state: { x: 1 } }))
    s.hooks.fail = null
    const pending = s.dump()
    for (const change of [{ events: [ev(T0 + 1)] }, { state: { y: 1 } }, { events: [ev(T0 + 2)], state: { y: 1 } }]) {
      assert.throws(() => core(s).commitSync(change), (err) => err.outcome === 'not-started' && /μη ολοκληρωμένη/.test(err.message))
    }
    assert.deepEqual(s.dump(), pending)
  })
  test('ανάκτηση (recoverInterrupted) → rolled-back, byte-identical, και μετά οι εγγραφές συνεχίζουν', () => {
    const { s, before } = brokenAfterFirstWrite()
    assert.throws(() => core(s).commitSync({ events: [ev()], state: { x: 1 } }))
    s.hooks.fail = null
    assert.equal(recoverInterrupted(s).status, 'rolled-back')
    assert.deepEqual(s.dump(), before)
    core(s).commitSync({ events: [ev(T0 + 3)] })
  })
  test('διακοπή ΜΕΤΑ τις δύο εγγραφές (το σημάδι δεν σβήστηκε) → completed, κατάσταση «after»', () => {
    const s = fakeStorage({ [STATE_KEY]: JSON.stringify({ other: 1 }) })
    s.hooks.failRemove = (k) => (k === TXN_KEY ? new Error('κλείσιμο tab') : null)
    const e = ev()
    core(s).commitSync({ events: [e], state: { x: 1 } })
    s.hooks.failRemove = null
    assert.notEqual(s.getItem(TXN_KEY), null)
    assert.equal(recoverInterrupted(s).status, 'completed')
    assert.equal(s.getItem(TXN_KEY), null)
    assert.deepEqual(JSON.parse(s.getItem(EVENTS_KEY)), [e])
    assert.deepEqual(JSON.parse(s.getItem(STATE_KEY)), { other: 1, x: 1 })
  })
})

describe('απομόνωση από τα κλειδιά psd115-* (ρυθμίσεις και παλιά πρόοδος)', () => {
  const PSD115_KEYS = {
    'psd115-w1-study': JSON.stringify({ quizAnswered: 3, quizCorrect: 2, byCategory: {}, flashcardSeenIds: ['fc-1'], wrongBook: [] }),
    'psd115-w1-pavlov-checklist': '[true,false]',
    'psd115-w2-checklists': '{"overview":[true]}',
    'psd115-w1-theme': 'dark',
    'psd115-disclaimer-v1': '1',
  }
  test('καμία λειτουργία του πυρήνα δεν διαβάζει ή αγγίζει τα psd115-*· γράφονται μόνο τα δύο κλειδιά (και το σημάδι)', () => {
    const s = fakeStorage(PSD115_KEYS)
    const c = core(s)
    c.commitSync({ events: [ev()], state: { theme: 'light' } })
    c.commitSync({ state: { theme: undefined } })
    c.readSync()
    c.readState()
    c.pending()
    const exported = c.exportSync()
    assert.deepEqual(exported.state, {})
    assert.equal(exported.events.length, 1)
    assert.deepEqual(s.reads.filter((k) => k.startsWith('psd115-')), [], 'καμία ανάγνωση psd115-*')
    const after = s.dump()
    for (const [k, v] of Object.entries(PSD115_KEYS)) assert.equal(after[k], v, k)
    assert.deepEqual(Object.keys(after).filter((k) => !(k in PSD115_KEYS)).sort(), [EVENTS_KEY, STATE_KEY].sort())
  })
})
