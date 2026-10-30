/**
 * Φάση 4 — εμφάνιση προόδου ανά scope (H2–H4) και αφαίρεση του `storage.js` (H1).
 *
 *  H2  κάρτες: αριθμητής ΚΑΙ παρονομαστής από την πραγματική λίστα καρτών του scope (τομή με ό,τι έχει δει)· orphan
 *      κάρτες δεν μετρούν· X ≤ Y πάντα. Τίποτα δεν αλλάζει στο storage.
 *  H3  ακρίβεια κουίζ σε ενότητα: από το byGroup των ομάδων της ενότητας· χωρίς απαντήσεις → «—».
 *  H4  ακρίβεια σε ολόκληρο το μάθημα: οι υπάρχοντες progress.quizCorrect / quizAnswered (ακόμα κι αν διαφέρουν από το
 *      άθροισμα του byGroup — ιστορικά δεδομένα).
 *  H1  καμία εξάρτηση από το `storage.js`· οι αναμενόμενες τιμές είναι ανεξάρτητες (όχι ο παλιός κώδικας ως oracle).

 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { flashcards, WEEK1_CATEGORIES, WEEK2_CATEGORIES, CATEGORIES } from '../content/courses/psd115/questions.js'
import { courseProgress } from '../src/core/progress/courseProgress.js'
import { studyContentAdapters } from '../src/core/progress/adapters/studyContent.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
/**
 * Φάση 6b: το snapshot μέσω της ενεργής υποδομής (courseProgress + adapter του STUDY_CONTENT) από το
 * study-progress.sample.json — ίδιο με το snapshot του παλιού production fixture (21 κάρτες της k1, 1 λάθος της k2).
 */
const SAMPLE = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/study-progress.sample.json'), 'utf8'))
const PROD = (() => {
  const r = courseProgress({ courseId: 'psd115', content: studyContentAdapters().psd115, events: SAMPLE.events.filter((e) => e.item.startsWith('psd115/')), state: SAMPLE.state })
  assert.equal(r.status, 'ready')
  return r.snapshot
})()
const cardsOf = (cats) => {
  const ids = new Set(cats.map((c) => c.id))
  return flashcards.filter((c) => ids.has(c.categoryId)).map((c) => c.id)
}
const unit = (cats) => ({ kind: 'unit', courseId: 'psd115', cardIds: cardsOf(cats), groupIds: cats.map((c) => c.id) })
const course = { kind: 'course', courseId: 'psd115', cardIds: cardsOf(CATEGORIES), groupIds: CATEGORIES.map((c) => c.id) }
const load = () => import('../src/components/progressDisplay.js')

describe('H2 · κάρτες ανά scope', () => {
  test('το δείγμα της νέας μορφής: 1 απάντηση (λάθος, k2), 21 κάρτες της k1', () => {
    assert.deepEqual({ a: PROD.quizAnswered, c: PROD.quizCorrect, byGroup: PROD.byGroup }, { a: 1, c: 0, byGroup: { 'w2-variables': { correct: 0, wrong: 1 } } })
    assert.equal(new Set(PROD.flashcardSeenIds).size, 21)
  })
  test('k2 με το δείγμα (καμία κάρτα της k2) → 0/56, ανεξάρτητα από τις κάρτες άλλων ενοτήτων', async () => {
    const { scopedProgress, progressSummary } = await load()
    const s = scopedProgress(PROD, unit(WEEK2_CATEGORIES))
    assert.equal(PROD.flashcardSeenIds.length, 21, 'το δείγμα έχει 21 κάρτες (όλες της k1)')
    assert.deepEqual({ seen: s.seenCards, total: s.totalCards }, { seen: 0, total: 56 })
    assert.match(progressSummary(s), /Κάρτες 0\/56 \(0%\)/)
  })
  test('k1 με το δείγμα → 21/94', async () => {
    const { scopedProgress } = await load()
    const s = scopedProgress(PROD, unit(WEEK1_CATEGORIES))
    assert.deepEqual({ seen: s.seenCards, total: s.totalCards }, { seen: 21, total: 94 })
  })
  test('orphan κάρτες (δεν υπάρχουν στο περιεχόμενο) και κάρτες άλλου μαθήματος δεν μετρούν· X ≤ Y, ποσοστό ≤ 100%', async () => {
    const { scopedProgress, progressSummary } = await load()
    const all = cardsOf(WEEK1_CATEGORIES).map((id) => `psd115/${id}`)
    const p = { ...PROD, flashcardSeenIds: [...all, 'psd115/fc-gone-1', 'psd115/fc-gone-2', 'psd125/fc-x'] }
    const s = scopedProgress(p, unit(WEEK1_CATEGORIES))
    assert.deepEqual({ seen: s.seenCards, total: s.totalCards }, { seen: 94, total: 94 })
    assert.match(progressSummary(s), /Κάρτες 94\/94 \(100%\)/)
    assert.match(progressSummary({ seenCards: 0, totalCards: 0, quizCorrect: 0, quizAnswered: 0 }), /Κάρτες 0\/0 \(0%\)/)
  })
  test('διπλότυπα στη λίστα των καρτών που είδε δεν μετρούν δύο φορές', async () => {
    const { scopedProgress } = await load()
    const s = scopedProgress({ ...PROD, flashcardSeenIds: [...PROD.flashcardSeenIds, ...PROD.flashcardSeenIds] }, unit(WEEK1_CATEGORIES))
    assert.equal(s.seenCards, 21)
  })
})

describe('H3 · ακρίβεια κουίζ σε ενότητα (από το byGroup της ενότητας)', () => {
  test('k1 με το δείγμα (η μόνη απάντηση είναι της k2) → «—», όχι η ακρίβεια της k2', async () => {
    const { scopedProgress, progressSummary } = await load()
    const s = scopedProgress(PROD, unit(WEEK1_CATEGORIES))
    assert.deepEqual({ c: s.quizCorrect, a: s.quizAnswered }, { c: 0, a: 0 })
    assert.match(progressSummary(s), /^Κουίζ — ·/)
  })
  test('k2 → από το byGroup των ομάδων της k2', async () => {
    const { scopedProgress, progressSummary } = await load()
    const p = { ...PROD, byGroup: { 'w2-variables': { correct: 3, wrong: 1 }, [WEEK1_CATEGORIES[0].id]: { correct: 0, wrong: 9 } } }
    const s = scopedProgress(p, unit(WEEK2_CATEGORIES))
    assert.deepEqual({ c: s.quizCorrect, a: s.quizAnswered }, { c: 3, a: 4 })
    assert.match(progressSummary(s), /^Κουίζ 75% ·/)
  })
})

describe('H4 · ολόκληρο μάθημα: οι υπάρχοντες συνολικοί μετρητές', () => {
  test('quizCorrect/quizAnswered όπως είναι, ακόμα κι αν διαφέρουν από το άθροισμα του byGroup', async () => {
    const { scopedProgress, progressSummary } = await load()
    const p = { ...PROD, quizAnswered: 10, quizCorrect: 7, byGroup: { 'w2-variables': { correct: 1, wrong: 1 } } }
    const s = scopedProgress(p, course)
    assert.deepEqual({ c: s.quizCorrect, a: s.quizAnswered }, { c: 7, a: 10 })
    assert.match(progressSummary(s), /^Κουίζ 70% ·/)
  })
  test('δείγμα: Κουίζ 0% (0/1) · Κάρτες 21/198 — όπως σήμερα, μόνο χωρίς orphan κάρτες', async () => {
    const { scopedProgress, progressSummary } = await load()
    const s = scopedProgress(PROD, course)
    assert.equal(s.totalCards, flashcards.length)
    assert.equal(progressSummary(s), `Κουίζ 0% · Κάρτες 21/${flashcards.length} (11%)`)
  })
  test('χωρίς απαντήσεις → «—»', async () => {
    const { scopedProgress, progressSummary } = await load()
    assert.match(progressSummary(scopedProgress({ ...PROD, quizAnswered: 0, quizCorrect: 0 }, course)), /^Κουίζ — ·/)
  })
})

describe('H1 · χωρίς storage.js', () => {
  test('το src/utils/storage.js δεν υπάρχει και κανένα αρχείο δεν το εισάγει', () => {
    assert.equal(fs.existsSync(path.join(root, 'src/utils/storage.js')), false)
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
    for (const f of [...walk(path.join(root, 'src')), ...walk(path.join(root, 'tests')), ...walk(path.join(root, 'scripts'))]) {
      if (!/\.(m?js|jsx)$/.test(f) || f.endsWith('progressDisplay.test.mjs')) continue
      assert.doesNotMatch(fs.readFileSync(f, 'utf8'), /utils\/storage\.js/, path.relative(root, f))
    }
  })
})

describe('review #16 · contract του scope: ορίζεται από το περιεχόμενο, άκυρο scope → σφάλμα', () => {
  test('progressScopeFor: κάθε ενότητα = οι κάρτες και οι ομάδες της από το περιεχόμενο', async () => {
    const { progressScopeFor } = await load()
    const { WEEK3_CATEGORIES, WEEK4_CATEGORIES } = await import('../content/courses/psd115/questions.js')
    for (const [unitId, cats, n] of [['k1', WEEK1_CATEGORIES, 94], ['k2', WEEK2_CATEGORIES, 56], ['k3', WEEK3_CATEGORIES, 28], ['k4', WEEK4_CATEGORIES, 20]]) {
      const s = progressScopeFor('psd115', unitId)
      assert.equal(s.kind, 'unit')
      assert.deepEqual(s.cardIds, cardsOf(cats), unitId)
      assert.deepEqual(s.groupIds, cats.map((c) => c.id), unitId)
      assert.equal(s.cardIds.length, n)
    }
  })
  test('progressScopeFor χωρίς ενότητα = ολόκληρο το μάθημα (όλες οι κάρτες και ομάδες)', async () => {
    const { progressScopeFor } = await load()
    const s = progressScopeFor('psd115')
    assert.equal(s.kind, 'course')
    assert.equal(s.cardIds.length, flashcards.length)
    assert.deepEqual([...s.groupIds].sort(), CATEGORIES.map((c) => c.id).sort())
  })
  test('progressScopeFor: άγνωστο μάθημα ή ενότητα → σφάλμα', async () => {
    const { progressScopeFor } = await load()
    assert.throws(() => progressScopeFor('psd125', 'k1'), /άγνωστο μάθημα/)
    assert.throws(() => progressScopeFor('psd115', 'k9'), /άγνωστη ενότητα/)
  })
  const INVALID = {
    'άγνωστο kind': (s) => ({ ...s, kind: 'topic' }),
    'άγνωστο μάθημα': (s) => ({ ...s, courseId: 'psd125' }),
    'άγνωστη κάρτα': (s) => ({ ...s, cardIds: [...s.cardIds, 'fc-gone-1'] }),
    'global id κάρτας αντί για local': (s) => ({ ...s, cardIds: [`psd115/${s.cardIds[0]}`] }),
    'άγνωστη ομάδα': (s) => ({ ...s, groupIds: [...s.groupIds, 'w9-nope'] }),
  }
  for (const [label, broken] of Object.entries(INVALID)) {
    test(`scopedProgress: ${label} → σφάλμα, όχι παραπλανητική μέτρηση`, async () => {
      const { progressScopeFor, scopedProgress } = await load()
      assert.throws(() => scopedProgress(PROD, broken(progressScopeFor('psd115', 'k1'))), /progressScope/)
    })
  }
  test('callers: κανένας δεν κατασκευάζει μόνος του cardIds/groupIds — όλοι μέσω progressScopeFor', () => {
    const files = ['src/pages/Week1Layout.jsx', 'src/pages/Week2Layout.jsx', 'src/pages/Week3Layout.jsx', 'src/pages/Week4Layout.jsx']
    for (const f of files) {
      const code = fs.readFileSync(path.join(root, f), 'utf8')
      assert.match(code, /progressScopeFor\(/, f)
      assert.doesNotMatch(code, /cardIds:|groupIds:/, f)
    }
    // Φάση 5: η σελίδα προόδου παίρνει το scope από το progressPageView (που καλεί το progressScopeFor).
    const page = fs.readFileSync(path.join(root, 'src/pages/routing/registryPages.jsx'), 'utf8')
    assert.match(page, /progressPageView\(/)
    assert.doesNotMatch(page, /cardIds:|groupIds:/)
    const view = fs.readFileSync(path.join(root, 'src/components/progressDisplay.js'), 'utf8')
    assert.match(view.slice(view.indexOf('export function progressPageView')), /scope: progressScopeFor\(courseId, unitId, contentMap\)/)
  })
})
