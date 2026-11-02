/**
 * Φάση 6d-α (α2) — ενιαίο registry περιεχομένου: τα manifests (content/courses/index.js) → κατάλογος του routing και
 * περιεχόμενο μελέτης, με pure συναρτήσεις (src/core/content/registry.js). Ισοδυναμία με τις σημερινές ρητές
 * καταχωρίσεις: ίδιες units, θέματα, έγγραφα, τιμές STUDY_CONTENT και ίδια σειρά παντού.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { COURSES } from '../content/courses/index.js'
import { psd115 } from '../content/courses/psd115/index.js'
import { deriveCatalog, deriveStudyContent } from '../src/core/content/registry.js'
import { checkCourseContent } from '../src/core/content/courseContract.js'
import { contentCourseIds, getContentCourse } from '../src/core/routing/catalog.js'
import { STUDY_CONTENT } from '../src/core/study/content.js'
import { registry } from '../src/core/academic/data/index.js'
import { demoChapters } from './fixtures/courses/demo-chapters/index.js'

const catalog = deriveCatalog(COURSES)
const study = deriveStudyContent(COURSES)

describe('content/courses/index.js: μόνο πραγματικά μαθήματα', () => {
  test('σήμερα μόνο το PSD115· κάθε manifest περνά το συμβόλαιο', () => {
    assert.deepEqual(COURSES.map((m) => m.id), ['psd115'])
    assert.equal(COURSES[0], psd115)
    for (const m of COURSES) assert.deepEqual(checkCourseContent(m), [], m.id)
  })
  test('κάθε μάθημα υπάρχει στον ακαδημαϊκό κατάλογο· κανένα δοκιμαστικό', () => {
    const known = new Set(registry.courses.map((c) => c.id))
    for (const m of COURSES) assert.ok(known.has(m.id), m.id)
    assert.ok(!COURSES.some((m) => m.id === demoChapters.id))
  })
  test('PSD115: units με legacy διαδρομή, θέματα με legacySlug, provenance legacy (όπως πριν)', () => {
    assert.ok(psd115.units.every((u) => typeof u.legacy?.route === 'string'))
    assert.ok(psd115.topics.every((t) => typeof t.legacySlug === 'string'))
    assert.deepEqual(psd115.provenance, { origin: 'legacy', reviewed: false })
    assert.equal(psd115.terms, undefined, 'η ορολογία του PSD115 μένει στην παρουσίαση μέχρι τη Φάση 6d-β')
  })
})

describe('ισοδυναμία: κατάλογος routing', () => {
  test('ίδια μαθήματα, με την ίδια σειρά', () => assert.deepEqual(Object.keys(catalog), contentCourseIds()))
  for (const id of contentCourseIds()) {
    test(`${id}: ίδια units (πεδία και σειρά), θέματα, έγγραφα, provenance`, () => {
      const before = getContentCourse(id)
      assert.deepStrictEqual(catalog[id], before)
      assert.deepEqual(catalog[id].course.units.map((u) => u.id), before.course.units.map((u) => u.id))
      assert.deepEqual(catalog[id].topics.map((t) => t.id), before.topics.map((t) => t.id))
      assert.deepEqual(catalog[id].docs.map((d) => d.id), before.docs.map((d) => d.id))
    })
  }
})

describe('ισοδυναμία: STUDY_CONTENT', () => {
  test('ίδια μαθήματα, με την ίδια σειρά', () => assert.deepEqual(Object.keys(study), Object.keys(STUDY_CONTENT)))
  for (const id of Object.keys(STUDY_CONTENT)) {
    const before = STUDY_CONTENT[id]
    test(`${id}: ίδιες τιμές (κάρτες, ερωτήσεις, κατηγορίες, units) και ίδια σειρά`, () => {
      assert.deepStrictEqual(study[id], before)
      assert.deepEqual(Object.keys(study[id]), Object.keys(before))
      assert.deepEqual(Object.keys(study[id].units), Object.keys(before.units))
      for (const k of ['flashcards', 'quizQuestions', 'categories']) assert.deepEqual(study[id][k].map((x) => x.id), before[k].map((x) => x.id), k)
    })
    test(`${id}: ίδιες συναρτήσεις (ετικέτες, ερωτήσεις ανάπτυξης) με ίδια αποτελέσματα`, () => {
      assert.equal(study[id].getCategoryLabel, before.getCategoryLabel)
      for (const [u, x] of Object.entries(before.units)) {
        assert.equal(study[id].units[u].examQuestions, x.examQuestions, u)
        assert.deepEqual(study[id].units[u].examQuestions(), x.examQuestions(), u)
        assert.deepEqual(study[id].units[u].categories.map((c) => c.id), x.categories.map((c) => c.id), u)
      }
    })
  }
  test('frozen, όπως το σημερινό', () => {
    assert.ok(Object.isFrozen(study) && Object.isFrozen(study.psd115) && Object.isFrozen(study.psd115.units) && Object.isFrozen(study.psd115.units.k1))
    assert.ok(Object.isFrozen(catalog))
  })
})

describe('γενικό: οποιοδήποτε μάθημα ως παράμετρος', () => {
  const both = [psd115, demoChapters]
  test('demo-chapters: κατάλογος χωρίς legacy διαδρομές και decks, με τη σειρά του manifest', () => {
    const c = deriveCatalog(both)
    assert.deepEqual(Object.keys(c), ['psd115', 'demo-chapters'])
    const d = c['demo-chapters']
    assert.deepEqual(d.course.units, demoChapters.units.map(({ id, order, kind, label, title }) => ({ id, order, kind, label, title })))
    assert.ok(d.course.units.every((u) => !('route' in u) && !('deck' in u)))
    assert.equal(d.topics, demoChapters.topics)
    assert.deepEqual(d.docs, [])
    assert.deepEqual(d.course.provenance, demoChapters.provenance)
  })
  test('demo-chapters: περιεχόμενο μελέτης ανά κεφάλαιο', () => {
    const s = deriveStudyContent(both)['demo-chapters']
    assert.deepEqual(Object.keys(s.units), ['ch1', 'ch2', 'ch3'])
    assert.equal(s.units.ch3.categories, demoChapters.study.unitCategories.ch3)
    assert.deepEqual(s.units.ch2.examQuestions().map((q) => q.id), ['exam-demo-2', 'exam-demo-3'])
    assert.equal(s.flashcards, demoChapters.study.flashcards)
  })
  test('units ταξινομημένες κατά order, ανεξάρτητα από τη σειρά του πίνακα', () => {
    const shuffled = { ...demoChapters, units: [...demoChapters.units].reverse() }
    assert.deepEqual(deriveCatalog([shuffled])['demo-chapters'].course.units.map((u) => u.id), ['ch1', 'ch2', 'ch3'])
    assert.deepEqual(Object.keys(deriveStudyContent([shuffled])['demo-chapters'].units), ['ch1', 'ch2', 'ch3'])
  })
  test('ίδιο courseId δύο φορές → σφάλμα', () => {
    assert.throws(() => deriveCatalog([demoChapters, demoChapters]), /διπλό μάθημα «demo-chapters»/)
    assert.throws(() => deriveStudyContent([demoChapters, demoChapters]), /διπλό μάθημα «demo-chapters»/)
  })
})
