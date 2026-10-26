/**
 * Phase 1E-4c-2 · G1 — progressStore.commit({ events, state }): ατομικότητα, ίδιοι έλεγχοι με το append, όριο reset.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { newEventId } from '../src/core/progress/events.js'
import { createProgressStore, EVENTS_KEY, STATE_KEY } from '../src/core/progress/progressStore.js'
import { MIGRATION_MARKER_KEY } from '../src/core/progress/keys.js'
import { resetStateKey, wrongBookStateKey } from '../src/core/progress/namespaces.js'

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
