/**
 * Φάση 4 — εμφάνιση προόδου ανά scope (H2–H4) και αφαίρεση του `storage.js` (H1).
 *
 *  H2  κάρτες: αριθμητής ΚΑΙ παρονομαστής από την πραγματική λίστα καρτών του scope (τομή με ό,τι έχει δει)· orphan
 *      κάρτες δεν μετρούν· X ≤ Y πάντα. Τίποτα δεν αλλάζει στο storage.
 *  H3  ακρίβεια κουίζ σε ενότητα: από το byGroup των ομάδων της ενότητας· χωρίς απαντήσεις → «—».
 *  H4  ακρίβεια σε ολόκληρο το μάθημα: οι υπάρχοντες progress.quizCorrect / quizAnswered (ακόμα κι αν διαφέρουν από το
 *      άθροισμα του byGroup — ιστορικά δεδομένα).
 *  H1  καμία εξάρτηση από το `storage.js`· οι αναμενόμενες τιμές είναι ανεξάρτητες (όχι ο παλιός κώδικας ως oracle).
 *
 * Tests με `todo` = υλοποιούνται σε επόμενο commit του ίδιου PR (test-first)· το `todo` αφαιρείται εκεί.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { flashcards, WEEK1_CATEGORIES, WEEK2_CATEGORIES, CATEGORIES } from '../content/courses/psd115/questions.js'
import { legacyToSnapshot } from '../src/core/progress/snapshot.js'
import { psd115ProgressAdapter as content } from '../src/core/progress/adapters/psd115.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const fixture = (name) => JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures', name), 'utf8')).keys
const PROD = legacyToSnapshot(fixture('progress-export.production-2026-10-05.json'), { content, mode: 'runtime' }).snapshot
const cardsOf = (cats) => {
  const ids = new Set(cats.map((c) => c.id))
  return flashcards.filter((c) => ids.has(c.categoryId)).map((c) => c.id)
}
const unit = (cats) => ({ kind: 'unit', courseId: 'psd115', cardIds: cardsOf(cats), groupIds: cats.map((c) => c.id) })
const course = { kind: 'course', courseId: 'psd115', cardIds: cardsOf(CATEGORIES), groupIds: CATEGORIES.map((c) => c.id) }
const load = () => import('../src/components/progressDisplay.js')

describe('H2 · κάρτες ανά scope', { todo: 'Φάση 4 εμφάνιση' }, () => {
  test('k2 με το production fixture (καμία κάρτα της k2) → 0/56, ανεξάρτητα από τις κάρτες άλλων ενοτήτων', async () => {
    const { scopedProgress, progressSummary } = await load()
    const s = scopedProgress(PROD, unit(WEEK2_CATEGORIES))
    assert.equal(PROD.flashcardSeenIds.length, 21, 'το fixture έχει 21 κάρτες (όλες της k1)')
    assert.deepEqual({ seen: s.seenCards, total: s.totalCards }, { seen: 0, total: 56 })
    assert.match(progressSummary(s), /Κάρτες 0\/56 \(0%\)/)
  })
  test('k1 με το production fixture → 21/94', async () => {
    const { scopedProgress } = await load()
    const s = scopedProgress(PROD, unit(WEEK1_CATEGORIES))
    assert.deepEqual({ seen: s.seenCards, total: s.totalCards }, { seen: 21, total: 94 })
  })
  test('orphan κάρτες (δεν υπάρχουν στο περιεχόμενο) και κάρτες άλλου μαθήματος δεν μετρούν· X ≤ Y, ποσοστό ≤ 100%', async () => {
    const { scopedProgress, progressSummary } = await load()
    const k4 = unit([{ id: 'w4-dummy' }].concat([])) // scope με 0 κάρτες
    const all = cardsOf(WEEK1_CATEGORIES).map((id) => `psd115/${id}`)
    const p = { ...PROD, flashcardSeenIds: [...all, 'psd115/fc-gone-1', 'psd115/fc-gone-2', 'psd125/fc-x'] }
    const s = scopedProgress(p, unit(WEEK1_CATEGORIES))
    assert.deepEqual({ seen: s.seenCards, total: s.totalCards }, { seen: 94, total: 94 })
    assert.match(progressSummary(s), /Κάρτες 94\/94 \(100%\)/)
    const empty = scopedProgress(p, k4)
    assert.deepEqual({ seen: empty.seenCards, total: empty.totalCards }, { seen: 0, total: 0 })
    assert.match(progressSummary(empty), /Κάρτες 0\/0 \(0%\)/)
  })
  test('διπλότυπα στη λίστα των καρτών που είδε δεν μετρούν δύο φορές', async () => {
    const { scopedProgress } = await load()
    const s = scopedProgress({ ...PROD, flashcardSeenIds: [...PROD.flashcardSeenIds, ...PROD.flashcardSeenIds] }, unit(WEEK1_CATEGORIES))
    assert.equal(s.seenCards, 21)
  })
})

describe('H3 · ακρίβεια κουίζ σε ενότητα (από το byGroup της ενότητας)', { todo: 'Φάση 4 εμφάνιση' }, () => {
  test('k1 με το production fixture (η μόνη απάντηση είναι της k2) → «—», όχι η ακρίβεια της k2', async () => {
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

describe('H4 · ολόκληρο μάθημα: οι υπάρχοντες συνολικοί μετρητές', { todo: 'Φάση 4 εμφάνιση' }, () => {
  test('quizCorrect/quizAnswered όπως είναι, ακόμα κι αν διαφέρουν από το άθροισμα του byGroup', async () => {
    const { scopedProgress, progressSummary } = await load()
    const p = { ...PROD, quizAnswered: 10, quizCorrect: 7, byGroup: { 'w2-variables': { correct: 1, wrong: 1 } } }
    const s = scopedProgress(p, course)
    assert.deepEqual({ c: s.quizCorrect, a: s.quizAnswered }, { c: 7, a: 10 })
    assert.match(progressSummary(s), /^Κουίζ 70% ·/)
  })
  test('production fixture: Κουίζ 0% (0/1) · Κάρτες 21/198 — όπως σήμερα, μόνο χωρίς orphan κάρτες', async () => {
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

describe('H1 · χωρίς storage.js — ανεξάρτητες αναμενόμενες τιμές', () => {
  /** Τα κλειδιά προόδου που σβήνει το reset (σταθερό fixture· όχι παραγόμενο από κώδικα). Theme/disclaimer ΔΕΝ σβήνονται. */
  const RESET_KEYS = [
    'psd115-w1-behaviorism-checklist', 'psd115-w1-chomsky-checklist', 'psd115-w1-cognitive-checklist',
    'psd115-w1-definition-checklist', 'psd115-w1-educational-psychology-checklist', 'psd115-w1-evolutionary-checklist',
    'psd115-w1-functionalism-checklist', 'psd115-w1-gestalt-checklist', 'psd115-w1-humanistic-checklist',
    'psd115-w1-little-albert-checklist', 'psd115-w1-neuroscience-checklist', 'psd115-w1-other-branches-checklist',
    'psd115-w1-pavlov-checklist', 'psd115-w1-psychoanalysis-checklist', 'psd115-w1-skinner-checklist',
    'psd115-w1-social-psychology-checklist', 'psd115-w1-study', 'psd115-w1-thorndike-checklist',
    'psd115-w1-wundt-checklist', 'psd115-w2-checklists', 'psd115-w3-checklists', 'psd115-w4-checklists',
  ]
  test('το reset σβήνει ακριβώς τα 22 κλειδιά προόδου (όχι theme/disclaimer)', async () => {
    const { legacyResetKeys } = await import('../src/utils/progressBackup.js')
    const m = new Map([...RESET_KEYS, 'psd115-w1-theme', 'psd115-disclaimer-v1'].map((k) => [k, '[]']))
    const storage = { get length() { return m.size }, key: (i) => [...m.keys()][i] ?? null, getItem: (k) => m.get(k) ?? null }
    assert.equal(RESET_KEYS.length, 22)
    assert.deepEqual(legacyResetKeys(storage).sort(), [...RESET_KEYS].sort())
  })
  test('ο reader της εφαρμογής φορτώνει αυτούσια την πρόοδο του δείγματος (τιμές του fixture)', () => {
    const keys = fixture('progress-export.sample.json')
    const r = legacyToSnapshot(keys, { content, mode: 'runtime' })
    assert.equal(r.ok, true)
    const study = JSON.parse(keys['psd115-w1-study'])
    assert.deepEqual({ a: r.snapshot.quizAnswered, c: r.snapshot.quizCorrect }, { a: study.quizAnswered, c: study.quizCorrect })
    assert.deepEqual([...r.snapshot.flashcardSeenIds].sort(), study.flashcardSeenIds.map((id) => `psd115/${id}`).sort())
    assert.deepEqual(r.snapshot.checklists.pavlov.items, [true, false, true])
    assert.deepEqual(r.snapshot.checklists['research-methods-overview'].items, [true, true, false])
  })
  test('το src/utils/storage.js δεν υπάρχει και κανένα αρχείο δεν το εισάγει', { todo: 'Φάση 4 H1' }, () => {
    assert.equal(fs.existsSync(path.join(root, 'src/utils/storage.js')), false)
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
    for (const f of [...walk(path.join(root, 'src')), ...walk(path.join(root, 'tests')), ...walk(path.join(root, 'scripts'))]) {
      if (!/\.(m?js|jsx)$/.test(f) || f.endsWith('progressDisplay.test.mjs')) continue
      assert.doesNotMatch(fs.readFileSync(f, 'utf8'), /utils\/storage\.js/, path.relative(root, f))
    }
  })
})
