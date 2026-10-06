/**
 * Phase 1E-4a — pure progress snapshot: legacy ↔ snapshot, baseline + events + state, course-agnostic.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { flashcards, quizQuestions } from '../content/courses/psd115/questions.js'
import { course as psd115Course } from '../content/courses/psd115/course.js'
import { topics as psd115Topics } from '../content/courses/psd115/topics.js'
import { CATEGORIES } from '../content/courses/psd115/questions.js'
import { newEventId } from '../src/core/progress/events.js'
import { buildLegacyBaseline } from '../src/core/progress/legacyBaseline.js'
import { checkContentAdapter, unknownCourseAdapter } from '../src/core/progress/contentAdapter.js'
import { checklistsStateKey, resetStateKey, wrongBookStateKey } from '../src/core/progress/namespaces.js'
import { createPsd115ProgressAdapter, psd115ProgressAdapter as content } from '../src/core/progress/adapters/psd115.js'
import {
  buildProgressSnapshot,
  emptySnapshot,
  legacyToSnapshot,
  snapshotToLegacy,
  stateFromSnapshot,
  validateSnapshot,
} from '../src/core/progress/snapshot.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const fixture = (name) => JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures', name), 'utf8'))
const FIXTURES = ['progress-export.production-2026-10-05.json', 'progress-export.production-2026-09-28.json', 'progress-export.sample.json']
const PROD = fixture(FIXTURES[0])
const SETTINGS = new Set(['psd115-w1-theme', 'psd115-disclaimer-v1'])

const CAPTURED = Date.parse('2026-10-06T10:00:00.000Z')
const baselineOf = (keys) => {
  const b = buildLegacyBaseline(keys, { now: () => CAPTURED })
  assert.ok(b.ok, JSON.stringify(b.errors))
  return b.baseline
}
const ev = (item, kind, ctx, t, extra = {}) => ({ id: newEventId(), t, item, kind, ctx, ...extra })
const answer = (qid, ok, t = CAPTURED + 1000) => ev(`psd115/${qid}`, 'answer', 'quiz', t, { ok: ok ? 1 : 0 })
const flip = (cardId, t = CAPTURED + 1000) => ev(`psd115/${cardId}`, 'flip', 'flash', t)
const snap = (input) => {
  const r = buildProgressSnapshot({ courseId: 'psd115', content, ...input })
  assert.ok(r.ok, JSON.stringify(r.errors))
  return r.snapshot
}
const fromLegacy = (keys) => {
  const r = legacyToSnapshot(keys, { content })
  assert.ok(r.ok, JSON.stringify(r.errors))
  return r.snapshot
}

function deepFreeze(o) {
  if (o && typeof o === 'object') {
    Object.freeze(o)
    for (const v of Object.values(o)) deepFreeze(v)
  }
  return o
}

/** Σημασιολογική μορφή των legacy κλειδιών προόδου: parsed τιμές, προεπιλογές όπως το loadProgress, χωρίς ρυθμίσεις. */
function legacySemantics(entries) {
  const out = {}
  for (const [key, raw] of Object.entries(entries)) {
    if (SETTINGS.has(key)) continue
    const value = JSON.parse(raw)
    out[key] =
      key === 'psd115-w1-study'
        ? { quizAnswered: 0, quizCorrect: 0, byCategory: {}, flashcardSeenIds: [], wrongBook: [], ...value }
        : value
  }
  out['psd115-w1-study'] ??= { quizAnswered: 0, quizCorrect: 0, byCategory: {}, flashcardSeenIds: [], wrongBook: [] }
  return out
}

// ---------------------------------------------------------------------------------------------------------------

describe('1E-4a · ο engine δεν ξέρει μάθημα, storage, React ή URLs', () => {
  const ENGINE = ['snapshot.js', 'contentAdapter.js', 'namespaces.js'].map((f) => path.join(root, 'src/core/progress', f))

  test('κανένα PSD115 / εβδομάδα / route / browser API στα αρχεία του engine', () => {
    for (const f of ENGINE) {
      const code = fs.readFileSync(f, 'utf8')
      assert.doesNotMatch(code, /psd1\d\d|week|\/week\/|WEEK\d|pathname|legacySlug/i, f)
      assert.doesNotMatch(code, /\b(localStorage|sessionStorage|window|document|globalThis|navigator)\s*(\.[A-Za-z_$]|\[)/, f)
      assert.doesNotMatch(code, /from '(react|react-dom|react-router-dom)'/, f)
    }
  })

  test('μεταβατικά imports: μόνο pure modules — κανένα περιεχόμενο, keys.js, storage ή utils', () => {
    const visited = new Set()
    const walk = (file) => {
      if (visited.has(file)) return
      visited.add(file)
      for (const [, spec] of fs.readFileSync(file, 'utf8').matchAll(/from '([^']+)'/g)) {
        assert.ok(spec.startsWith('.'), `${file}: εξωτερικό import ${spec}`)
        walk(path.resolve(path.dirname(file), spec))
      }
    }
    for (const f of ENGINE) walk(f)
    const rel = [...visited].map((f) => path.relative(root, f)).sort()
    assert.deepEqual(rel, [
      'src/core/academic/ids.js',
      'src/core/progress/contentAdapter.js',
      'src/core/progress/events.js',
      'src/core/progress/namespaces.js',
      'src/core/progress/snapshot.js',
    ])
  })

  test('namespaces: λογικά κλειδιά μέσα στο state, ανά μάθημα', () => {
    assert.equal(wrongBookStateKey('psd125'), 'progress:wrongbook:psd125')
    assert.equal(checklistsStateKey('psd115'), 'progress:checklists:psd115')
    assert.equal(resetStateKey('psd200'), 'progress:reset:psd200')
    assert.throws(() => wrongBookStateKey('PSD115'))
  })

  test('το PSD115 adapter και το unknown adapter τηρούν το ίδιο contract', () => {
    assert.deepEqual(checkContentAdapter(content, 'psd115'), [])
    assert.deepEqual(checkContentAdapter(unknownCourseAdapter('psd125'), 'psd125'), [])
    assert.match(checkContentAdapter(content, 'psd125').join(), /όχι για «psd125»/)
  })
})

describe('1E-4a · legacy → snapshot → legacy (round-trip) στα 3 fixtures', () => {
  for (const name of FIXTURES) {
    test(name, () => {
      const keys = deepFreeze(fixture(name).keys)
      const r = legacyToSnapshot(keys, { content })
      assert.ok(r.ok, JSON.stringify(r.errors))
      assert.deepEqual(validateSnapshot(r.snapshot, { content }), [])
      assert.deepEqual(r.settings, Object.keys(keys).filter((k) => SETTINGS.has(k)).sort())

      const back = snapshotToLegacy(r.snapshot, { content })
      assert.ok(back.ok, JSON.stringify(back.errors))
      assert.deepEqual(back.unprojected, [])
      // legacy → snapshot → legacy: ίδιες αποθηκευμένες τιμές (όχι απαραίτητα ίδια σειρά κλειδιών JSON)
      assert.deepEqual(legacySemantics(back.entries), legacySemantics(keys))
      // legacy → snapshot → legacy → snapshot: ίδιο snapshot
      assert.deepEqual(fromLegacy(back.entries), r.snapshot)
    })
  }
})

describe('1E-4a · production fixture 2026-10-05 (κλειδωμένο)', () => {
  const s = fromLegacy(PROD.keys)
  const legacyStudy = JSON.parse(PROD.keys['psd115-w1-study'])

  test('κουίζ: 1 απάντηση, 0 σωστές, ολόκληρο το byGroup', () => {
    assert.equal(s.quizAnswered, 1)
    assert.equal(s.quizCorrect, 0)
    assert.deepEqual(s.byGroup, { 'w2-variables': { correct: 0, wrong: 1 } })
  })

  test('κάρτες: 21, global IDs, ίδια σειρά με το legacy', () => {
    assert.equal(s.flashcardSeenIds.length, 21)
    assert.deepEqual(s.flashcardSeenIds, legacyStudy.flashcardSeenIds.map((id) => `psd115/${id}`))
  })

  test('wrongBook: 1 εγγραφή, όλα τα πεδία, t = null (όχι επινοημένο)', () => {
    const [w] = legacyStudy.wrongBook
    assert.deepEqual(s.wrongBook, [
      { uid: w.uid, item: 'psd115/q-w2-var-4', group: 'w2-variables', question: w.question, explanation: w.explanation, userLabel: w.userLabel, correctLabel: w.correctLabel, t: null },
    ])
  })

  test('checklists: 10 canonical topics (μαζί με τα 3 semantic overview)', () => {
    assert.deepEqual(Object.keys(s.checklists).sort(), [
      'definition',
      'empiricism',
      'functionalism',
      'humanistic',
      'neurobiology-overview',
      'pavlov',
      'psychoanalysis',
      'research-methods-overview',
      'sensation-perception-overview',
      'wundt',
    ])
    assert.deepEqual(s.checklists['research-methods-overview'].items, JSON.parse(PROD.keys['psd115-w2-checklists']).overview)
    assert.deepEqual(s.checklists['neurobiology-overview'].items, JSON.parse(PROD.keys['psd115-w3-checklists']).overview)
    assert.deepEqual(s.checklists['sensation-perception-overview'].items, JSON.parse(PROD.keys['psd115-w4-checklists']).overview)
    assert.deepEqual(s.checklists.pavlov.items, JSON.parse(PROD.keys['psd115-w1-pavlov-checklist']))
  })

  test('theme/disclaimer: δεν είναι πρόοδος — εκτός snapshot', () => {
    assert.ok(!JSON.stringify(s).includes('theme'))
    assert.ok(!JSON.stringify(s).includes('disclaimer'))
  })
})

describe('1E-4a · G2: baseline + 0 events ≡ legacy', () => {
  for (const name of FIXTURES) {
    test(name, () => {
      const keys = fixture(name).keys
      const expected = fromLegacy(keys)
      const baseline = deepFreeze(baselineOf(keys))
      assert.deepEqual(snap({ baseline }), expected) // πριν την υλοποίηση του state: wrongBook/checklists από baseline
      assert.deepEqual(snap({ baseline, state: stateFromSnapshot(expected) }), expected) // μετά την υλοποίηση
    })
  }
})

describe('1E-4a · baseline + events', () => {
  const baseline = deepFreeze(baselineOf(PROD.keys))
  const base = snap({ baseline })
  const seenLocal = JSON.parse(PROD.keys['psd115-w1-study']).flashcardSeenIds
  const q = quizQuestions.find((x) => x.categoryId === 'pavlov')
  const newCard = flashcards.find((c) => !seenLocal.includes(c.id))

  test('μία σωστή απάντηση → +1 answered, +1 correct, +1 στην ομάδα της', () => {
    const s = snap({ baseline, events: [answer(q.id, true)] })
    assert.equal(s.quizAnswered, 2)
    assert.equal(s.quizCorrect, 1)
    assert.deepEqual(s.byGroup, { ...base.byGroup, pavlov: { correct: 1, wrong: 0 } })
    assert.deepEqual(s.wrongBook, base.wrongBook) // το wrongBook ΔΕΝ προκύπτει από events
  })

  test('μία λάθος απάντηση στην ίδια ομάδα με το baseline → αθροίζεται', () => {
    const s = snap({ baseline, events: [answer('q-w2-var-4', false)] })
    assert.deepEqual(s.byGroup['w2-variables'], { correct: 0, wrong: 2 })
    assert.equal(s.quizAnswered - s.quizCorrect, 2)
    assert.equal(s.wrongBook.length, 1)
  })

  test('flip σε κάρτα που ήδη είδε → seen αμετάβλητο', () => {
    assert.deepEqual(snap({ baseline, events: [flip(seenLocal[0])] }).flashcardSeenIds, base.flashcardSeenIds)
  })

  test('flip σε νέα κάρτα → +1, στο τέλος· ίδια κάρτα ξανά → τίποτα', () => {
    const s = snap({ baseline, events: [flip(newCard.id), flip(newCard.id, CAPTURED + 2000)] })
    assert.deepEqual(s.flashcardSeenIds, [...base.flashcardSeenIds, `psd115/${newCard.id}`])
  })

  test('διπλό event (ίδιο id, ίδιο περιεχόμενο) → μετριέται μία φορά· ίδιο id με άλλο περιεχόμενο → σφάλμα', () => {
    const e = answer(q.id, true)
    assert.equal(snap({ baseline, events: [e, { ...e }] }).quizAnswered, 2)
    const r = buildProgressSnapshot({ courseId: 'psd115', content, baseline, events: [e, { ...e, ok: 0 }] })
    assert.equal(r.ok, false)
  })

  test('μόνο answer/quiz και flip/flash μετράνε (όχι lesson, exam, self)', () => {
    const s = snap({
      baseline,
      events: [
        ev(`psd115/${q.id}`, 'answer', 'lesson', CAPTURED + 1, { ok: 1 }),
        ev(`psd115/${q.id}`, 'answer', 'exam', CAPTURED + 1, { ok: 1 }),
        ev(`psd115/${q.id}`, 'self', 'review', CAPTURED + 1, { grade: 3 }),
        ev(`psd115/${newCard.id}`, 'flip', 'lesson', CAPTURED + 1),
      ],
    })
    assert.deepEqual(s, base)
  })

  test('events άλλου μαθήματος αγνοούνται', () => {
    const s = snap({ baseline, events: [ev('psd125/q-intro-1', 'answer', 'quiz', CAPTURED + 1, { ok: 1 }), ev('psd125/fc-intro-1', 'flip', 'flash', CAPTURED + 1)] })
    assert.deepEqual(s, base)
  })

  test('event πριν από το baseline → σφάλμα (δεν διπλομετριέται)', () => {
    const r = buildProgressSnapshot({ courseId: 'psd115', content, baseline, events: [answer(q.id, true, CAPTURED - 1)] })
    assert.equal(r.ok, false)
    assert.match(r.errors.join(), /πριν από το baseline/)
  })

  test('ερώτηση που δεν υπάρχει πια στο περιεχόμενο: μετριέται, χωρίς επινοημένη ομάδα', () => {
    const s = snap({ baseline, events: [answer('q-removed-999', true)] })
    assert.equal(s.quizAnswered, 2)
    assert.deepEqual(s.byGroup, base.byGroup)
  })

  test('το baseline δεν τροποποιείται (deep-frozen) και τα inputs μένουν ίδια', () => {
    const events = deepFreeze([answer(q.id, false), flip(newCard.id)])
    const state = deepFreeze(stateFromSnapshot(base))
    assert.doesNotThrow(() => snap({ baseline, events, state }))
  })
})

describe('1E-4a · reset', () => {
  const baseline = baselineOf(PROD.keys)
  const resetAt = CAPTURED + 10_000
  const reset = { [resetStateKey('psd115')]: { at: new Date(resetAt).toISOString(), reason: 'test' } }
  const q = quizQuestions[0]

  test('reset χωρίς νέα δεδομένα → άδειο snapshot (το baseline δεν ξαναμετριέται)', () => {
    assert.deepEqual(snap({ baseline, state: reset }), emptySnapshot('psd115'))
  })

  test('events πριν από το reset αγνοούνται, μετά μετράνε', () => {
    const s = snap({ baseline, state: reset, events: [answer(q.id, true, resetAt - 1), answer(q.id, false, resetAt), flip(flashcards[0].id, resetAt + 5)] })
    assert.equal(s.quizAnswered, 1)
    assert.equal(s.quizCorrect, 0)
    assert.deepEqual(s.byGroup, { [q.categoryId]: { correct: 0, wrong: 1 } })
    assert.deepEqual(s.flashcardSeenIds, [`psd115/${flashcards[0].id}`])
  })

  test('μετά το reset, wrongBook/checklists μόνο από το state (το baseline αγνοείται)', () => {
    const entry = { uid: 'u-1', item: `psd115/${q.id}`, group: q.categoryId, question: 'Q', explanation: 'E', userLabel: 'A', correctLabel: 'B', t: resetAt + 1 }
    const state = {
      ...reset,
      [wrongBookStateKey('psd115')]: { version: 1, entries: [entry] },
      [checklistsStateKey('psd115')]: { version: 1, topics: { pavlov: { items: [true] } } },
    }
    const s = snap({ baseline, state })
    assert.deepEqual(s.wrongBook, [entry])
    assert.deepEqual(s.checklists, { pavlov: { items: [true] } })
  })

  test('reset άλλου μαθήματος δεν επηρεάζει το psd115', () => {
    assert.deepEqual(snap({ baseline, state: { [resetStateKey('psd125')]: { at: new Date(resetAt).toISOString() } } }), snap({ baseline }))
  })
})

describe('1E-4a · state ownership (wrongBook / checklists)', () => {
  const baseline = baselineOf(PROD.keys)
  const base = snap({ baseline })

  test('κλειδί state με κενή τιμή = ο χρήστης τα καθάρισε (δεν «επιστρέφει» το baseline)', () => {
    const state = { [wrongBookStateKey('psd115')]: { version: 1, entries: [] }, [checklistsStateKey('psd115')]: { version: 1, topics: {} } }
    const s = snap({ baseline, state })
    assert.deepEqual(s.wrongBook, [])
    assert.deepEqual(s.checklists, {})
    assert.equal(s.quizAnswered, base.quizAnswered) // οι μετρητές μένουν
  })

  test('orphan checklist (θέμα που δεν υπάρχει) → διατηρείται με warning, δεν προβάλλεται στο legacy', () => {
    const state = { [checklistsStateKey('psd115')]: { version: 1, topics: { ...stateFromSnapshot(base)[checklistsStateKey('psd115')].topics, 'gone-topic': { items: [true] } } } }
    const r = buildProgressSnapshot({ courseId: 'psd115', content, baseline, state })
    assert.ok(r.ok)
    assert.match(r.warnings.join(), /gone-topic.*orphan/)
    assert.deepEqual(r.snapshot.checklists['gone-topic'], { items: [true] })
    const back = snapshotToLegacy(r.snapshot, { content })
    assert.deepEqual(back.unprojected, ['gone-topic'])
    assert.deepEqual(legacySemantics(back.entries), legacySemantics(PROD.keys))
  })

  test('μελλοντική εγγραφή wrongBook με t: χάνεται μόνο το t στο legacy projection', () => {
    const entry = { ...base.wrongBook[0], uid: 'u-new', t: CAPTURED + 5 }
    const s = snap({ baseline, state: { [wrongBookStateKey('psd115')]: { version: 1, entries: [...base.wrongBook, entry] } } })
    const back = snapshotToLegacy(s, { content })
    const wb = JSON.parse(back.entries['psd115-w1-study']).wrongBook
    assert.equal(wb.length, 2)
    assert.deepEqual(Object.keys(wb[1]), ['uid', 'id', 'categoryId', 'question', 'explanation', 'userLabel', 'correctLabel'])
  })
})

describe('1E-4a · checklists: canonical topicId', () => {
  test('τα τρία "overview" (ίδιο slug σε Εβδ. 2–4) → τρία διαφορετικά semantic topics', () => {
    const s = fromLegacy({
      'psd115-w2-checklists': '{"overview":[true]}',
      'psd115-w3-checklists': '{"overview":[false,true]}',
      'psd115-w4-checklists': '{"overview":[true,true,false]}',
    })
    assert.deepEqual(s.checklists, {
      'research-methods-overview': { items: [true] },
      'neurobiology-overview': { items: [false, true] },
      'sensation-perception-overview': { items: [true, true, false] },
    })
  })

  test('θέμα που μετακινήθηκε σε άλλη unit: ίδιο topicId, νέο legacy κλειδί μόνο στο projection', () => {
    const moved = psd115Topics.map((t) => (t.id === 'empiricism' ? { ...t, unit: 'k3' } : t))
    const after = createPsd115ProgressAdapter({ course: psd115Course, topics: moved, categories: CATEGORIES, quizQuestions, flashcards })
    const s = fromLegacy({ 'psd115-w2-checklists': '{"empiricism":[true,false]}' }) // γράφτηκε όταν ήταν στην Εβδ. 2
    assert.deepEqual(s.checklists, { empiricism: { items: [true, false] } })
    const back = snapshotToLegacy(s, { content: after })
    assert.equal(back.entries['psd115-w2-checklists'], undefined)
    assert.deepEqual(JSON.parse(back.entries['psd115-w3-checklists']), { empiricism: [true, false] })
    assert.deepEqual(legacyToSnapshot(back.entries, { content: after }).snapshot.checklists, s.checklists)
  })

  test('άγνωστο θέμα / slug → απόρριψη', () => {
    for (const keys of [{ 'psd115-w1-nosuch-checklist': '[true]' }, { 'psd115-w2-checklists': '{"nosuch":[true]}' }, { 'psd115-w9-checklists': '{}' }]) {
      const r = legacyToSnapshot(keys, { content })
      assert.equal(r.ok, false, JSON.stringify(keys))
    }
  })
})

describe('1E-4a · course-agnostic', () => {
  test('νέο μάθημα χωρίς legacy: baseline null, events [], state {} → έγκυρο άδειο snapshot', () => {
    const r = buildProgressSnapshot({ courseId: 'psd125', content: unknownCourseAdapter('psd125'), baseline: null, events: [], state: {} })
    assert.ok(r.ok)
    assert.deepEqual(r.snapshot, emptySnapshot('psd125'))
    assert.deepEqual(validateSnapshot(r.snapshot), [])
  })

  // Δοκιμαστικό adapter (όχι περιεχόμενο του repo): άλλο μάθημα, ομάδα = topic, χωρίς legacy.
  const psd125 = Object.freeze({
    courseId: 'psd125',
    hasGroup: (id) => id === 'classic-experiments',
    groupOf: (q) => (q === 'q-milgram-1' ? 'classic-experiments' : null),
    isQuestion: (q) => q === 'q-milgram-1',
    isCard: (c) => c === 'fc-milgram-1',
    hasTopic: (t) => t === 'classic-experiments',
  })

  test('ίδιος buildProgressSnapshot διαβάζει events + state άλλου μαθήματος, μέσα σε κοινό log/state με το psd115', () => {
    const t = Date.parse('2026-10-20T10:00:00Z')
    const events = [
      answer(quizQuestions[0].id, true, t), // psd115: αγνοείται
      ev('psd125/q-milgram-1', 'answer', 'quiz', t + 1, { ok: 0 }),
      ev('psd125/q-unknown', 'answer', 'quiz', t + 2, { ok: 1 }),
      ev('psd125/fc-milgram-1', 'flip', 'flash', t + 3),
      ev('psd125/fc-milgram-1', 'flip', 'flash', t + 4),
    ]
    const entry = { uid: 'w-1', item: 'psd125/q-milgram-1', group: 'classic-experiments', question: 'Q', explanation: 'E', userLabel: 'A', correctLabel: 'B', t: t + 1 }
    const state = {
      [wrongBookStateKey('psd125')]: { version: 1, entries: [entry] },
      [checklistsStateKey('psd125')]: { version: 1, topics: { 'classic-experiments': { items: [true, false] } } },
      ...stateFromSnapshot(fromLegacy(PROD.keys)), // state του psd115 στο ίδιο αντικείμενο
    }
    const r = buildProgressSnapshot({ courseId: 'psd125', content: psd125, events, state })
    assert.ok(r.ok, JSON.stringify(r.errors))
    assert.deepEqual(r.snapshot, {
      ...emptySnapshot('psd125'),
      quizAnswered: 2,
      quizCorrect: 1,
      byGroup: { 'classic-experiments': { correct: 0, wrong: 1 } },
      flashcardSeenIds: ['psd125/fc-milgram-1'],
      wrongBook: [entry],
      checklists: { 'classic-experiments': { items: [true, false] } },
    })
    assert.ok(!JSON.stringify(r.snapshot).includes('psd115'))
    // Το psd115 από το ίδιο log/state δεν βλέπει τίποτα του psd125.
    assert.ok(!JSON.stringify(snap({ baseline: baselineOf(PROD.keys), events, state })).includes('psd125'))
  })

  test('μάθημα χωρίς legacy δεν έχει projection (ρητό σφάλμα, όχι επινοημένα κλειδιά)', () => {
    assert.equal(snapshotToLegacy(emptySnapshot('psd125'), { content: psd125 }).ok, false)
    assert.equal(legacyToSnapshot({}, { content: psd125 }).ok, false)
  })

  test('baseline ή adapter άλλου μαθήματος → σφάλμα', () => {
    const baseline = baselineOf(PROD.keys)
    assert.equal(buildProgressSnapshot({ courseId: 'psd125', content: psd125, baseline }).ok, false)
    assert.equal(buildProgressSnapshot({ courseId: 'psd125', content }).ok, false)
  })
})

describe('1E-4a · κατεστραμμένα δεδομένα → απόρριψη χωρίς αλλαγή inputs', () => {
  const good = PROD.keys
  const study = JSON.parse(good['psd115-w1-study'])
  const withStudy = (patch) => deepFreeze({ ...good, 'psd115-w1-study': JSON.stringify({ ...study, ...patch }) })
  const cases = {
    'μη έγκυρο JSON': deepFreeze({ ...good, 'psd115-w1-study': '{oops' }),
    'άγνωστο κλειδί': deepFreeze({ ...good, 'psd115-w1-mystery': '1' }),
    'backup ως πηγή': deepFreeze({ ...good, 'psd115-backup-2026': '{}' }),
    'μη-string τιμή': deepFreeze({ ...good, 'psd115-w1-pavlov-checklist': [true] }),
    'άγνωστη κάρτα': withStudy({ flashcardSeenIds: ['fc-nope'] }),
    'διπλή κάρτα': withStudy({ flashcardSeenIds: [study.flashcardSeenIds[0], study.flashcardSeenIds[0]] }),
    'άγνωστη ομάδα': withStudy({ byCategory: { nope: { correct: 1, wrong: 0 } } }),
    'correct > answered': withStudy({ quizCorrect: 5 }),
    'αρνητικός μετρητής': withStudy({ quizAnswered: -1 }),
    'άγνωστο πεδίο': withStudy({ extra: 1 }),
    'wrongBook χωρίς userLabel': withStudy({ wrongBook: [{ ...study.wrongBook[0], userLabel: undefined }] }),
    'wrongBook άγνωστη ερώτηση': withStudy({ wrongBook: [{ ...study.wrongBook[0], id: 'q-nope' }] }),
    'wrongBook διπλό uid': withStudy({ wrongBook: [study.wrongBook[0], study.wrongBook[0]] }),
    'checklist όχι boolean': deepFreeze({ ...good, 'psd115-w1-pavlov-checklist': '[1,0]' }),
  }
  for (const [label, keys] of Object.entries(cases)) {
    test(label, () => {
      const before = JSON.stringify(keys)
      const r = legacyToSnapshot(keys, { content })
      assert.equal(r.ok, false)
      assert.ok(r.errors.length > 0)
      assert.equal(JSON.stringify(keys), before)
    })
  }

  const baseline = baselineOf(good)
  const stateCases = {
    'wrongbook χωρίς version': { [wrongBookStateKey('psd115')]: { entries: [] } },
    'wrongbook εγγραφή άλλου μαθήματος': { [wrongBookStateKey('psd115')]: { version: 1, entries: [{ uid: 'a', item: 'psd125/q', group: null, question: '', explanation: '', userLabel: '', correctLabel: '', t: null }] } },
    'wrongbook επινοημένο t (δευτερόλεπτα)': { [wrongBookStateKey('psd115')]: { version: 1, entries: [{ uid: 'a', item: 'psd115/q-w2-var-4', group: 'w2-variables', question: '', explanation: '', userLabel: '', correctLabel: '', t: 1700000000 }] } },
    'wrongbook χωρίς πεδίο t': { [wrongBookStateKey('psd115')]: { version: 1, entries: [{ uid: 'a', item: 'psd115/q-w2-var-4', group: 'w2-variables', question: '', explanation: '', userLabel: '', correctLabel: '' }] } },
    'checklists items όχι boolean': { [checklistsStateKey('psd115')]: { version: 1, topics: { pavlov: { items: ['x'] } } } },
    'checklists χωρίς version': { [checklistsStateKey('psd115')]: { topics: {} } },
    'reset χωρίς ημερομηνία': { [resetStateKey('psd115')]: { at: 'χθες' } },
  }
  for (const [label, state] of Object.entries(stateCases)) {
    test(`state: ${label}`, () => {
      deepFreeze(state)
      const r = buildProgressSnapshot({ courseId: 'psd115', content, baseline, state })
      assert.equal(r.ok, false)
    })
  }

  test('άκυρο event → απόρριψη', () => {
    const r = buildProgressSnapshot({ courseId: 'psd115', content, baseline, events: [{ id: 'x', t: 1, item: 'psd115/q', kind: 'answer', ctx: 'quiz' }] })
    assert.equal(r.ok, false)
  })

  test('validateSnapshot πιάνει άκυρο snapshot', () => {
    const s = fromLegacy(good)
    assert.notDeepEqual(validateSnapshot({ ...s, flashcardSeenIds: ['fc-local-only'] }), [])
    assert.notDeepEqual(validateSnapshot({ ...s, quizCorrect: 99 }), [])
    assert.notDeepEqual(validateSnapshot({ ...s, extra: 1 }), [])
  })
})
