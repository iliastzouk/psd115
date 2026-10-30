/**
 * Κοινά fixtures των tests της Φάσης 6a: fake storage (καταγραφή εγγραφών, αποτυχίες), δύο μαθήματα ΜΟΝΟ για tests
 * (`demo-a`, `demo-b`: δεν υπάρχουν στο περιεχόμενο της εφαρμογής) και builders για events / namespaces.
 */
import { createStudyContentAdapter, studyContentAdapters } from '../../src/core/progress/adapters/studyContent.js'
import { createStoreProgressService } from '../../src/core/progress/storeProgressService.js'
import { EVENTS_KEY, STATE_KEY } from '../../src/core/progress/progressStore.js'

export { EVENTS_KEY, STATE_KEY }
export const T0 = Date.UTC(2026, 9, 1, 12, 0, 0)

/** localStorage-like· `hooks.fail(key) → Error | null` για αποτυχίες εγγραφής· `writes` = κλειδιά που άλλαξαν. */
export function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init))
  const hooks = { fail: null, failRemove: null }
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
    removeItem(k) {
      const err = hooks.failRemove?.(k)
      if (err) throw err
      writes.push(`-${k}`)
      m.delete(k)
    },
    dump: () => Object.fromEntries(m),
    hooks,
    writes,
  }
}

/** Περιεχόμενο δοκιμαστικού μαθήματος: 3 ερωτήσεις, 3 κάρτες, 2 θέματα, 2 ομάδες. */
export function demoContent(prefix) {
  return {
    categories: [{ id: `${prefix}-g1`, label: 'G1' }, { id: `${prefix}-g2`, label: 'G2' }],
    quizQuestions: [1, 2, 3].map((n) => ({ id: `${prefix}-q${n}`, categoryId: n === 3 ? `${prefix}-g2` : `${prefix}-g1` })),
    flashcards: [1, 2, 3].map((n) => ({ id: `${prefix}-c${n}`, categoryId: `${prefix}-g1` })),
    topics: [{ id: `${prefix}-t1` }, { id: `${prefix}-t2` }],
  }
}

export const DEMO_ADAPTERS = Object.freeze({
  'demo-a': createStudyContentAdapter('demo-a', demoContent('a')),
  'demo-b': createStudyContentAdapter('demo-b', demoContent('b')),
})
/** PSD115 (πραγματικό περιεχόμενο) + τα δύο δοκιμαστικά μαθήματα. */
export const ALL_ADAPTERS = Object.freeze({ ...studyContentAdapters(), ...DEMO_ADAPTERS })

let seq = 0
/** UUID v4 ντετερμινιστικό για τα tests. */
export const uuid = (n = ++seq) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

export const answer = (courseId, local, { t = T0, ok = 1, ctx = 'quiz', id = uuid() } = {}) => ({ id, t, item: `${courseId}/${local}`, kind: 'answer', ok, ctx })
export const flip = (courseId, local, { t = T0, ctx = 'flash', id = uuid() } = {}) => ({ id, t, item: `${courseId}/${local}`, kind: 'flip', ctx })
export const self = (courseId, local, { t = T0, id = uuid() } = {}) => ({ id, t, item: `${courseId}/${local}`, kind: 'self', grade: 2, ctx: 'review' })
export const wrongEntry = (courseId, local, { uid = `u-${local}-${seq++}`, t = T0, group = null } = {}) => ({
  uid,
  item: `${courseId}/${local}`,
  group,
  question: `Q ${local}`,
  explanation: 'E',
  userLabel: 'A',
  correctLabel: 'B',
  t,
})

/** Storage με τα δοσμένα events / state ως raw τιμές (απόν = δεν γράφεται το κλειδί). */
export function storeWith({ events, state } = {}, extra = {}) {
  const init = { ...extra }
  if (events !== undefined) init[EVENTS_KEY] = JSON.stringify(events)
  if (state !== undefined) init[STATE_KEY] = JSON.stringify(state)
  return fakeStorage(init)
}

export const readEvents = (s) => JSON.parse(s.getItem(EVENTS_KEY) ?? '[]')
export const readState = (s) => JSON.parse(s.getItem(STATE_KEY) ?? '{}')

/** Ένα «tab» = ένας service πάνω στο storage. */
export function service(storage, { adapters = ALL_ADAPTERS, now = () => T0, recovery, warn = () => {}, newUid } = {}) {
  return createStoreProgressService({ adapters, storage, now, recovery, warn, ...(newUid ? { newUid } : {}) })
}
