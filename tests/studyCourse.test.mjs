/**
 * Φάση 5 — μελέτη και εμφάνιση προόδου ανά μάθημα (επίπεδο Α, I1–I5). Το storage ΔΕΝ αλλάζει.
 *
 *  I1  το μάθημα της συνεδρίας από τη διαδρομή· τρεις ρητές καταστάσεις:
 *        ready        περιεχόμενο + πρόοδος από το service
 *        no-content   χωρίς περιεχόμενο μελέτης (π.χ. psd200)
 *        no-progress  με περιεχόμενο αλλά χωρίς υποστήριξη προόδου από το service
 *      εκτός ready: κενή πρόοδος μόνο για ανάγνωση· καμία εγγραφή, κανένας recorder, καμία αλλαγή στα δεδομένα PSD115
 *  I2  κατηγορίες / ετικέτες / ερωτήσεις από το STUDY_CONTENT του μαθήματος· κανένα κρυφό fallback στο PSD115
 *  I4  guard: απευθείας imports από content/courses/psd115/ μόνο σε ρητή allowlist
 *  I5  ισοδυναμία για το PSD115 (k1, k2, όλο το μάθημα, ετικέτες wrongBook)
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProgressService } from '../src/core/progress/progressService.js'
import { psd115ProgressAdapter as content } from '../src/core/progress/adapters/psd115.js'
import { createLegacyProgressBackend } from '../src/utils/legacyProgressBackend.js'
import { TXN_KEY } from '../src/utils/progressTransaction.js'
import { applyChecklistUpdate } from '../src/hooks/useProgress.js'
import { STUDY_CONTENT } from '../src/core/study/content.js'
import { scopedProgress } from '../src/components/progressDisplay.js'
import * as psd115Questions from '../content/courses/psd115/questions.js'
import * as session from '../src/core/study/session.js'
import * as display from '../src/components/progressDisplay.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROD = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/progress-export.production-2026-10-05.json'), 'utf8')).keys
const STUDY = 'psd115-w1-study'


function storage(init = PROD) {
  const m = new Map(Object.entries(init))
  const writes = []
  return {
    get length() {
      return m.size
    },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem(k, v) {
      writes.push(k)
      m.set(k, String(v))
    },
    removeItem(k) {
      writes.push(`-${k}`)
      m.delete(k)
    },
    dump: () => Object.fromEntries(m),
    writes,
  }
}
const serviceOn = (s) => createProgressService({ courseId: 'psd115', content, backend: createLegacyProgressBackend(s), warn: () => {} })

/** Recorders (shadow) με καταγραφή κλήσεων· ίδια ονόματα με το useStudySession. */
function recorders(log) {
  return {
    flashcardSeen: (a) => log.push(['flashcardSeen', a]),
    quizAnswer: (a) => log.push(['quizAnswer', a]),
    wrongBookClear: () => log.push(['wrongBookClear']),
    wrongBookRemove: (a) => log.push(['wrongBookRemove', a]),
  }
}
/** Spy στο service: σειρά κλήσεων (refresh → recorder → ενέργεια). */
function spied(service, log) {
  const wrap = (name) => (...a) => {
    log.push([name])
    return service[name](...a)
  }
  return { ...service, refresh: wrap('refresh'), markCardSeen: wrap('markCardSeen'), answerQuestion: wrap('answerQuestion'), clearWrongBook: wrap('clearWrongBook'), removeWrong: wrap('removeWrong') }
}

// Μάθημα με περιεχόμενο αλλά χωρίς πρόοδο στο service. Επίτηδες με ids ΚΑΡΤΑΣ/ΕΡΩΤΗΣΗΣ που υπάρχουν και στο PSD115:
// χωρίς τον έλεγχο, μια ενέργεια εδώ θα γραφόταν στην πρόοδο του PSD115.
const DEMO = Object.freeze({
  demo: Object.freeze({
    flashcards: [{ id: 'fc-freud-1', categoryId: 'demo-cat', front: 'F', back: 'B' }],
    quizQuestions: [{ id: 'q-def-1', categoryId: 'demo-cat', question: 'Q', options: ['A', 'B'], correctIndex: 0, explanation: 'E' }],
    categories: [{ id: 'demo-cat', label: 'Δοκιμαστική κατηγορία' }],
    getCategoryLabel: (id) => (id === 'demo-cat' ? 'Δοκιμαστική κατηγορία' : id),
    units: { u1: { categories: [{ id: 'demo-cat', label: 'Δοκιμαστική κατηγορία' }], examQuestions: () => [] } },
  }),
})

const wrong = { uid: 'u-phase5', question: 'Q', explanation: 'E', userLabel: 'A', correctLabel: 'B' }
/** Όλες οι ενέργειες της συνεδρίας μία φορά, με ids που υπάρχουν στο PSD115. */
function runAll(actions) {
  const PROD_UID = JSON.parse(PROD[STUDY]).wrongBook[0].uid
  return [
    actions.markCardSeen('fc-freud-1'),
    actions.answer({ questionId: 'q-def-1', ok: false, wrong }),
    actions.answer({ questionId: 'q-def-1', ok: true }),
    actions.removeWrong(PROD_UID),
    actions.clearWrongBook(),
  ]
}
function assertUntouched(s, svc, before) {
  assert.deepEqual(s.writes, [], 'καμία εγγραφή/διαγραφή στο storage')
  assert.deepEqual(s.dump(), PROD, 'τα κλειδιά byte-identical')
  assert.equal(Object.keys(s.dump()).some((k) => k.startsWith('study-progress-') || k === TXN_KEY), false, 'κανένα migration / σημάδι')
  assert.equal(svc.getSnapshot(), before, 'το snapshot του service ίδιο αντικείμενο')
}

describe('Φάση 5 I1 — καταστάσεις μαθήματος', () => {
  test('psd115 με το service του psd115 → ready, περιεχόμενο από το STUDY_CONTENT', () => {
    const c = session.studyCourse('psd115', 'psd115')
    assert.equal(c.status, 'ready')
    assert.equal(c.canRecord, true)
    assert.equal(c.courseId, 'psd115')
    assert.equal(c.content.flashcards, STUDY_CONTENT.psd115.flashcards)
    assert.equal(c.content.quizQuestions, STUDY_CONTENT.psd115.quizQuestions)
    assert.equal(c.content.categories, STUDY_CONTENT.psd115.categories)
    assert.ok(Object.isFrozen(c))
  })

  test('μάθημα του registry χωρίς περιεχόμενο (psd200) → no-content, κενό περιεχόμενο, καμία εγγραφή', () => {
    const c = session.studyCourse('psd200', 'psd115')
    assert.equal(c.status, 'no-content')
    assert.equal(c.canRecord, false)
    assert.equal(c.courseId, 'psd200')
    assert.deepEqual([c.content.flashcards.length, c.content.quizQuestions.length, c.content.categories.length], [0, 0, 0])
    // Καμία ετικέτα του PSD115: η κατηγορία μένει ως έχει.
    assert.equal(c.content.getCategoryLabel('w2-variables'), 'w2-variables')
  })

  test('άγνωστο ή κενό μάθημα → no-content (ποτέ fallback στο PSD115)', () => {
    for (const id of ['nope', '', undefined, null]) {
      const c = session.studyCourse(id, 'psd115')
      assert.equal(c.status, 'no-content', String(id))
      assert.equal(c.content.flashcards.length, 0)
    }
  })

  test('μάθημα με περιεχόμενο που δεν το εξυπηρετεί το service → no-progress (διακριτό από το no-content)', () => {
    const c = session.studyCourse('demo', 'psd115', DEMO)
    assert.equal(c.status, 'no-progress')
    assert.equal(c.canRecord, false)
    assert.equal(c.content.flashcards, DEMO.demo.flashcards)
    assert.equal(c.content.getCategoryLabel('demo-cat'), 'Δοκιμαστική κατηγορία')
    // Το ίδιο περιεχόμενο με service του ίδιου μαθήματος → ready.
    assert.equal(session.studyCourse('demo', 'demo', DEMO).status, 'ready')
  })

  test('ειδοποίηση: μόνο στο no-progress, ότι η πρόοδος ΔΕΝ αποθηκεύεται', () => {
    assert.equal(session.studyCourseNotice(session.studyCourse('psd115', 'psd115')), null)
    assert.equal(session.studyCourseNotice(session.studyCourse('psd200', 'psd115')), null)
    const msg = session.studyCourseNotice(session.studyCourse('demo', 'psd115', DEMO))
    assert.match(msg, /δεν αποθηκεύεται/)
    assert.doesNotMatch(msg, /αποθηκεύτηκε/)
  })
})

describe('Φάση 5 I1 — πρόοδος της συνεδρίας', () => {
  test('ready → το snapshot του service (ίδιο αντικείμενο)', () => {
    const svc = serviceOn(storage())
    const state = svc.getSnapshot()
    assert.equal(session.sessionProgress(state, session.studyCourse('psd115', svc.courseId)), state.courses.psd115)
  })

  test('no-content / no-progress → κενή, παγωμένη πρόοδος του ίδιου μαθήματος· όχι του PSD115', () => {
    const svc = serviceOn(storage())
    const state = svc.getSnapshot()
    assert.equal(state.courses.psd115.wrongBook.length, 1, 'το fixture έχει λάθος στο PSD115')
    for (const c of [session.studyCourse('psd200', 'psd115'), session.studyCourse('demo', 'psd115', DEMO)]) {
      const p = session.sessionProgress(state, c)
      assert.notEqual(p, state.courses.psd115)
      assert.equal(p.courseId, c.courseId)
      assert.deepEqual([p.quizAnswered, p.quizCorrect, p.flashcardSeenIds.length, p.wrongBook.length], [0, 0, 0, 0])
      assert.deepEqual([p.byGroup, p.checklists], [{}, {}])
      assert.ok(Object.isFrozen(p) && Object.isFrozen(p.wrongBook) && Object.isFrozen(p.flashcardSeenIds) && Object.isFrozen(p.byGroup))
      assert.throws(() => p.wrongBook.push(1))
    }
  })
})

describe('Φάση 5 I1 — ενέργειες της συνεδρίας', () => {
  test('ready (psd115): ίδια σειρά με πριν — refresh → recorder → service — και αποθηκεύεται', () => {
    const s = storage()
    const log = []
    const svc = serviceOn(s)
    const actions = session.createStudyActions({ course: session.studyCourse('psd115', svc.courseId), service: spied(svc, log), record: recorders(log) })
    assert.equal(actions.markCardSeen('fc-freud-1'), true)
    assert.deepEqual(log.map((x) => x[0]), ['refresh', 'flashcardSeen', 'markCardSeen'])
    assert.ok(JSON.parse(s.getItem(STUDY)).flashcardSeenIds.includes('fc-freud-1'))

    log.length = 0
    assert.equal(actions.answer({ questionId: 'q-def-1', ok: false, wrong }), true)
    assert.deepEqual(log.map((x) => x[0]), ['refresh', 'quizAnswer', 'answerQuestion'])
    assert.deepEqual(log[1][1], { questionId: 'q-def-1', ok: false, wrong })
    log.length = 0
    assert.equal(actions.removeWrong('u-phase5'), true)
    assert.deepEqual(log.map((x) => x[0]), ['refresh', 'wrongBookRemove', 'removeWrong'])
    log.length = 0
    assert.equal(actions.clearWrongBook(), true)
    assert.deepEqual(log.map((x) => x[0]), ['refresh', 'wrongBookClear', 'clearWrongBook'])
    assert.deepEqual(JSON.parse(s.getItem(STUDY)).wrongBook, [])
  })

  test('no-content (psd200): καμία ενέργεια δεν φτάνει στο service ή στον recorder· τα δεδομένα PSD115 ανέγγιχτα', () => {
    const s = storage()
    const log = []
    const svc = serviceOn(s)
    const before = svc.getSnapshot()
    const actions = session.createStudyActions({ course: session.studyCourse('psd200', svc.courseId), service: spied(svc, log), record: recorders(log) })
    assert.deepEqual(runAll(actions), [false, false, false, false, false])
    assert.deepEqual(log, [], 'ούτε refresh, ούτε recorder, ούτε service')
    assertUntouched(s, svc, before)
  })

  test('no-progress (ids που υπάρχουν στο PSD115): καμία εγγραφή, κανένας recorder, καμία αλλαγή στο PSD115', () => {
    const s = storage()
    const log = []
    const svc = serviceOn(s)
    const before = svc.getSnapshot()
    const actions = session.createStudyActions({ course: session.studyCourse('demo', svc.courseId, DEMO), service: spied(svc, log), record: recorders(log) })
    assert.deepEqual(runAll(actions), [false, false, false, false, false])
    assert.deepEqual(log, [])
    assertUntouched(s, svc, before)
  })

  test('checklist άλλου μαθήματος: ούτε refresh, ούτε recorder, ούτε εγγραφή στο PSD115', () => {
    const s = storage()
    const svc = serviceOn(s)
    const before = svc.getSnapshot()
    const rec = []
    let refreshed = 0
    const service = { ...svc, refresh: () => void (refreshed += 1) }
    // Υπαρκτό topic του PSD115 (pavlov): χωρίς τον έλεγχο, θα γραφόταν στο checklist του PSD115.
    const r = applyChecklistUpdate({ service, courseId: 'psd200', topicId: 'pavlov', length: 9, next: (p) => p.map(() => true), record: (x) => rec.push(x) })
    assert.equal(r, false)
    assert.deepEqual([rec, refreshed], [[], 0])
    assertUntouched(s, svc, before)
  })
})

describe('Φάση 5 I2 / I5 — περιεχόμενο από το STUDY_CONTENT, ισοδυναμία PSD115', () => {
  test('STUDY_CONTENT.psd115: κατηγορίες και ετικέτες του μαθήματος', () => {
    assert.equal(STUDY_CONTENT.psd115.categories, psd115Questions.CATEGORIES)
    assert.equal(STUDY_CONTENT.psd115.categories.length, 49)
    for (const c of psd115Questions.CATEGORIES) assert.equal(STUDY_CONTENT.psd115.getCategoryLabel(c.id), c.label)
    assert.equal(STUDY_CONTENT.psd115.getCategoryLabel('άγνωστη'), 'άγνωστη')
  })

  test('ετικέτα wrongBook του production fixture: ίδια με πριν', () => {
    const svc = serviceOn(storage())
    const c = session.studyCourse('psd115', svc.courseId)
    const [w] = session.sessionProgress(svc.getSnapshot(), c).wrongBook
    assert.equal(w.group, 'w2-variables')
    assert.equal(c.content.getCategoryLabel(w.group), 'Εβδ.2 — Μεταβλητές & συσχέτιση')
  })

  test('σελίδα προόδου: όλο το PSD115 = 49 κατηγορίες / 208 ερωτήσεις· k2 = κατηγορίες της k2', () => {
    const ready = session.studyCourse('psd115', 'psd115')
    const all = display.progressPageView({ kind: 'progress', scope: { kind: 'course', courseId: 'psd115' }, courseId: 'psd115' }, ready)
    assert.equal(all.categories, psd115Questions.CATEGORIES)
    assert.equal(all.totalQuiz, 208)
    assert.deepEqual([all.scope.kind, all.scope.courseId], ['course', 'psd115'])
    const k2 = display.progressPageView({ kind: 'progress', scope: { kind: 'unit', courseId: 'psd115', unitId: 'k2' }, courseId: 'psd115', unitId: 'k2' }, ready)
    assert.equal(k2.categories, psd115Questions.WEEK2_CATEGORIES)
    const k2ids = new Set(psd115Questions.WEEK2_CATEGORIES.map((x) => x.id))
    assert.equal(k2.totalQuiz, psd115Questions.quizQuestions.filter((q) => k2ids.has(q.categoryId)).length)
    assert.deepEqual([k2.scope.kind, k2.scope.cardIds.length], ['unit', 56])

    // Τιμές με το production fixture, όπως στη Φάση 4.
    const p = serviceOn(storage()).getSnapshot().courses.psd115
    const k1 = display.progressPageView({ kind: 'progress', scope: { kind: 'unit', courseId: 'psd115', unitId: 'k1' }, courseId: 'psd115', unitId: 'k1' }, ready)
    assert.deepEqual(scopedProgress(p, k1.scope), { quizCorrect: 0, quizAnswered: 0, seenCards: 21, totalCards: 94 })
    assert.deepEqual(scopedProgress(p, k2.scope), { quizCorrect: 0, quizAnswered: 1, seenCards: 0, totalCards: 56 })
    assert.deepEqual(scopedProgress(p, all.scope), { quizCorrect: 0, quizAnswered: 1, seenCards: 21, totalCards: 198 })
  })

  test('σελίδα προόδου δεύτερου μαθήματος (ready): κατηγορίες, ερωτήσεις και κάρτες ΜΟΝΟ αυτού του μαθήματος', () => {
    const ready = session.studyCourse('demo', 'demo', DEMO)
    for (const [scope, unitId] of [[{ kind: 'course', courseId: 'demo' }], [{ kind: 'unit', courseId: 'demo', unitId: 'u1' }, 'u1']]) {
      const v = display.progressPageView({ kind: 'progress', scope, courseId: 'demo', unitId }, ready, DEMO)
      assert.equal(v.kind, 'ok', scope.kind)
      assert.deepEqual(v.categories, DEMO.demo.categories)
      assert.equal(v.totalQuiz, 1)
      assert.deepEqual([v.scope.courseId, [...v.scope.cardIds], [...v.scope.groupIds]], ['demo', ['fc-freud-1'], ['demo-cat']])
    }
    assert.deepEqual(display.courseCategories('demo', DEMO), DEMO.demo.categories)
  })

  test('σελίδα προόδου: μάθημα χωρίς περιεχόμενο ή χωρίς πρόοδο → «δεν υποστηρίζεται», όχι μηδενικά', () => {
    const none = display.progressPageView({ kind: 'progress', scope: { kind: 'course', courseId: 'psd200' }, courseId: 'psd200' }, session.studyCourse('psd200', 'psd115'))
    assert.equal(none.kind, 'unsupported')
    const demoCourse = session.studyCourse('demo', 'psd115', DEMO)
    const demo = display.progressPageView({ kind: 'progress', scope: { kind: 'course', courseId: 'demo' }, courseId: 'demo' }, demoCourse)
    assert.equal(demo.kind, 'unsupported')
    // Ασυμφωνία διαδρομής / μαθήματος συνεδρίας → επίσης unsupported (ποτέ πρόοδος άλλου μαθήματος).
    const mismatch = display.progressPageView({ kind: 'progress', scope: { kind: 'course', courseId: 'psd115' }, courseId: 'psd115' }, session.studyCourse('psd200', 'psd115'))
    assert.equal(mismatch.kind, 'unsupported')
  })
})

describe('Φάση 5 I4 — guard για απευθείας imports περιεχομένου PSD115', () => {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
  const files = walk(path.join(root, 'src')).filter((f) => /\.(js|jsx)$/.test(f))
  const rel = (f) => path.relative(root, f).split(path.sep).join('/')
  const importsPsd115Content = (src) => /from\s+['"][^'"]*content\/courses\/psd115\//.test(src)

  // Adapters (η ΜΟΝΗ σύνδεση με το περιεχόμενο) και οι σελίδες του PSD115 (επίπεδο Γ, μένουν ως έχουν).
  const ALLOWED = [
    /^src\/core\/study\/content\.js$/,
    /^src\/core\/routing\/catalog\.js$/,
    /^src\/core\/progress\/adapters\/psd115\.js$/,
    /^src\/pages\/Week[1-4](Layout|Home|TopicPage)\.jsx$/,
    /^src\/pages\/routing\/coursePresentation\.js$/,
    /^src\/components\/[A-Za-z0-9]+Lesson\.jsx$/,
    /^src\/components\/PptSlideDeck\.jsx$/,
  ]
  const MUST_NOT = ['src/hooks/useStudySession.js', 'src/components/Progress.jsx', 'src/components/WrongAnswersReview.jsx', 'src/pages/routing/registryPages.jsx']

  test('μελέτη/εμφάνιση προόδου χωρίς απευθείας import ή σταθερό «psd115»', () => {
    for (const f of MUST_NOT) {
      const src = fs.readFileSync(path.join(root, f), 'utf8')
      assert.equal(importsPsd115Content(src), false, `${f}: import από content/courses/psd115/`)
      assert.equal(/['"]psd115['"]/.test(src), false, `${f}: σταθερό 'psd115'`)
    }
  })

  test('κανένα άλλο αρχείο του src/ δεν εισάγει απευθείας περιεχόμενο PSD115', () => {
    const offenders = files.filter((f) => importsPsd115Content(fs.readFileSync(f, 'utf8'))).map(rel).filter((f) => !ALLOWED.some((re) => re.test(f)))
    assert.deepEqual(offenders, [])
  })

  test('η allowlist δεν περιέχει κανένα από τα αρχεία μελέτης/εμφάνισης', () => {
    for (const f of MUST_NOT) assert.equal(ALLOWED.some((re) => re.test(f)), false, f)
  })
})
