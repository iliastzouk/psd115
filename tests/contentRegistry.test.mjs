/**
 * Φάση 6d-α (α2–α3) — ενιαίο registry περιεχομένου: τα manifests (content/courses/index.js) → κατάλογος του routing και
 * περιεχόμενο μελέτης, με pure συναρτήσεις (src/core/content/registry.js).
 *
 * Ισοδυναμία με τις ρητές καταχωρίσεις που υπήρχαν πριν από τη Φάση 6d (CONTENT_COURSES στο routing/catalog.js,
 * STUDY_CONTENT στο study/content.js): εδώ ξαναγράφονται ΡΗΤΑ από τα modules του PSD115 (EXPECTED_*) και συγκρίνονται
 * με τον παραγόμενο κατάλογο και με το δημόσιο API (getContentCourse, STUDY_CONTENT): ίδιες units, θέματα, έγγραφα,
 * τιμές και ίδια σειρά παντού.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { COURSES } from '../content/courses/index.js'
import { psd115 } from '../content/courses/psd115/index.js'
import { course as psd115Course } from '../content/courses/psd115/course.js'
import { topics as psd115Topics } from '../content/courses/psd115/topics.js'
import { sources as psd115Sources } from '../content/courses/psd115/sources.js'
import * as Q from '../content/courses/psd115/questions.js'
import { getWeek1ExamQuestions } from '../content/courses/psd115/units/k1/index.js'
import { getWeek2ExamQuestions } from '../content/courses/psd115/units/k2/index.js'
import { getWeek3ExamQuestions } from '../content/courses/psd115/units/k3/index.js'
import { getWeek4ExamQuestions } from '../content/courses/psd115/units/k4/index.js'
import { deriveCatalog, deriveStudyContent } from '../src/core/content/registry.js'
import { checkCourseContent } from '../src/core/content/courseContract.js'
import { contentCourseIds, getContentCourse } from '../src/core/routing/catalog.js'
import { STUDY_CONTENT } from '../src/core/study/content.js'
import { registry } from '../src/core/academic/data/index.js'
import { demoChapters } from './fixtures/courses/demo-chapters/index.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8')

/** Οι καταχωρίσεις πριν από τη Φάση 6d, αυτούσιες. */
const EXPECTED_CATALOG = { psd115: { course: psd115Course, topics: psd115Topics, docs: psd115Sources } }
const EXPECTED_STUDY = {
  psd115: {
    flashcards: Q.flashcards,
    quizQuestions: Q.quizQuestions,
    categories: Q.CATEGORIES,
    getCategoryLabel: Q.getCategoryLabel,
    units: {
      k1: { categories: Q.WEEK1_CATEGORIES, examQuestions: getWeek1ExamQuestions },
      k2: { categories: Q.WEEK2_CATEGORIES, examQuestions: getWeek2ExamQuestions },
      k3: { categories: Q.WEEK3_CATEGORIES, examQuestions: getWeek3ExamQuestions },
      k4: { categories: Q.WEEK4_CATEGORIES, examQuestions: getWeek4ExamQuestions },
    },
  },
}

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
  test('ίδια μαθήματα, με την ίδια σειρά (παραγόμενος κατάλογος και δημόσιο API)', () => {
    assert.deepEqual(Object.keys(catalog), Object.keys(EXPECTED_CATALOG))
    assert.deepEqual(contentCourseIds(), Object.keys(EXPECTED_CATALOG))
  })
  for (const id of Object.keys(EXPECTED_CATALOG)) {
    const expected = EXPECTED_CATALOG[id]
    for (const [name, actual] of [['registry', () => catalog[id]], ['getContentCourse', () => getContentCourse(id)]]) {
      test(`${id} · ${name}: ίδιες units (πεδία και σειρά), θέματα, έγγραφα, provenance`, () => {
        assert.deepStrictEqual(actual(), expected)
        assert.deepEqual(actual().course.units.map((u) => u.id), expected.course.units.map((u) => u.id))
        assert.deepEqual(actual().topics.map((t) => t.id), expected.topics.map((t) => t.id))
        assert.deepEqual(actual().docs.map((d) => d.id), expected.docs.map((d) => d.id))
      })
    }
  }
})

describe('ισοδυναμία: STUDY_CONTENT', () => {
  test('ίδια μαθήματα, με την ίδια σειρά', () => {
    assert.deepEqual(Object.keys(study), Object.keys(EXPECTED_STUDY))
    assert.deepEqual(Object.keys(STUDY_CONTENT), Object.keys(EXPECTED_STUDY))
  })
  for (const id of Object.keys(EXPECTED_STUDY)) {
    const before = EXPECTED_STUDY[id]
    for (const [name, get] of [['registry', () => study[id]], ['STUDY_CONTENT', () => STUDY_CONTENT[id]]]) {
      test(`${id} · ${name}: ίδιες τιμές (κάρτες, ερωτήσεις, κατηγορίες, units) και ίδια σειρά`, () => {
        const actual = get()
        assert.deepStrictEqual(actual, before)
        assert.deepEqual(Object.keys(actual), Object.keys(before))
        assert.deepEqual(Object.keys(actual.units), Object.keys(before.units))
        for (const k of ['flashcards', 'quizQuestions', 'categories']) assert.deepEqual(actual[k].map((x) => x.id), before[k].map((x) => x.id), k)
      })
      test(`${id} · ${name}: ίδιες συναρτήσεις (ετικέτες, ερωτήσεις ανάπτυξης) με ίδια αποτελέσματα`, () => {
        const actual = get()
        assert.equal(actual.getCategoryLabel, before.getCategoryLabel)
        for (const [u, x] of Object.entries(before.units)) {
          assert.equal(actual.units[u].examQuestions, x.examQuestions, u)
          assert.deepEqual(actual.units[u].examQuestions(), x.examQuestions(), u)
          assert.deepEqual(actual.units[u].categories.map((c) => c.id), x.categories.map((c) => c.id), u)
        }
      })
    }
  }
  test('frozen, όπως πριν', () => {
    for (const s of [study, STUDY_CONTENT]) assert.ok(Object.isFrozen(s) && Object.isFrozen(s.psd115) && Object.isFrozen(s.psd115.units) && Object.isFrozen(s.psd115.units.k1))
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

describe('α3: ένα σημείο καταχώρισης (κανένα ρητό CONTENT_COURSES / STUDY_CONTENT)', () => {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
  const importsOf = (code) => [...code.matchAll(/(?:from|import\()\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
  test('μόνο το src/core/content/index.js εισάγει το content/courses/index.js', () => {
    const users = walk(path.join(root, 'src'))
      .filter((f) => importsOf(fs.readFileSync(f, 'utf8')).some((i) => /content\/courses\/index\.js$/.test(i)))
      .map((f) => path.relative(root, f))
    assert.deepEqual(users, ['src/core/content/index.js'])
  })
  test('catalog.js και study/content.js: από το registry, χωρίς import του content/ ή μαθήματος', () => {
    for (const f of ['src/core/routing/catalog.js', 'src/core/study/content.js']) {
      const code = read(f)
      assert.deepEqual(importsOf(code).filter((i) => i.includes('content/courses')), [], f)
      assert.match(code, /from '\.\.\/content\/index\.js'/, f)
      assert.doesNotMatch(code, /psd\d{3}|PSD\d{3}/, f)
    }
  })
  test('src/core/content/index.js: παράγει και τα δύο από τα ίδια manifests', () => {
    const code = read('src/core/content/index.js')
    assert.match(code, /deriveCatalog\(COURSES\)/)
    assert.match(code, /deriveStudyContent\(COURSES\)/)
  })
})
