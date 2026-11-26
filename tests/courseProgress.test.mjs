/**
 * Φάση 6a — υπολογισμός προόδου ανά μάθημα από το νέο store (src/core/progress/courseProgress.js).
 *
 *  J4  ταξινόμηση events: global (schema / id / global id) · opaque · orphan · λάθος τύπος (μόνο στους μετρήσιμους
 *      συνδυασμούς, μόνο t ≥ R) · self και άλλα ctx κρατιούνται χωρίς να μετρούν
 *  J5  canonicalWrongBook (ΜΙΑ κανονικοποίηση, (t, uid), όριο 60) · high-water mark H_c · resetTime / nextTime
 *  J6  καθολικός κανόνας t ≥ R (events, wrongBook, checklists) · απόν namespace = κενό · άκυρο → unavailable
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CHECKLISTS_VERSION,
  WRONG_BOOK_LIMIT,
  canonicalWrongBook,
  courseNamespaces,
  courseProgress,
  nextTime,
  parseStoreData,
  resetTime,
} from '../src/core/progress/courseProgress.js'
import { createStudyContentAdapter, studyContentAdapters } from '../src/core/progress/adapters/studyContent.js'
import { CATEGORIES, flashcards, quizQuestions } from '../content/courses/psd115/questions.js'
import { topics } from '../content/courses/psd115/topics.js'
import { DEMO_ADAPTERS, T0, answer, flip, self, uuid, wrongEntry } from './helpers/progressFixtures.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const A = DEMO_ADAPTERS['demo-a']
const WB = 'progress:wrongbook:demo-a'
const CL = 'progress:checklists:demo-a'
const RS = 'progress:reset:demo-a'
const iso = (ms) => new Date(ms).toISOString()
const run = (events, state = {}) => courseProgress({ courseId: 'demo-a', content: A, events, state })

describe('adapter από το STUDY_CONTENT', () => {
  test('PSD115: ανεξάρτητες αναμενόμενες τιμές από το περιεχόμενο (ερωτήσεις, κάρτες, θέματα, κατηγορίες, άγνωστο id)', () => {
    const a = studyContentAdapters().psd115
    for (const q of quizQuestions) {
      assert.deepEqual([a.isQuestion(q.id), a.isCard(q.id), a.hasTopic(q.id), a.groupOf(q.id), a.hasGroup(q.categoryId)], [true, false, false, q.categoryId, true], q.id)
    }
    for (const c of flashcards) assert.deepEqual([a.isCard(c.id), a.isQuestion(c.id), a.hasTopic(c.id), a.groupOf(c.id)], [true, false, false, null], c.id)
    for (const t of topics) assert.deepEqual([a.hasTopic(t.id), a.isQuestion(t.id), a.isCard(t.id)], [true, false, false], t.id)
    // Κάθε κατηγορία του περιεχομένου είναι ομάδα — και όσες δεν έχουν ερώτηση στο συγκεκριμένο σύνολο.
    for (const g of CATEGORIES) assert.equal(a.hasGroup(g.id), true, g.id)
    for (const f of ['isQuestion', 'isCard', 'hasTopic', 'hasGroup']) assert.equal(a[f]('nope'), false, f)
    assert.equal(a.groupOf('nope'), null)
  })
  test('κατηγορία χωρίς ερώτηση είναι ομάδα· categoryId ερώτησης εκτός κατηγοριών ΔΕΝ γίνεται ομάδα', () => {
    const a = createStudyContentAdapter('demo-x', {
      categories: [{ id: 'g-with' }, { id: 'g-empty' }],
      quizQuestions: [{ id: 'q1', categoryId: 'g-with' }, { id: 'q2', categoryId: 'g-stray' }],
      flashcards: [],
      topics: [],
    })
    assert.deepEqual([a.hasGroup('g-with'), a.hasGroup('g-empty'), a.hasGroup('g-stray')], [true, true, false])
    assert.equal(a.groupOf('q2'), 'g-stray')
  })
  test('ένας adapter ανά μάθημα του STUDY_CONTENT (μόνο psd115 σήμερα)', () => {
    assert.deepEqual(Object.keys(studyContentAdapters()), ['psd115'])
  })
})

describe('J4 · global έλεγχοι (parseStoreData)', () => {
  test('άκυρο schema / διπλό id με άλλο περιεχόμενο / μη global item → ok: false', () => {
    const e = answer('demo-a', 'a-q1')
    assert.equal(parseStoreData({ events: [{ ...e, kind: 'nope' }], state: {} }).ok, false)
    assert.equal(parseStoreData({ events: [e, { ...e, ok: 0 }], state: {} }).ok, false)
    assert.equal(parseStoreData({ events: [{ ...e, item: 'χωρίς-μάθημα' }], state: {} }).ok, false)
    assert.equal(parseStoreData({ events: [], state: [] }).ok, false)
  })
  test('ίδιο event δύο φορές → μετριέται μία φορά, προειδοποίηση', () => {
    const e = answer('demo-a', 'a-q1')
    const r = parseStoreData({ events: [e, { ...e }], state: {} })
    assert.equal(r.ok, true)
    assert.equal(r.byCourse.get('demo-a').length, 1)
    assert.equal(r.warnings.length, 1)
  })
  test('events άλλων μαθημάτων (και εκτός registry) ομαδοποιούνται χωριστά — opaque για τον υπολογισμό', () => {
    const r = parseStoreData({ events: [answer('demo-a', 'a-q1'), answer('no-such-course', 'x')], state: {} })
    assert.deepEqual([...r.byCourse.keys()], ['demo-a', 'no-such-course'])
  })
})

describe('J4 · ταξινόμηση events ενός μαθήματος', () => {
  test('μετρούν ΜΟΝΟ answer+quiz σε ερώτηση και flip+flash σε κάρτα', () => {
    const r = run([answer('demo-a', 'a-q1'), answer('demo-a', 'a-q3', { ok: 0 }), flip('demo-a', 'a-c1'), flip('demo-a', 'a-c1')])
    assert.equal(r.status, 'ready')
    assert.deepEqual([r.snapshot.quizAnswered, r.snapshot.quizCorrect], [2, 1])
    assert.deepEqual(r.snapshot.byGroup, { 'a-g1': { correct: 1, wrong: 0 }, 'a-g2': { correct: 0, wrong: 1 } })
    assert.deepEqual(r.snapshot.flashcardSeenIds, ['demo-a/a-c1'])
  })
  test('answer+quiz σε κάρτα / flip+flash σε ερώτηση (t ≥ R) → unavailable', () => {
    assert.equal(run([answer('demo-a', 'a-c1')]).status, 'unavailable')
    assert.equal(run([flip('demo-a', 'a-q1')]).status, 'unavailable')
  })
  test('ο έλεγχος τύπου ΔΕΝ εφαρμόζεται σε μη μετρήσιμους συνδυασμούς (answer+review σε κάρτα, flip+lesson σε ερώτηση)', () => {
    const r = run([answer('demo-a', 'a-c1', { ctx: 'review' }), flip('demo-a', 'a-q1', { ctx: 'lesson' })])
    assert.equal(r.status, 'ready')
    assert.deepEqual([r.snapshot.quizAnswered, r.snapshot.flashcardSeenIds.length], [0, 0])
    assert.equal(r.warnings.length, 0)
  })
  test('self σε υπαρκτή ερώτηση ή κάρτα → κρατιέται, δεν μετρά, χωρίς προειδοποίηση', () => {
    const r = run([self('demo-a', 'a-q1'), self('demo-a', 'a-c1')])
    assert.equal(r.status, 'ready')
    assert.deepEqual([r.snapshot.quizAnswered, r.snapshot.flashcardSeenIds.length, r.warnings.length], [0, 0, 0])
    assert.equal(r.visible.length, 2)
  })
  test('orphan (id που δεν υπάρχει πια, κάθε kind/ctx) → ready, δεν μετρά, προειδοποίηση', () => {
    const r = run([answer('demo-a', 'gone-q'), flip('demo-a', 'gone-c'), self('demo-a', 'gone-s'), answer('demo-a', 'gone-r', { ctx: 'review' })])
    assert.equal(r.status, 'ready')
    assert.deepEqual([r.snapshot.quizAnswered, r.snapshot.flashcardSeenIds.length], [0, 0])
    assert.equal(r.warnings.filter((w) => w.startsWith('orphan')).length, 4)
  })
  test('λάθος τύπος ΠΡΙΝ από το reset (t < R) → δεν έχει σημασία, ready', () => {
    const r = run([answer('demo-a', 'a-c1', { t: T0 })], { [RS]: { at: iso(T0 + 1) } })
    assert.equal(r.status, 'ready')
  })
})

describe('J6-Γ · namespaces: απόν = κενό, άκυρο = unavailable', () => {
  test('χωρίς κανένα κλειδί → κενή πρόοδος, ready', () => {
    const r = run([], {})
    assert.equal(r.status, 'ready')
    assert.deepEqual([r.snapshot.wrongBook, r.snapshot.checklists], [[], {}])
  })
  test('άκυρα namespaces → unavailable με το κλειδί στο `invalid`', () => {
    const cases = [
      [WB, { version: 1, entries: [{ uid: 'x' }] }],
      [WB, { version: 1, entries: [wrongEntry('demo-a', 'a-q1', { t: null })] }],
      [WB, { version: 1, entries: [wrongEntry('demo-b', 'b-q1')] }],
      [WB, { version: 1, entries: [wrongEntry('demo-a', 'a-q1', { uid: 'd' }), wrongEntry('demo-a', 'a-q2', { uid: 'd' })] }],
      [CL, { version: 1, topics: {} }],
      [CL, { version: CHECKLISTS_VERSION, topics: { 'a-t1': { items: [true] } } }],
      [CL, { version: CHECKLISTS_VERSION, topics: { 'a-t1': { items: ['x'], t: T0 } } }],
      [RS, { at: 'όχι ημερομηνία' }],
      [RS, { at: iso(T0), extra: 1 }],
    ]
    for (const [key, value] of cases) {
      const r = run([], { [key]: value })
      assert.equal(r.status, 'unavailable', JSON.stringify(value))
      assert.deepEqual(r.invalid, [key])
    }
  })
  test('high-water mark: το κατεστραμμένο namespace εξαιρείται, τα έγκυρα και όλα τα events μετρούν', () => {
    const r = run([answer('demo-a', 'a-q1', { t: T0 + 5 })], {
      [WB]: { version: 1, entries: [{ broken: true }] },
      [CL]: { version: CHECKLISTS_VERSION, topics: { 'a-t1': { items: [true], t: T0 + 9 } } },
    })
    assert.equal(r.status, 'unavailable')
    assert.equal(r.high, T0 + 9)
  })
})

describe('J5 · canonicalWrongBook — μία κανονικοποίηση', () => {
  const entries = [5, 1, 3, 3, 2].map((d, i) => wrongEntry('demo-a', 'a-q1', { uid: `u${'edcba'[i]}`, t: T0 + d }))
  test('σειρά (t, uid)· ίδια για κάθε μετάθεση της εισόδου', () => {
    const expected = canonicalWrongBook(entries).map((e) => e.uid)
    assert.deepEqual(expected, ['ud', 'ua', 'ub', 'uc', 'ue'], 'ίσα t → κατά uid')
    for (let k = 0; k < 20; k++) {
      const shuffled = [...entries].sort(() => Math.random() - 0.5)
      assert.deepEqual(canonicalWrongBook(shuffled).map((e) => e.uid), expected)
    }
  })
  test(`όριο ${WRONG_BOOK_LIMIT}, με ίσα t: φεύγουν τα πρώτα στη σειρά (t, uid)`, () => {
    const many = Array.from({ length: WRONG_BOOK_LIMIT + 5 }, (_, i) => wrongEntry('demo-a', 'a-q1', { uid: `u${String(i).padStart(3, '0')}`, t: T0 }))
    const out = canonicalWrongBook([...many].reverse())
    assert.equal(out.length, WRONG_BOOK_LIMIT)
    assert.equal(out[0].uid, 'u005')
  })
  test('φίλτρο t ≥ resetAt· δεν τροποποιεί την είσοδο', () => {
    const copy = structuredClone(entries)
    assert.deepEqual(canonicalWrongBook(entries, { resetAt: T0 + 3 }).map((e) => e.t), [T0 + 3, T0 + 3, T0 + 5])
    assert.deepEqual(entries, copy)
  })
  test('το snapshot χρησιμοποιεί την ίδια κανονικοποίηση (ίδιο αποτέλεσμα για κάθε σειρά αποθήκευσης)', () => {
    const a = run([], { [WB]: { version: 1, entries } }).snapshot.wrongBook
    const b = run([], { [WB]: { version: 1, entries: [...entries].reverse() } }).snapshot.wrongBook
    assert.deepEqual(a, b)
    assert.deepEqual(a, canonicalWrongBook(entries))
  })
  test('guard: καμία άλλη ταξινόμηση ή αποκοπή wrongBook στο src/', () => {
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
    for (const f of walk(path.join(root, 'src')).filter((x) => /\.(js|jsx)$/.test(x))) {
      const code = fs.readFileSync(f, 'utf8')
      // Η ΜΟΝΗ εξαίρεση: η ίδια η κανονικοποίηση (canonicalWrongBook: sort, slice, WRONG_BOOK_LIMIT).
      if (path.relative(root, f) === 'src/core/progress/courseProgress.js') continue
      assert.doesNotMatch(code, /wrongBook[^\n]*\.(sort|slice\(-)/, path.relative(root, f))
      assert.doesNotMatch(code, /WRONG_BOOK_LIMIT/, `${path.relative(root, f)}: το όριο εφαρμόζεται μόνο στο canonicalWrongBook`)
    }
  })
})

describe('J5/J6 · καθολικός κανόνας t ≥ R και χρόνοι', () => {
  test('events, wrongBook ΚΑΙ checklists με t < R δεν εμφανίζονται· με t = R εμφανίζονται', () => {
    const R = T0 + 10
    const r = run([answer('demo-a', 'a-q1', { t: R - 1 }), answer('demo-a', 'a-q2', { t: R }), flip('demo-a', 'a-c1', { t: R - 1 })], {
      [RS]: { at: iso(R) },
      [WB]: { version: 1, entries: [wrongEntry('demo-a', 'a-q1', { uid: 'old', t: R - 1 }), wrongEntry('demo-a', 'a-q2', { uid: 'new', t: R })] },
      [CL]: { version: CHECKLISTS_VERSION, topics: { 'a-t1': { items: [true], t: R - 1 }, 'a-t2': { items: [false, true], t: R } } },
    })
    assert.equal(r.status, 'ready')
    assert.equal(r.snapshot.quizAnswered, 1)
    assert.deepEqual(r.snapshot.flashcardSeenIds, [])
    assert.deepEqual(r.snapshot.wrongBook.map((w) => w.uid), ['new'])
    assert.deepEqual(r.snapshot.checklists, { 'a-t2': { items: [false, true] } })
  })
  test('H_c = μέγιστο t σε ΟΛΑ τα events (και κρυμμένα, orphan, self) + wrongBook + checklists — όχι το reset', () => {
    const ns = courseNamespaces('demo-a', { [CL]: { version: CHECKLISTS_VERSION, topics: { 'a-t1': { items: [true], t: T0 + 2000 } } } })
    assert.equal(ns.high, T0 + 2000)
    const r = run([self('demo-a', 'gone', { t: T0 + 3000 })], { [RS]: { at: iso(T0 + 4000) } })
    assert.equal(r.high, T0 + 3000, 'το κρυμμένο orphan self μετρά· το reset όχι')
    assert.equal(run([answer('demo-a', 'a-q1', { t: T0 + 5000 })], { [RS]: { at: iso(T0 + 6000) } }).high, T0 + 5000)
    assert.equal(run([self('demo-a', 'gone', { t: T0 + 7000 })]).high, T0 + 7000)
  })
  test('resetTime = max(now, H+1, previous+1) · nextTime = max(now, reset, H+1)', () => {
    assert.equal(resetTime({ now: T0 + 1600, high: T0 + 2000, previousReset: -Infinity }), T0 + 2001, 'checklist από άλλη συσκευή με t = 2000')
    assert.equal(resetTime({ now: T0, high: -Infinity, previousReset: T0 }), T0 + 1, 'δύο reset στο ίδιο ms')
    assert.equal(resetTime({ now: T0 + 9, high: -Infinity, previousReset: -Infinity }), T0 + 9)
    assert.equal(nextTime({ now: T0, resetAt: T0 + 50, high: T0 + 50 }), T0 + 51, 'ρολόι πίσω μετά το reset')
    assert.equal(nextTime({ now: T0 + 100, resetAt: -Infinity, high: -Infinity }), T0 + 100)
  })
  test('ένα reset κρύβει τα πάντα του μαθήματος, ακόμα κι αν το checklist είχε t από ρολόι μπροστά', () => {
    const state = { [CL]: { version: CHECKLISTS_VERSION, topics: { 'a-t1': { items: [true], t: T0 + 2000 } } } }
    const events = [answer('demo-a', 'a-q1', { t: T0 + 1500 })]
    const before = run(events, state)
    const at = resetTime({ now: T0 + 1600, high: before.high, previousReset: -Infinity })
    const after = run(events, { ...state, [RS]: { at: iso(at) } })
    assert.deepEqual([after.snapshot.quizAnswered, after.snapshot.checklists], [0, {}])
  })
})

describe('απομόνωση στον υπολογισμό', () => {
  test('events / namespaces του demo-b δεν επηρεάζουν το demo-a', () => {
    const B = createStudyContentAdapter('demo-b', { categories: [], quizQuestions: [{ id: 'b-q1', categoryId: 'g' }], flashcards: [], topics: [] })
    const events = [answer('demo-b', 'b-q1'), answer('demo-a', 'a-q1')]
    const parsed = parseStoreData({ events, state: {} })
    const a = courseProgress({ courseId: 'demo-a', content: A, events: parsed.byCourse.get('demo-a'), state: { 'progress:wrongbook:demo-b': { broken: 1 } } })
    assert.equal(a.status, 'ready')
    assert.equal(a.snapshot.quizAnswered, 1)
    const b = courseProgress({ courseId: 'demo-b', content: B, events: parsed.byCourse.get('demo-b'), state: { 'progress:wrongbook:demo-b': { broken: 1 } } })
    assert.equal(b.status, 'unavailable')
    assert.ok(uuid())
  })
})
