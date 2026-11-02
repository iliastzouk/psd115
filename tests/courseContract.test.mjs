/**
 * Φάση 6d-α (α1) — συμβόλαιο περιεχομένου μαθήματος (src/core/content/courseContract.js): pure έλεγχος ενός manifest,
 * χωρίς κανένα μάθημα στον κώδικα. Το συνθετικό μάθημα `demo-chapters` (tests/fixtures/courses/) περνά ως παράμετρος·
 * δεν φτάνει ποτέ στην εφαρμογή (Δ1).
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { checkCourseContent, courseTerms, DEFAULT_TERMS, manifestIds, MANIFEST_KEYS } from '../src/core/content/courseContract.js'
import { demoChapters } from './fixtures/courses/demo-chapters/index.js'
import { checkLedger } from '../scripts/id-ledger.mjs'
import { STUDY_CONTENT } from '../src/core/study/content.js'
import { getContentCourse } from '../src/core/routing/catalog.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8')

/** Βαθύ αντίγραφο που κρατά τις συναρτήσεις (structuredClone δεν τις αντιγράφει). */
const clone = (v) =>
  typeof v === 'function' ? v : Array.isArray(v) ? v.map(clone) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clone(x)])) : v
const variant = (mutate) => {
  const m = clone(demoChapters)
  mutate(m)
  return m
}
const errorsOf = (mutate) => checkCourseContent(variant(mutate)).join('\n')

describe('demo-chapters: έγκυρο, πλούσιο, συνθετικό', () => {
  test('περνά το συμβόλαιο χωρίς σφάλματα', () => assert.deepEqual(checkCourseContent(demoChapters), []))
  test('3 «Κεφάλαια» ch1–ch3 με 1 / 3 / 2 θέματα· χωρίς legacy διαδρομές, slides ή PDF', () => {
    assert.deepEqual(demoChapters.units.map((u) => u.id), ['ch1', 'ch2', 'ch3'])
    assert.deepEqual(['ch1', 'ch2', 'ch3'].map((u) => demoChapters.topics.filter((t) => t.unit === u).length), [1, 3, 2])
    assert.ok(demoChapters.units.every((u) => !('legacy' in u)))
    assert.ok(demoChapters.topics.every((t) => !('legacySlug' in t)))
    assert.equal(demoChapters.slides, undefined)
    assert.deepEqual(demoChapters.docs, [])
  })
  test('δική του ορολογία («Κεφάλαιο») και δικές του κατηγορίες· μία κατηγορία κοινή σε δύο κεφάλαια', () => {
    assert.deepEqual(courseTerms(demoChapters), { unit: 'Κεφάλαιο', units: 'Κεφάλαια', unitShort: 'Κεφ.' })
    const uc = demoChapters.study.unitCategories
    const shared = demoChapters.study.categories.filter((c) => Object.values(uc).filter((list) => list.some((x) => x.id === c.id)).length === 2)
    assert.equal(shared.length, 1)
    const psd = new Set(STUDY_CONTENT.psd115.categories.map((c) => c.id))
    assert.ok(demoChapters.study.categories.every((c) => !psd.has(c.id)))
  })
  test('ερωτήσεις κουίζ με 3 και με 5 επιλογές', () => {
    const n = new Set(demoChapters.study.quizQuestions.map((q) => q.options.length))
    assert.ok(n.has(3) && n.has(5))
  })
  test('σκόπιμα ίδια τοπικά ids με το PSD115 (θέμα «overview», κάρτα «fc-def-1»): τα ids είναι ανά μάθημα', () => {
    assert.ok(demoChapters.topics.some((t) => t.id === 'overview'))
    assert.ok(demoChapters.study.flashcards.some((f) => f.id === 'fc-def-1'))
    assert.ok(STUDY_CONTENT.psd115.flashcards.some((f) => f.id === 'fc-def-1'))
  })
  test('ρητά συνθετικό κείμενο και provenance original (δικό μας)', () => {
    assert.match(read('tests/fixtures/courses/demo-chapters/index.js'), /Δοκιμαστικό μάθημα — μόνο για tests/)
    for (const u of demoChapters.units) assert.match(u.title, /^Δοκιμαστικό/, u.id)
    assert.deepEqual(demoChapters.provenance, { origin: 'original', license: 'own', author: 'Exam Prep — συνθετικό περιεχόμενο tests' })
  })
  test('δικό του μητρώο IDs (έγκυρο)· το μητρώο του PSD115 δεν το αφορά', () => {
    const ledger = JSON.parse(read('tests/fixtures/courses/demo-chapters/ids.ledger.json'))
    assert.deepEqual(checkLedger(ledger, { courseId: 'demo-chapters', ...manifestIds(demoChapters) }), [])
    assert.ok(!read('content/courses/psd115/ids.ledger.json').includes('demo-chapters'))
  })
  test('content:ledger --manifest: ελέγχει το μητρώο του demo (χωρίς --add δεν γράφει τίποτα)', () => {
    const file = 'tests/fixtures/courses/demo-chapters/ids.ledger.json'
    const before = read(file)
    const r = spawnSync(process.execPath, ['scripts/id-ledger.mjs', '--manifest', 'tests/fixtures/courses/demo-chapters/index.js'], { cwd: root, encoding: 'utf8' })
    assert.equal(r.status, 0, r.stderr)
    assert.match(r.stdout, /μητρώο demo-chapters έγκυρο/)
    assert.equal(read(file), before)
  })
  test('δεν φτάνει στην εφαρμογή: όχι στον κατάλογο, όχι στο STUDY_CONTENT, κανένα import του tests/ από το src/', () => {
    assert.equal(getContentCourse('demo-chapters'), null)
    assert.equal(STUDY_CONTENT['demo-chapters'], undefined)
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
    for (const f of walk(path.join(root, 'src')).filter((x) => /\.(m?js|jsx)$/.test(x))) {
      const code = fs.readFileSync(f, 'utf8')
      assert.doesNotMatch(code, /(from|import\()\s*['"][^'"]*\/tests\//, path.relative(root, f))
      assert.doesNotMatch(code, /demo-chapters/, path.relative(root, f))
    }
  })
})

describe('ορολογία (Δ5)', () => {
  test('προεπιλογή «Ενότητα»', () => {
    assert.deepEqual(DEFAULT_TERMS, { unit: 'Ενότητα', units: 'Ενότητες', unitShort: 'Ενότ.' })
    assert.deepEqual(courseTerms({ id: 'x' }), DEFAULT_TERMS)
    assert.ok(Object.isFrozen(courseTerms({ id: 'x' })))
  })
  test('μερικοί όροι συμπληρώνονται από την προεπιλογή', () => {
    assert.deepEqual(courseTerms({ terms: { unit: 'Κεφάλαιο' } }), { ...DEFAULT_TERMS, unit: 'Κεφάλαιο' })
  })
})

describe('checkCourseContent · αρνητικές παραλλαγές του demo-chapters', () => {
  const cases = [
    ['άκυρο id μαθήματος', (m) => (m.id = 'Demo Chapters'), /id μαθήματος/],
    ['άγνωστο πεδίο manifest', (m) => (m.extra = 1), /άγνωστο πεδίο «extra»/],
    ['λείπει υποχρεωτικό πεδίο', (m) => delete m.provenance, /λείπει το «provenance»/],
    ['άκυρη ορολογία', (m) => (m.terms = { unit: '' }), /terms/],
    ['άγνωστος όρος', (m) => (m.terms = { chapter: 'Κεφ.' }), /terms: άγνωστο πεδίο «chapter»/],
    ['καμία unit', (m) => (m.units = []), /τουλάχιστον μία unit/],
    ['διπλό unit id', (m) => (m.units[1].id = 'ch1'), /διπλό unit id «ch1»/],
    ['διπλό order', (m) => (m.units[2].order = 1), /διπλό order 1/],
    ['μη ακέραιο order', (m) => (m.units[0].order = 1.5), /order/],
    ['unit χωρίς label', (m) => (m.units[0].label = ' '), /unit «ch1»: λείπει ή είναι κενό το «label»/],
    ['unit χωρίς title', (m) => delete m.units[0].title, /unit «ch1»: λείπει ή είναι κενό το «title»/],
    ['unit με άγνωστο πεδίο', (m) => (m.units[0].route = '/x'), /unit «ch1»: άγνωστο πεδίο «route»/],
    ['άκυρο legacy', (m) => (m.units[0].legacy = { route: 'week/1' }), /legacy\.route/],
    ['ίδιο legacy route σε δύο units', (m) => ((m.units[0].legacy = { route: '/old/1' }), (m.units[1].legacy = { route: '/old/1' })), /διπλό legacy\.route/],
    ['θέμα σε ανύπαρκτη unit', (m) => (m.topics[0].unit = 'ch9'), /topic «overview»: άγνωστη unit «ch9»/],
    ['διπλό topic id', (m) => (m.topics[1].id = 'overview'), /διπλό topic id «overview»/],
    ['άκυρο topic id', (m) => (m.topics[0].id = 'Over view'), /topic «Over view»: άκυρο id/],
    ['legacySlug σε unit χωρίς legacy route', (m) => (m.topics[0].legacySlug = 'overview'), /legacySlug χωρίς legacy\.route/],
    ['ίδιο legacySlug δύο φορές στην ίδια unit', (m) => {
      m.units[1].legacy = { route: '/old/2' }
      for (const t of m.topics.filter((x) => x.unit === 'ch2')) t.legacySlug = 'same'
    }, /legacySlug «same» δύο φορές/],
    ['unit χωρίς θέματα', (m) => (m.topics = m.topics.filter((t) => t.unit !== 'ch1')), /unit «ch1»: κανένα θέμα/],
    ['διπλή κατηγορία', (m) => m.study.categories.push({ ...m.study.categories[0] }), /διπλή κατηγορία/],
    ['κατηγορία χωρίς label', (m) => (m.study.categories[0].label = ''), /κατηγορία .*label/],
    ['unitCategories για ανύπαρκτη unit', (m) => (m.study.unitCategories.ch9 = []), /unitCategories: άγνωστη unit «ch9»/],
    ['unit χωρίς unitCategories', (m) => delete m.study.unitCategories.ch3, /unitCategories: λείπει η unit «ch3»/],
    ['unitCategories με άγνωστη κατηγορία', (m) => m.study.unitCategories.ch1.push({ id: 'zzz', label: 'Z' }), /ch1: άγνωστη κατηγορία «zzz»/],
    ['unitCategories με άλλη ετικέτα', (m) => (m.study.unitCategories.ch1[0] = { ...m.study.unitCategories.ch1[0], label: 'Άλλο' }), /ch1: η κατηγορία «.*» έχει άλλη ετικέτα/],
    ['κατηγορία σε καμία unit', (m) => m.study.categories.push({ id: 'orphan', label: 'Ορφανή' }), /κατηγορία «orphan»: σε καμία unit/],
    ['κάρτα με άγνωστη κατηγορία', (m) => (m.study.flashcards[0].categoryId = 'nope'), /κάρτα «fc-def-1»: άγνωστη κατηγορία «nope»/],
    ['κάρτα χωρίς back', (m) => (m.study.flashcards[0].back = ''), /κάρτα «fc-def-1»: λείπει ή είναι κενό το «back»/],
    ['άκυρο local id κάρτας', (m) => (m.study.flashcards[0].id = 'fc def'), /άκυρο id/],
    ['ίδιο id σε κάρτα και ερώτηση', (m) => (m.study.quizQuestions[0].id = 'fc-def-1'), /«fc-def-1».*κάρτα και ερώτηση/],
    ['διπλή κάρτα', (m) => m.study.flashcards.push({ ...m.study.flashcards[0] }), /διπλό id «fc-def-1»/],
    ['ερώτηση με άγνωστη κατηγορία', (m) => (m.study.quizQuestions[0].categoryId = 'nope'), /ερώτηση «.*»: άγνωστη κατηγορία «nope»/],
    ['ερώτηση με άκυρο τύπο', (m) => (m.study.quizQuestions[0].type = 'essay'), /άκυρος τύπος «essay»/],
    ['ερώτηση με 1 επιλογή', (m) => (m.study.quizQuestions[0].options = ['μόνη']), /τουλάχιστον 2 επιλογές/],
    ['ερώτηση με διπλές επιλογές', (m) => (m.study.quizQuestions[0].options = ['α', 'α', 'β']), /διπλές επιλογές/],
    ['correctIndex εκτός ορίων', (m) => (m.study.quizQuestions[0].correctIndex = 9), /άκυρο correctIndex 9/],
    ['Σ/Λ με 3 επιλογές', (m) => {
      const q = m.study.quizQuestions.find((x) => x.type === 'tf')
      q.options = ['Σωστό', 'Λάθος', 'Ίσως']
    }, /Σ\/Λ με 3 επιλογές/],
    ['ερώτηση χωρίς εξήγηση', (m) => (m.study.quizQuestions[0].explanation = ''), /λείπει ή είναι κενό το «explanation»/],
    ['getCategoryLabel όχι συνάρτηση', (m) => (m.study.getCategoryLabel = 'x'), /getCategoryLabel/],
    ['examQuestions χωρίς unit', (m) => delete m.study.examQuestions.ch2, /examQuestions: λείπει η unit «ch2»/],
    ['examQuestions για ανύπαρκτη unit', (m) => (m.study.examQuestions.ch9 = () => []), /examQuestions: άγνωστη unit «ch9»/],
    ['examQuestions όχι συνάρτηση', (m) => (m.study.examQuestions.ch1 = []), /examQuestions «ch1»: αναμενόταν συνάρτηση/],
    ['ερώτηση ανάπτυξης χωρίς idealAnswer', (m) => {
      const orig = m.study.examQuestions.ch1
      m.study.examQuestions.ch1 = () => orig().map((q) => ({ ...q, idealAnswer: '' }))
    }, /ερώτηση ανάπτυξης .*idealAnswer/],
    ['διπλή ερώτηση ανάπτυξης σε δύο units', (m) => {
      const first = m.study.examQuestions.ch1()[0]
      m.study.examQuestions.ch2 = () => [first]
    }, /ερώτηση ανάπτυξης: διπλό id/],
    ['έγγραφο σε ανύπαρκτη unit', (m) => (m.docs = [{ id: 'd1', unit: 'ch9', kind: 'slides', path: 'x/y.pdf' }]), /έγγραφο «d1»: άγνωστη unit «ch9»/],
    ['έγγραφο με απόλυτο path', (m) => (m.docs = [{ id: 'd1', unit: 'ch1', kind: 'slides', path: '/x/y.pdf' }]), /έγγραφο «d1»: .*path/],
    ['διπλό έγγραφο', (m) => (m.docs = [1, 2].map(() => ({ id: 'd1', unit: 'ch1', kind: 'slides', path: 'x/y.pdf' }))), /διπλό έγγραφο «d1»/],
    ['slides για ανύπαρκτη unit', (m) => (m.slides = { decks: { ch9: 'deck' }, byTopic: {} }), /slides\.decks: άγνωστη unit «ch9»/],
    ['slides για ανύπαρκτο θέμα', (m) => (m.slides = { decks: {}, byTopic: { nope: [1] } }), /slides\.byTopic: άγνωστο θέμα «nope»/],
    ['slides με άκυρους αριθμούς', (m) => (m.slides = { decks: {}, byTopic: { overview: [0, 'x'] } }), /slides\.byTopic «overview»: αναμενόταν μη κενός πίνακας θετικών ακεραίων/],
    ['slides για θέμα χωρίς deck στην unit του', (m) => (m.slides = { decks: {}, byTopic: { overview: [1] } }), /slides\.byTopic «overview»: η unit «ch1» δεν έχει deck/],
    ['provenance χωρίς origin', (m) => (m.provenance = {}), /provenance: άκυρο origin/],
    ['original χωρίς author', (m) => delete m.provenance.author, /provenance original: λείπει το «author»/],
    ['licensed χωρίς attribution', (m) => (m.provenance = { origin: 'licensed', source: 's', license: 'CC-BY-4.0' }), /provenance licensed: λείπει το «attribution»/],
    ['licensed χωρίς license/permission', (m) => (m.provenance = { origin: 'licensed', source: 's', attribution: 'a' }), /provenance licensed: λείπει «license» ή «permission»/],
    ['legacy χωρίς reviewed', (m) => (m.provenance = { origin: 'legacy' }), /provenance legacy: αναμενόταν «reviewed»/],
  ]
  for (const [name, mutate, re] of cases) {
    test(name, () => assert.match(errorsOf(mutate), re))
  }
  test('κάθε παραλλαγή είναι ανεξάρτητη: το αρχικό demo μένει έγκυρο', () => assert.deepEqual(checkCourseContent(demoChapters), []))
  test('μη αντικείμενο → ένα σφάλμα, χωρίς exception', () => {
    for (const v of [null, undefined, 1, 'x', []]) assert.equal(checkCourseContent(v).length, 1)
  })
  test('έγκυρα προαιρετικά: legacy routes, legacySlug, έγγραφα, slides, licensed / legacy provenance', () => {
    const m = variant((x) => {
      x.units[1].legacy = { route: '/old/2' }
      x.topics.filter((t) => t.unit === 'ch2').forEach((t, i) => (t.legacySlug = `s${i}`))
      x.docs = [{ id: 'ch1-notes', unit: 'ch1', kind: 'notes', path: 'demo/ch1.pdf' }]
      x.slides = { decks: { ch1: 'demo-deck' }, byTopic: { overview: [1, 2] } }
    })
    assert.deepEqual(checkCourseContent(m), [])
    assert.deepEqual(checkCourseContent({ ...m, provenance: { origin: 'licensed', source: 's', license: 'CC-BY-4.0', attribution: 'a' } }), [])
    assert.deepEqual(checkCourseContent({ ...m, provenance: { origin: 'licensed', source: 's', permission: 'email 2026-10-01', attribution: 'a' } }), [])
    assert.deepEqual(checkCourseContent({ ...m, provenance: { origin: 'legacy', reviewed: false } }), [])
  })
})

describe('το συμβόλαιο είναι γενικό', () => {
  test('πεδία manifest (6d-α)', () => {
    assert.deepEqual(MANIFEST_KEYS, ['id', 'terms', 'units', 'topics', 'study', 'docs', 'slides', 'provenance'])
  })
  test('manifestIds: κάρτες και ερωτήσεις για το μητρώο', () => {
    const ids = manifestIds(demoChapters)
    assert.deepEqual(ids.cards, demoChapters.study.flashcards.map((f) => f.id))
    assert.deepEqual(ids.questions, demoChapters.study.quizQuestions.map((q) => q.id))
  })
  test('το module δεν περιέχει κανένα μάθημα και δεν διαβάζει storage ή περιεχόμενο', () => {
    const code = read('src/core/content/courseContract.js')
    assert.doesNotMatch(code, /psd\d{3}|PSD\d{3}|demo-chapters/)
    assert.doesNotMatch(code, /localStorage|sessionStorage|content\/courses|^import /m)
  })
  test('ακόμα δεν χρησιμοποιείται από την εφαρμογή (α1)', () => {
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
    const users = walk(path.join(root, 'src')).filter((f) => !f.endsWith('courseContract.js') && fs.readFileSync(f, 'utf8').includes('courseContract'))
    assert.deepEqual(users, [])
  })
})
