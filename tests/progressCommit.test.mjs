/**
 * Phase 1E-4c-2 · G1 — progressStore.commit({ events, state }): ατομικότητα, ίδιοι έλεγχοι με το append, όριο reset.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { newEventId } from '../src/core/progress/events.js'
import { createProgressStore, EVENTS_KEY, STATE_KEY } from '../src/core/progress/progressStore.js'
import { MIGRATION_MARKER_KEY } from '../src/core/progress/keys.js'
import { resetStateKey, wrongBookStateKey } from '../src/core/progress/namespaces.js'
import { recoverInterrupted, TXN_KEY } from '../src/core/progress/transaction.js'

const T0 = Date.UTC(2026, 9, 20, 10, 0, 0)
function fakeStorage(init = {}, { failSet } = {}) {
  const m = new Map(Object.entries(init))
  return {
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
const ev = (t, item = 'psd115/q-w2-var-1', extra = {}) => ({ id: newEventId(), t, item, kind: 'answer', ok: 1, ctx: 'quiz', ...extra })
const WB = wrongBookStateKey('psd115')

describe('G1 · commit: ατομικότητα', () => {
  test('events + state σε ένα commit', async () => {
    const s = fakeStorage()
    const store = createProgressStore({ storage: s })
    const e = ev(T0)
    assert.deepEqual(await store.commit({ events: [e], state: { [WB]: { version: 1, entries: [] } } }), { events: 1, stateKeys: 1 })
    assert.deepEqual(JSON.parse(s.getItem(EVENTS_KEY)), [e])
    assert.deepEqual(JSON.parse(s.getItem(STATE_KEY))[WB], { version: 1, entries: [] })
  })

  test('αποτυχία της 2ης εγγραφής (state) → ΚΑΙ τα δύο κλειδιά byte-identical, κανένα μισό commit', async () => {
    const before = { [EVENTS_KEY]: JSON.stringify([ev(T0 - 5)]), [STATE_KEY]: JSON.stringify({ other: 1 }) }
    const s = fakeStorage(before)
    s.fail((k) => k === STATE_KEY)
    await assert.rejects(createProgressStore({ storage: s }).commit({ events: [ev(T0)], state: { [WB]: { version: 1, entries: [] } } }))
    assert.deepEqual(s.dump(), before)
  })

  test('αποτυχία της 1ης εγγραφής (events) → τίποτα δεν αλλάζει', async () => {
    const before = { [STATE_KEY]: JSON.stringify({ other: 1 }) }
    const s = fakeStorage(before)
    s.fail((k) => k === EVENTS_KEY)
    await assert.rejects(createProgressStore({ storage: s }).commit({ events: [ev(T0)], state: { x: 1 } }))
    assert.deepEqual(s.dump(), before)
  })

  test('state patch: undefined αφαιρεί, τα υπόλοιπα κλειδιά μένουν· χωρίς events δεν γράφεται log', async () => {
    const s = fakeStorage({ [STATE_KEY]: JSON.stringify({ a: 1, b: 2 }) })
    await createProgressStore({ storage: s }).commit({ state: { a: undefined, c: 3 } })
    assert.deepEqual(JSON.parse(s.getItem(STATE_KEY)), { b: 2, c: 3 })
    assert.equal(s.getItem(EVENTS_KEY), null)
  })

  test('το append είναι commit ενός event και γράφει ΣΥΓΧΡΟΝΑ (πριν από το await)', () => {
    const s = fakeStorage()
    const e = ev(T0)
    const p = createProgressStore({ storage: s }).append(e)
    assert.deepEqual(JSON.parse(s.getItem(EVENTS_KEY)), [e])
    return p
  })
})

describe('G1 · commit: ίδιοι έλεγχοι με το append (τίποτα δεν γράφεται)', () => {
  const marker = { [MIGRATION_MARKER_KEY]: { at: new Date(T0).toISOString() } }
  const cases = {
    'άκυρο event': () => ({ events: [{ id: 'x', t: 1, item: 'psd115/q', kind: 'answer', ctx: 'quiz' }] }),
    'διπλό id μέσα στο batch': () => {
      const e = ev(T0 + 1)
      return { events: [e, { ...e }] }
    },
    'event πριν από το όριο migration': () => ({ events: [ev(T0 - 1)] }),
    'μη αντικείμενο state': () => ({ events: [], state: [] }),
  }
  for (const [label, change] of Object.entries(cases)) {
    test(label, async () => {
      const before = { [STATE_KEY]: JSON.stringify(marker) }
      const s = fakeStorage(before)
      await assert.rejects(createProgressStore({ storage: s }).commit(change()))
      assert.deepEqual(s.dump(), before)
    })
  }
  test('id που υπάρχει ήδη στο log', async () => {
    const e = ev(T0 + 1)
    const before = { [EVENTS_KEY]: JSON.stringify([e]) }
    const s = fakeStorage(before)
    await assert.rejects(createProgressStore({ storage: s }).commit({ events: [{ ...e }], state: { x: 1 } }), /υπάρχει ήδη/i)
    assert.deepEqual(s.dump(), before)
  })
})

describe('G1 · όριο reset ανά μάθημα (F2)', () => {
  const at = T0 + 100
  const state = { [resetStateKey('psd115')]: { at: new Date(at).toISOString() } }
  test('event του μαθήματος πριν από το reset του → απόρριψη, τίποτα δεν γράφεται', async () => {
    const before = { [STATE_KEY]: JSON.stringify(state) }
    const s = fakeStorage(before)
    await assert.rejects(createProgressStore({ storage: s }).commit({ events: [ev(at - 1)] }), /reset/)
    await assert.rejects(createProgressStore({ storage: s }).append(ev(at - 1)), /reset/)
    assert.deepEqual(s.dump(), before)
  })
  test('στο όριο (t === at) και μετά → δεκτό· άλλο μάθημα → ανεπηρέαστο', async () => {
    const s = fakeStorage({ [STATE_KEY]: JSON.stringify(state) })
    const store = createProgressStore({ storage: s })
    await store.commit({ events: [ev(at), ev(at + 1)] })
    await store.commit({ events: [ev(at - 50, 'psd125/q-x-1')] })
    assert.equal(JSON.parse(s.getItem(EVENTS_KEY)).length, 3)
  })
  test('reset που γράφεται στο ΙΔΙΟ commit ισχύει για τα events του', async () => {
    const s = fakeStorage()
    await assert.rejects(
      createProgressStore({ storage: s }).commit({ events: [ev(at - 1)], state }),
      /reset/,
    )
    assert.equal(s.getItem(STATE_KEY), null)
  })
})

describe('G1 · αποτυχία ΚΑΙ του rollback: ρητά αβέβαιο αποτέλεσμα, σημάδι, ανάκτηση (review PR #11)', () => {
  /** 1η εγγραφή (events) πετυχαίνει, 2η (state) αποτυγχάνει, το rollback της 1ης αποτυγχάνει. */
  function brokenAfterFirstWrite() {
    const before = { [EVENTS_KEY]: JSON.stringify([ev(T0 - 5)]), [STATE_KEY]: JSON.stringify({ other: 1 }) }
    const s = fakeStorage(before)
    let eventWrites = 0
    s.fail((k) => k === STATE_KEY || (k === EVENTS_KEY && ++eventWrites > 1))
    return { s, before }
  }

  test('commit → outcome rollback-incomplete, ΟΧΙ «δεν άλλαξε τίποτα»· το σημάδι μένει', async () => {
    const { s } = brokenAfterFirstWrite()
    const e = ev(T0)
    await assert.rejects(createProgressStore({ storage: s }).commit({ events: [e], state: { [WB]: { version: 1, entries: [] } } }), (err) => {
      assert.equal(err.outcome, 'rollback-incomplete')
      assert.doesNotMatch(err.message, /δεν άλλαξε τίποτα/)
      return true
    })
    assert.notEqual(s.getItem(TXN_KEY), null, 'το σημάδι μένει για την ανάκτηση')
    assert.equal(JSON.parse(s.getItem(EVENTS_KEY)).at(-1).id, e.id, 'η πραγματική (μισή) κατάσταση: το event γράφτηκε')
  })

  test('όσο υπάρχει το σημάδι: append / commit / setState → not-started, καμία αλλαγή', async () => {
    const { s } = brokenAfterFirstWrite()
    const store = createProgressStore({ storage: s })
    await assert.rejects(store.commit({ events: [ev(T0)], state: { x: 1 } }))
    s.fail(null)
    const pending = s.dump()
    for (const write of [() => store.append(ev(T0 + 1)), () => store.commit({ events: [ev(T0 + 2)], state: { y: 1 } }), () => store.setState('z', 1)]) {
      await assert.rejects(write(), (err) => err.outcome === 'not-started')
    }
    assert.deepEqual(s.dump(), pending)
  })

  test('ανάκτηση στην εκκίνηση (recoverInterrupted) → rolled-back: και τα δύο κλειδιά byte-identical, χωρίς σημάδι', async () => {
    const { s, before } = brokenAfterFirstWrite()
    await assert.rejects(createProgressStore({ storage: s }).commit({ events: [ev(T0)], state: { x: 1 } }))
    s.fail(null) // το storage «ελευθερώθηκε» (π.χ. νέα εκκίνηση)
    assert.equal(recoverInterrupted(s).status, 'rolled-back')
    assert.deepEqual(s.dump(), before)
    await createProgressStore({ storage: s }).append(ev(T0 + 3)) // και μετά οι εγγραφές συνεχίζουν
  })

  test('διακοπή ΜΕΤΑ τις δύο εγγραφές (το σημάδι δεν σβήστηκε) → completed, κατάσταση «after»', async () => {
    const s = fakeStorage({ [STATE_KEY]: JSON.stringify({ other: 1 }) })
    const orig = s.removeItem
    s.removeItem = (k) => {
      if (k === TXN_KEY) throw new Error('κλείσιμο tab')
      orig(k)
    }
    const e = ev(T0)
    await createProgressStore({ storage: s }).commit({ events: [e], state: { x: 1 } })
    s.removeItem = orig
    assert.notEqual(s.getItem(TXN_KEY), null)
    assert.equal(recoverInterrupted(s).status, 'completed')
    assert.equal(s.getItem(TXN_KEY), null)
    assert.deepEqual(JSON.parse(s.getItem(EVENTS_KEY)), [e])
    assert.deepEqual(JSON.parse(s.getItem(STATE_KEY)), { other: 1, x: 1 })
  })

  test('outcomes: αποτυχία με επιτυχές rollback → rolled-back· αποτυχία ενός κλειδιού → not-started (byte-identical)', async () => {
    const before = { [STATE_KEY]: JSON.stringify({ other: 1 }) }
    const s = fakeStorage(before)
    s.fail((k) => k === STATE_KEY)
    await assert.rejects(createProgressStore({ storage: s }).commit({ events: [ev(T0)], state: { x: 1 } }), (err) => err.outcome === 'rolled-back')
    assert.deepEqual(s.dump(), before)
    await assert.rejects(createProgressStore({ storage: s }).setState('x', 1), (err) => err.outcome === 'not-started')
    s.fail((k) => k === EVENTS_KEY)
    await assert.rejects(createProgressStore({ storage: s }).append(ev(T0)), (err) => err.outcome === 'not-started')
    assert.deepEqual(s.dump(), before)
  })
})
