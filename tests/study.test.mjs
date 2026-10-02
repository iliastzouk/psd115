/**
 * Tests του canonical study scope (Phase 1D). Run: npm test
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { course } from '../content/courses/psd115/course.js'
import { topics } from '../content/courses/psd115/topics.js'
import * as Q from '../content/courses/psd115/questions.js'
import * as K1 from '../content/courses/psd115/units/k1/index.js'
import * as K2 from '../content/courses/psd115/units/k2/index.js'
import * as K3 from '../content/courses/psd115/units/k3/index.js'
import * as K4 from '../content/courses/psd115/units/k4/index.js'
import { LEGACY_TOOLS, toCanonical } from '../src/core/routing/legacy.js'
import { resolveLocation } from '../src/core/routing/resolve.js'
import { STUDY_CONTENT } from '../src/core/study/content.js'
import { EMPTY_MATERIAL, MATERIAL_TOOLS, selectStudyMaterial, studyScope, studyScopeKey } from '../src/core/study/scope.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const resolveUrl = (url) => {
  const [p, q = ''] = url.split('?')
  return resolveLocation(p, q ? `?${q}` : '')
}
const materialFor = (url) => selectStudyMaterial(studyScope(resolveUrl(url)))
const ids = (m) => ({
  categories: m.categories.map((c) => c.id),
  flashcards: m.flashcards.map((c) => c.id),
  quizQuestions: m.quizQuestions.map((q) => q.id),
  examQuestions: m.examQuestions.map((q) => q.id),
})
const isEmpty = (m) => Object.values(ids(m)).every((list) => list.length === 0)

/**
 * ΑΝΑΦΟΡΑ (μόνο για σύγκριση): η επιλογή υλικού ΠΡΙΝ από το 1D, όπως την έκαναν τα
 * useStudySession / ExamMode από το legacy κλειδί (weekBand, προεπιλογή Εβδ. 1).
 */
function legacySelection(legacyKey) {
  const band = legacyKey.startsWith('/week/4') ? 4 : legacyKey.startsWith('/week/3') ? 3 : legacyKey.startsWith('/week/2') ? 2 : 1
  const cats = Q[`WEEK${band}_CATEGORIES`]
  const set = new Set(cats.map((c) => c.id))
  const exam = { 1: K1.getWeek1ExamQuestions, 2: K2.getWeek2ExamQuestions, 3: K3.getWeek3ExamQuestions, 4: K4.getWeek4ExamQuestions }[band]
  return {
    categories: cats,
    flashcards: Q.flashcards.filter((c) => set.has(c.categoryId)),
    quizQuestions: Q.quizQuestions.filter((q) => set.has(q.categoryId)),
    examQuestions: exam(),
  }
}

describe('studyScope(identity)', () => {
  test('unit / topic / study unit scope → unit', () => {
    assert.deepEqual(studyScope(resolveUrl('/psd115/units/k2')), { kind: 'unit', courseId: 'psd115', unitId: 'k2', source: 'unit' })
    assert.deepEqual(studyScope(resolveUrl('/study/quiz?scope=unit:psd115/k3')), {
      kind: 'unit',
      courseId: 'psd115',
      unitId: 'k3',
      source: 'tool',
    })
    for (const tool of MATERIAL_TOOLS) assert.equal(studyScope(resolveUrl(`/study/${tool}?scope=unit:psd115/k1`)).kind, 'unit')
  })
  test('σελίδα θέματος → η unit που το περιέχει (όχι topic scope, χωρίς topicId)', () => {
    const s = studyScope(resolveUrl('/psd115/topics/pavlov'))
    assert.deepEqual(s, { kind: 'unit', courseId: 'psd115', unitId: 'k1', source: 'topic' })
    assert.equal('topicId' in s, false)
  })
  test('course scope → course, χωρίς υλικό και χωρίς fallback σε k1', () => {
    assert.deepEqual(studyScope(resolveUrl('/study/quiz?scope=psd115')), { kind: 'course', courseId: 'psd115' })
    assert.equal(selectStudyMaterial(studyScope(resolveUrl('/study/quiz?scope=psd115'))), EMPTY_MATERIAL)
  })
  test('topic / term scope σε εργαλείο → unsupported, χωρίς υλικό', () => {
    for (const tool of MATERIAL_TOOLS) {
      const s = studyScope(resolveUrl(`/study/${tool}?scope=topic:psd115/pavlov`))
      assert.deepEqual(s, { kind: 'unsupported', reason: 'topic' })
      assert.ok(isEmpty(selectStudyMaterial(s)))
    }
    assert.deepEqual(studyScope(resolveUrl('/study/quiz?scope=term:2026F')), { kind: 'unsupported', reason: 'term' })
  })
  test('διαδρομές χωρίς scope μελέτης → none (όχι πια «Εβδομάδα 1»)', () => {
    for (const url of ['/', '/psd115', '/progress?scope=psd115', '/progress?scope=unit:psd115/k2', '/terms/2026F', '/psd200', '/nope', '/study/today?scope=unit:psd115/k2', '/psd115/docs/k1-slides']) {
      assert.deepEqual(studyScope(resolveUrl(url)), { kind: 'none' }, url)
      assert.equal(materialFor(url), EMPTY_MATERIAL, url)
    }
  })
  test('MATERIAL_TOOLS = τα εργαλεία που αποδίδει το routing για unit scope', () => {
    assert.deepEqual([...MATERIAL_TOOLS], [...LEGACY_TOOLS])
  })
  test('studyScopeKey', () => {
    assert.equal(studyScopeKey(studyScope(resolveUrl('/psd115/topics/empiricism'))), 'unit:psd115/k2')
    assert.equal(studyScopeKey({ kind: 'none' }), 'none')
  })
})

describe('selectStudyMaterial(scope) και adapter', () => {
  test('τα κλειδιά units του STUDY_CONTENT ταυτίζονται με το course.js· μόνο μαθήματα με περιεχόμενο', () => {
    assert.deepEqual(Object.keys(STUDY_CONTENT), ['psd115'])
    assert.deepEqual(Object.keys(STUDY_CONTENT.psd115.units), course.units.map((u) => u.id))
  })
  test('ο adapter δεν περιέχει topics ή διευθύνσεις', () => {
    const src = fs.readFileSync(path.join(root, 'src/core/study/content.js'), 'utf8')
    assert.doesNotMatch(src, /\/week\//)
    assert.doesNotMatch(src, /topics\.js|topicId/)
  })
  test('πλήθη ανά unit (πριν από shuffle)', () => {
    const expected = {
      k1: [20, 94, 123, 42],
      k2: [8, 56, 40, 24],
      k3: [11, 28, 25, 11],
      k4: [10, 20, 20, 10],
    }
    for (const [unitId, counts] of Object.entries(expected)) {
      const m = selectStudyMaterial({ kind: 'unit', courseId: 'psd115', unitId })
      assert.deepEqual([m.categories.length, m.flashcards.length, m.quizQuestions.length, m.examQuestions.length], counts, unitId)
    }
  })
  test('οι 4 units καλύπτουν ακριβώς όλο το περιεχόμενο, χωρίς επικαλύψεις (49/198/208/87)', () => {
    const all = course.units.map((u) => ids(selectStudyMaterial({ kind: 'unit', courseId: 'psd115', unitId: u.id })))
    for (const [field, total] of [['categories', 49], ['flashcards', 198], ['quizQuestions', 208], ['examQuestions', 87]]) {
      const list = all.flatMap((m) => m[field])
      assert.equal(list.length, total, field)
      assert.equal(new Set(list).size, total, field)
    }
  })
  test('σταθερό αντικείμενο ανά scope (ασφαλές για React deps)', () => {
    const a = selectStudyMaterial({ kind: 'unit', courseId: 'psd115', unitId: 'k2', source: 'tool' })
    const b = selectStudyMaterial({ kind: 'unit', courseId: 'psd115', unitId: 'k2', source: 'topic' })
    assert.equal(a, b)
  })
  test('psd200 και άγνωστη unit → κενό υλικό (τίποτα fabricated)', () => {
    assert.equal(selectStudyMaterial({ kind: 'unit', courseId: 'psd200', unitId: 'k1' }), EMPTY_MATERIAL)
    assert.equal(selectStudyMaterial({ kind: 'unit', courseId: 'psd115', unitId: 'k9' }), EMPTY_MATERIAL)
    assert.deepEqual(studyScope(resolveUrl('/study/quiz?scope=psd200')), { kind: 'course', courseId: 'psd200' })
    assert.equal(materialFor('/study/quiz?scope=psd200'), EMPTY_MATERIAL)
    assert.equal(materialFor('/psd200'), EMPTY_MATERIAL)
  })
})

describe('ισοδυναμία legacy → canonical (20 διαδρομές μελέτης)', () => {
  const studyRoutes = course.units.flatMap((u) => [u.route, ...LEGACY_TOOLS.map((t) => `${u.route}/${t}`)])
  test('είναι ακριβώς 20: 4 units + 16 εργαλεία', () => assert.equal(studyRoutes.length, 20))
  for (const legacyKey of studyRoutes) {
    test(`${legacyKey} → ${toCanonical(legacyKey)}: ίδιες κατηγορίες/κάρτες/κουίζ/ανάπτυξης, ίδια σειρά`, () => {
      const target = toCanonical(legacyKey)
      const scope = studyScope(resolveUrl(target))
      assert.equal(scope.kind, 'unit')
      assert.deepEqual(ids(selectStudyMaterial(scope)), ids(legacySelection(legacyKey)))
    })
  }
})

describe('θέματα (49 legacy διαδρομές): ταυτότητα και unit', () => {
  test('canonical topicId, σωστή unit, υλικό = της unit (όχι topic-specific)', () => {
    for (const t of topics) {
      const legacyKey = `${course.units.find((u) => u.id === t.unit).route}/${t.legacySlug}`
      const identity = resolveUrl(toCanonical(legacyKey))
      assert.equal(identity.kind, 'topic', legacyKey)
      assert.equal(identity.topicId, t.id, legacyKey)
      assert.equal(identity.unitId, t.unit, legacyKey)
      const scope = studyScope(identity)
      assert.deepEqual(scope, { kind: 'unit', courseId: 'psd115', unitId: t.unit, source: 'topic' }, legacyKey)
      assert.equal(selectStudyMaterial(scope), selectStudyMaterial({ kind: 'unit', courseId: 'psd115', unitId: t.unit }))
      // και ίδιο με πριν: η σελίδα θέματος έπαιρνε την εβδομάδα του legacy κλειδιού της
      assert.deepEqual(ids(selectStudyMaterial(scope)), ids(legacySelection(legacyKey)), legacyKey)
    }
  })
})

describe('guard: το study layer δεν διαβάζει διεύθυνση ή legacy κλειδί', () => {
  test('useStudySession, ExamMode, src/core/study/*', () => {
    const files = [
      'src/hooks/useStudySession.js',
      'src/pages/ExamMode.jsx',
      ...fs.readdirSync(path.join(root, 'src/core/study')).map((f) => `src/core/study/${f}`),
    ]
    for (const rel of files) {
      const src = fs.readFileSync(path.join(root, rel), 'utf8')
      for (const re of [/useLocation/, /pathname/, /useLegacyRouteKey/, /legacyKey/, /\/week\//, /weekBand/]) {
        assert.doesNotMatch(src, re, `${rel}: ${re}`)
      }
    }
  })
  test('src/core/study/* δεν εξαρτάται από router/React', () => {
    for (const f of fs.readdirSync(path.join(root, 'src/core/study'))) {
      const src = fs.readFileSync(path.join(root, 'src/core/study', f), 'utf8')
      assert.doesNotMatch(src, /react-router|from 'react'|core\/routing/, f)
    }
  })
})
