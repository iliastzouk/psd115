/**
 * Tests της νέας υποδομής προόδου (Phase 0B). Run: npm test
 * Χρησιμοποιούν fake Storage· δεν χρειάζονται browser.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { validateEvent, newEventId } from '../src/core/progress/events.js'
import {
  createProgressStore,
  EVENTS_KEY,
  STATE_KEY,
  ProgressStoreError,
} from '../src/core/progress/progressStore.js'
import { requestPersistentStorage } from '../src/core/progress/persist.js'

const NOW = Date.UTC(2026, 8, 28, 12, 0, 0)

/** Ελάχιστο Storage σε μνήμη. `failOn(key)` προσομοιώνει γεμάτο storage για ένα κλειδί. */
function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial))
  let failKey = null
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      if (k === failKey) {
        const e = new Error('quota')
        e.name = 'QuotaExceededError'
        throw e
      }
      map.set(k, String(v))
    },
    removeItem: (k) => map.delete(k),
    snapshot: () => Object.fromEntries(map),
    failOn: (k) => {
      failKey = k
    },
  }
}

const mkStore = (initial) => {
  const storage = fakeStorage(initial)
  return { storage, store: createProgressStore({ storage, now: () => NOW }) }
}

let seq = 0
const ev = (over = {}) => ({
  id: newEventId(),
  t: NOW - 1000 + seq++,
  item: 'psd115/q-w2-overview-1',
  kind: 'answer',
  ok: 1,
  ctx: 'quiz',
  ...over,
})
/** Event αυτοαξιολόγησης/κάρτας: έχει grade αντί για ok. */
const graded = (over = {}) => {
  const { ok: _ok, ...rest } = ev({ kind: 'self', grade: 2, ...over })
  return rest
}

// Υπάρχουσα πρόοδος PSD115 όπως στο πραγματικό localStorage.
const PSD115_KEYS = {
  'psd115-w1-study': JSON.stringify({ quizAnswered: 3, quizCorrect: 2, byCategory: {}, flashcardSeenIds: ['fc-1'], wrongBook: [] }),
  'psd115-w1-pavlov-checklist': '[true,false]',
  'psd115-w2-checklists': '{"overview":[true]}',
  'psd115-w1-theme': 'dark',
  'psd115-disclaimer-v1': '1',
}

describe('Event validation', () => {
  const v = (e) => validateEvent(e)

  test('έγκυρο event γίνεται δεκτό (και με όλα τα προαιρετικά πεδία)', () => {
    assert.equal(v(ev()).ok, true)
    assert.equal(v(graded({ kind: 'flip', conf: 3, ctx: 'flash', session: 's-1' })).ok, true)
    const minimal = { id: newEventId(), t: NOW, item: 'fc-pavlov-1', kind: 'self', ctx: 'exam' }
    assert.equal(v(minimal).ok, true, 'ok/grade/conf/session είναι προαιρετικά')
  })

  test('τα προαιρετικά πεδία δεν εξαρτώνται από το kind (μόνο δομικός έλεγχος)', () => {
    const { ok: _ok, ...answerWithoutOk } = ev()
    assert.equal(v(answerWithoutOk).ok, true, 'answer χωρίς ok (αποτέλεσμα όχι ακόμα διαθέσιμο)')
    assert.equal(v({ id: newEventId(), t: NOW, item: 'fc-1', kind: 'flip', ctx: 'flash' }).ok, true, 'flip χωρίς grade')
    assert.equal(v({ id: newEventId(), t: NOW, item: 'x', kind: 'self', ctx: 'exam', conf: 2 }).ok, true, 'self με conf χωρίς grade')
  })

  test('ctx είναι υποχρεωτικό', () => {
    const { ctx: _ctx, ...noCtx } = ev()
    assert.equal(v(noCtx).ok, false)
  })

  test('άκυρο UUID απορρίπτεται', () => {
    for (const id of ['', 'abc', '123', 42, null, '00000000-0000-0000-0000-000000000000x']) {
      assert.equal(v(ev({ id })).ok, false, String(id))
    }
  })

  test('άκυρο timestamp απορρίπτεται', () => {
    const seconds = Math.floor(NOW / 1000) // λάθος μονάδα: δευτερόλεπτα αντί για ms
    for (const t of ['2026-09-28', NaN, Infinity, 1.5, -1, 0, seconds, Date.UTC(2019, 0, 1), undefined]) {
      assert.equal(v(ev({ t })).ok, false, String(t))
    }
  })

  test('timestamp στο μέλλον (λάθος ρολόι / offline συσκευή) παραμένει έγκυρο', () => {
    assert.equal(v(ev({ t: Date.now() + 30 * 86400000 })).ok, true)
    assert.equal(v(ev({ t: Date.UTC(2099, 0, 1) })).ok, true)
  })

  test('άκυρο kind απορρίπτεται', () => {
    for (const kind of ['', 'ANSWER', 'view', undefined]) assert.equal(v(ev({ kind })).ok, false, String(kind))
  })

  test('άκυρο ctx απορρίπτεται', () => {
    for (const ctx of ['', 'home', 'Quiz', 1]) assert.equal(v(ev({ ctx })).ok, false, String(ctx))
  })

  test('άκυρες τιμές enum απορρίπτονται (ok, grade, conf)', () => {
    for (const ok of [2, -1, true, '1']) assert.equal(v(ev({ ok })).ok, false, `ok=${ok}`)
    for (const grade of [4, -1, 1.5, '2']) assert.equal(v(ev({ kind: 'self', grade })).ok, false, `grade=${grade}`)
    for (const conf of [0, 4, '2']) assert.equal(v(ev({ conf })).ok, false, `conf=${conf}`)
  })

  test('άκυρο item / session / άγνωστο πεδίο απορρίπτονται', () => {
    for (const item of ['', '   ', ' q-1', 'q-1 ', 42, null, undefined]) assert.equal(v(ev({ item })).ok, false, String(item))
    for (const session of ['', ' x', 'a'.repeat(200), 5]) assert.equal(v(ev({ session })).ok, false, String(session))
    assert.equal(v(ev({ accuracy: 0.9 })).ok, false, 'παράγωγα πεδία δεν επιτρέπονται')
  })

  test('item: οποιοδήποτε σταθερό μη κενό string (το format ορίζεται στο Phase 1)', () => {
    for (const item of ['q-w2-overview-1', 'psd115/q-w2-overview-1', 'psd115:fc-pavlov-1', 'Κάρτα 1']) {
      assert.equal(v(ev({ item })).ok, true, item)
    }
  })
})

describe('Append', () => {
  test('ένα event προστίθεται', async () => {
    const { store } = mkStore()
    const e = ev()
    await store.append(e)
    assert.deepEqual(await store.query(), [e])
  })

  test('πολλά events κρατούν τη σειρά εισαγωγής', async () => {
    const { store } = mkStore()
    const list = [ev({ t: NOW - 10 }), ev({ t: NOW - 500 }), ev({ t: NOW - 1 })]
    for (const e of list) await store.append(e)
    assert.deepEqual((await store.query()).map((e) => e.id), list.map((e) => e.id))
  })

  test('διπλό id δεν αντικαθιστά το υπάρχον event', async () => {
    const { store } = mkStore()
    const e = ev({ ok: 1 })
    await store.append(e)
    await assert.rejects(store.append({ ...e, ok: 0 }), ProgressStoreError)
    await assert.rejects(store.append({ ...e }), ProgressStoreError, 'ακόμα και πανομοιότυπο')
    assert.deepEqual(await store.query(), [e])
  })

  test('άκυρο event δεν γράφει τίποτα', async () => {
    const { store, storage } = mkStore()
    await assert.rejects(store.append(ev({ kind: 'nope' })), ProgressStoreError)
    assert.equal(storage.getItem(EVENTS_KEY), null)
  })

  test('τα αποτελέσματα δεν μπορούν να αλλάξουν τα αποθηκευμένα events', async () => {
    const { store } = mkStore()
    const e = ev()
    await store.append(e)
    e.ok = 0 // αλλαγή στο αντικείμενο του καλούντα
    const [r] = await store.query()
    r.ok = 0
    assert.equal((await store.query())[0].ok, 1)
  })

  test('κατεστραμμένο log δεν αντικαθίσταται σιωπηλά', async () => {
    const { store, storage } = mkStore({ [EVENTS_KEY]: '{not json' })
    await assert.rejects(store.append(ev()), ProgressStoreError)
    assert.equal(storage.getItem(EVENTS_KEY), '{not json')
  })

  test('αποτυχία εγγραφής (γεμάτο storage) δεν αλλάζει τίποτα', async () => {
    const { store, storage } = mkStore()
    const e = ev()
    await store.append(e)
    const before = storage.snapshot()
    storage.failOn(EVENTS_KEY)
    await assert.rejects(store.append(ev()), ProgressStoreError)
    assert.deepEqual(storage.snapshot(), before)
  })
})

describe('Query', () => {
  const setup = async () => {
    const { store } = mkStore()
    const a = ev({ item: 'psd115/q-a', ctx: 'quiz', session: 's1', t: NOW - 3000 })
    const b = ev({ item: 'psd115/q-b', ctx: 'lesson', session: 's1', t: NOW - 2000 })
    const c = ev({ item: 'psd115/q-a', ctx: 'review', session: 's2', t: NOW - 1000 })
    const d = graded({ item: 'psd115/fc-1', kind: 'flip', grade: 3, ctx: 'flash', t: NOW - 500 })
    for (const e of [a, b, c, d]) await store.append(e)
    return { store, a, b, c, d }
  }
  const ids = (list) => list.map((e) => e.id)

  test('κατά item', async () => {
    const { store, a, c } = await setup()
    assert.deepEqual(ids(await store.query({ item: 'psd115/q-a' })), ids([a, c]))
  })
  test('κατά context (και kind)', async () => {
    const { store, b, d } = await setup()
    assert.deepEqual(ids(await store.query({ ctx: 'lesson' })), ids([b]))
    assert.deepEqual(ids(await store.query({ kind: 'flip' })), ids([d]))
  })
  test('κατά session (και συνδυασμός φίλτρων)', async () => {
    const { store, a, b } = await setup()
    assert.deepEqual(ids(await store.query({ session: 's1' })), ids([a, b]))
    assert.deepEqual(ids(await store.query({ session: 's1', ctx: 'quiz' })), ids([a]))
  })
  test('κατά χρονικό διάστημα (from ≤ t < to)', async () => {
    const { store, b, c } = await setup()
    assert.deepEqual(ids(await store.query({ from: NOW - 2000, to: NOW - 500 })), ids([b, c]))
  })
  test('άγνωστο φίλτρο απορρίπτεται (όχι σιωπηλό «όλα»)', async () => {
    const { store } = await setup()
    await assert.rejects(store.query({ items: 'psd115/q-a' }), ProgressStoreError)
  })
})

describe('State', () => {
  test('set/get λειτουργεί και επιστρέφει αντίγραφο', async () => {
    const { store } = mkStore()
    await store.setState('checklist:psd115/pavlov', [true, false])
    assert.deepEqual(await store.getState('checklist:psd115/pavlov'), [true, false])
    const got = await store.getState('checklist:psd115/pavlov')
    got.push(true)
    assert.deepEqual(await store.getState('checklist:psd115/pavlov'), [true, false])
    assert.equal(await store.getState('missing'), undefined)
    await store.setState('checklist:psd115/pavlov', undefined)
    assert.equal(await store.getState('checklist:psd115/pavlov'), undefined)
  })

  test('το state είναι ξεχωριστό από τα events', async () => {
    const { store, storage } = mkStore()
    await store.append(ev())
    await store.setState('theme', 'dark')
    assert.equal((await store.query()).length, 1)
    assert.deepEqual(JSON.parse(storage.getItem(STATE_KEY)), { theme: 'dark' })
    assert.equal(JSON.parse(storage.getItem(EVENTS_KEY)).length, 1)
  })

  test('μη-JSON τιμή απορρίπτεται', async () => {
    const { store } = mkStore()
    await assert.rejects(store.setState('fn', () => 1), ProgressStoreError)
  })
})

describe('Export / import', () => {
  test('έγκυρο export εισάγεται σε άλλο store', async () => {
    const { store: a } = mkStore()
    await a.append(ev())
    await a.append(graded({ ctx: 'exam' }))
    await a.setState('theme', 'dark')
    const data = await a.exportAll()
    assert.equal(data.format, 'study-progress')
    assert.equal(data.version, 1)

    const { store: b } = mkStore()
    assert.deepEqual(await b.importAll(data), { added: 2, skipped: 0, stateKeys: 1 })
    assert.deepEqual(await b.query(), data.events)
    assert.equal(await b.getState('theme'), 'dark')
  })

  test('επανάληψη της ίδιας εισαγωγής δεν διπλασιάζει τίποτα (idempotent)', async () => {
    const { store: a } = mkStore()
    await a.append(ev())
    const data = await a.exportAll()
    const { store: b } = mkStore()
    await b.importAll(data)
    assert.deepEqual(await b.importAll(data), { added: 0, skipped: 1, stateKeys: 0 })
    assert.equal((await b.query()).length, 1)
  })

  test('κακοσχηματισμένο export απορρίπτεται', async () => {
    const { store } = mkStore()
    for (const bad of [null, [], {}, { format: 'study-progress', version: 2, events: [], state: {} }, { format: 'x', version: 1, events: [], state: {} }, { format: 'study-progress', version: 1, events: {}, state: {} }]) {
      await assert.rejects(store.importAll(bad), ProgressStoreError, JSON.stringify(bad))
    }
  })

  test('ένα άκυρο event ακυρώνει ΟΛΗ την εισαγωγή και δεν αλλάζει τίποτα', async () => {
    const { store, storage } = mkStore()
    await store.append(ev())
    await store.setState('k', 1)
    const before = storage.snapshot()
    const data = { format: 'study-progress', version: 1, events: [ev(), ev({ ok: 7 }), ev()], state: { k: 2 } }
    await assert.rejects(store.importAll(data), ProgressStoreError)
    assert.deepEqual(storage.snapshot(), before)
  })

  test('ίδιο id με διαφορετικό περιεχόμενο → απόρριψη, τίποτα δεν αλλάζει', async () => {
    const { store, storage } = mkStore()
    const e = ev({ ok: 1 })
    await store.append(e)
    const before = storage.snapshot()
    const data = { format: 'study-progress', version: 1, events: [ev(), { ...e, ok: 0 }], state: {} }
    await assert.rejects(store.importAll(data), ProgressStoreError)
    assert.deepEqual(storage.snapshot(), before)
  })

  test('διπλό id μέσα στο ίδιο αρχείο απορρίπτεται', async () => {
    const { store } = mkStore()
    const e = ev()
    await assert.rejects(store.importAll({ format: 'study-progress', version: 1, events: [e, { ...e }], state: {} }), ProgressStoreError)
  })

  test('αποτυχία εγγραφής στη μέση της εισαγωγής → επαναφορά (ατομικότητα)', async () => {
    const { store, storage } = mkStore()
    await store.append(ev())
    await store.setState('k', 1)
    const before = storage.snapshot()
    storage.failOn(STATE_KEY) // τα events γράφονται, το state αποτυγχάνει
    await assert.rejects(
      store.importAll({ format: 'study-progress', version: 1, events: [ev()], state: { k: 2 } }),
      ProgressStoreError,
    )
    assert.deepEqual(storage.snapshot(), before)
  })
})

describe('Isolation from existing PSD115 storage', () => {
  test('καμία λειτουργία του store δεν αγγίζει τα κλειδιά psd115-*', async () => {
    const { store, storage } = mkStore(PSD115_KEYS)
    await store.append(ev())
    await store.query({ item: 'psd115/q-w2-overview-1' })
    await store.setState('theme', 'light')
    await store.getState('theme')
    const exported = await store.exportAll()
    await store.importAll({ ...exported, events: [...exported.events, ev()] })
    await assert.rejects(store.importAll({ bad: true }))
    await store.setState('theme', undefined)

    const snap = storage.snapshot()
    for (const [k, v] of Object.entries(PSD115_KEYS)) assert.equal(snap[k], v, k)
    const newKeys = Object.keys(snap).filter((k) => !(k in PSD115_KEYS))
    assert.deepEqual(newKeys.sort(), [EVENTS_KEY, STATE_KEY].sort())
    assert.ok(!EVENTS_KEY.startsWith('psd115-') && !STATE_KEY.startsWith('psd115-'))
  })

  test('το export του store δεν περιέχει δεδομένα psd115-*', async () => {
    const { store } = mkStore(PSD115_KEYS)
    const data = await store.exportAll()
    assert.deepEqual(data.events, [])
    assert.deepEqual(data.state, {})
  })
})

describe('Persistent storage request', () => {
  test('χωρίς StorageManager → unsupported, χωρίς σφάλμα', async () => {
    assert.equal(await requestPersistentStorage({ navigator: undefined }), 'unsupported')
    assert.equal(await requestPersistentStorage({ navigator: {} }), 'unsupported')
  })
  test('granted / denied / already / error', async () => {
    const nav = (persisted, persist) => ({ storage: { persisted: async () => persisted, persist } })
    assert.equal(await requestPersistentStorage({ navigator: nav(false, async () => true) }), 'granted')
    assert.equal(await requestPersistentStorage({ navigator: nav(false, async () => false) }), 'denied')
    assert.equal(await requestPersistentStorage({ navigator: nav(true, async () => true) }), 'already')
    assert.equal(
      await requestPersistentStorage({ navigator: nav(false, async () => { throw new Error('x') }) }),
      'error',
    )
  })
})
