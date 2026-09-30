/**
 * Tests του canonical routing (Phase 1C-B). Run: npm test
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { course } from '../content/courses/psd115/course.js'
import { topics } from '../content/courses/psd115/topics.js'
import { sources } from '../content/courses/psd115/sources.js'
import { WEEK1_LESSON_NAV } from '../content/courses/psd115/units/k1/index.js'
import { WEEK2_TOPICS } from '../content/courses/psd115/units/k2/index.js'
import { WEEK3_TOPICS } from '../content/courses/psd115/units/k3/index.js'
import { WEEK4_TOPICS } from '../content/courses/psd115/units/k4/index.js'
import { checkTopicMap } from '../src/core/routing/catalog.js'
import { LEGACY_ROUTES, LEGACY_TOOLS, resolveLegacy, toCanonical } from '../src/core/routing/legacy.js'
import { coursePath, documentPath, progressPath, studyPath, termPath, topicPath, unitPath } from '../src/core/routing/paths.js'
import { formatScope, parseScope } from '../src/core/routing/scope.js'
import { resolveLocation } from '../src/core/routing/resolve.js'

const unitSlugs = {
  k1: WEEK1_LESSON_NAV.map((n) => n.to.replace(/^\/week\/1\//, '')),
  k2: WEEK2_TOPICS.map((t) => t.slug),
  k3: WEEK3_TOPICS.map((t) => t.slug),
  k4: WEEK4_TOPICS.map((t) => t.slug),
}
const resolveUrl = (url) => {
  const [p, q = ''] = url.split('?')
  return resolveLocation(p, q ? `?${q}` : '')
}

describe('paths', () => {
  test('URL contract', () => {
    assert.equal(coursePath('psd115'), '/psd115')
    assert.equal(unitPath('psd115', 'k2'), '/psd115/units/k2')
    assert.equal(topicPath('psd115', 'pavlov'), '/psd115/topics/pavlov')
    assert.equal(documentPath('psd115', 'k1-slides'), '/psd115/docs/k1-slides')
    assert.equal(termPath('2026F'), '/terms/2026F')
    assert.equal(studyPath('quiz', 'unit:psd115/k2'), '/study/quiz?scope=unit:psd115/k2')
    assert.equal(progressPath('psd115'), '/progress?scope=psd115')
    assert.throws(() => studyPath('nope', 'psd115'))
  })
})

describe('scope', () => {
  test('γραμματική Δ3 (round-trip)', () => {
    for (const s of ['psd115', 'unit:psd115/k2', 'topic:psd115/pavlov', 'term:2026F']) {
      assert.ok(parseScope(s), s)
      assert.equal(formatScope(parseScope(s)), s)
    }
    assert.deepEqual(parseScope('unit:psd115/k2'), { kind: 'unit', courseId: 'psd115', unitId: 'k2' })
  })
  test('άκυρα scopes', () => {
    for (const s of [null, '', 'PSD115', 'unit:psd115', 'unit:/k2', 'topic:psd115/', 'term:2026', 'week:1', 'unit:psd115/k2/x']) {
      assert.equal(parseScope(s), null, String(s))
    }
  })
})

describe('πίνακας θεμάτων (Δ1)', () => {
  test('49 ρητές εγγραφές, έγκυρος πίνακας', () => {
    assert.equal(topics.length, 49)
    assert.ok(Object.isFrozen(topics) && topics.every(Object.isFrozen))
    assert.deepEqual(checkTopicMap({ course, topics, unitSlugs }), [])
  })
  test('semantic ids για τα τρία overview', () => {
    const byId = Object.fromEntries(topics.map((t) => [t.id, t]))
    assert.deepEqual({ ...byId['research-methods-overview'] }, { id: 'research-methods-overview', unit: 'k2', legacySlug: 'overview' })
    assert.deepEqual({ ...byId['neurobiology-overview'] }, { id: 'neurobiology-overview', unit: 'k3', legacySlug: 'overview' })
    assert.deepEqual({ ...byId['sensation-perception-overview'] }, { id: 'sensation-perception-overview', unit: 'k4', legacySlug: 'overview' })
    assert.equal(byId.overview, undefined)
  })
  const bad = (mutate) => {
    const list = topics.map((t) => ({ ...t }))
    mutate(list)
    return checkTopicMap({ course, topics: list, unitSlugs })
  }
  test('αποτυγχάνει σε διπλό topicId / canonical path', () => {
    const e = bad((l) => (l[1].id = l[0].id))
    assert.ok(e.some((m) => m.includes('διπλό topicId')))
    assert.ok(e.some((m) => m.includes('διπλό canonical path')))
  })
  test('αποτυγχάνει σε topic χωρίς unit ή legacy αντιστοίχιση', () => {
    assert.ok(bad((l) => (l[0].unit = 'k9')).some((m) => m.includes('χωρίς έγκυρη unit')))
    assert.ok(bad((l) => delete l[0].unit).some((m) => m.includes('χωρίς έγκυρη unit')))
    assert.ok(bad((l) => (l[0].legacySlug = 'nope')).some((m) => m.includes('χωρίς legacy αντιστοίχιση')))
  })
  test('αποτυγχάνει όταν θέμα περιεχομένου λείπει ή αντιστοιχίζεται δύο φορές', () => {
    assert.ok(bad((l) => l.pop()).some((m) => m.includes('λείπει από τον πίνακα')))
    assert.ok(bad((l) => l.push({ id: 'dup', unit: 'k1', legacySlug: 'pavlov' })).some((m) => m.includes('δύο topics')))
    assert.ok(bad((l) => (l[0].id = 'Bad Id')).some((m) => m.includes('άκυρο id')))
  })
})

describe('legacy → canonical (αναλλοίωτο A)', () => {
  test('69 ρητές διαδρομές, όλες μοναδικοί στόχοι', () => {
    assert.equal(LEGACY_ROUTES.size, 4 + 4 * LEGACY_TOOLS.length + 49)
    assert.equal(new Set(LEGACY_ROUTES.values()).size, LEGACY_ROUTES.size)
  })
  test('κάθε legacy URL του περιεχομένου έχει canonical στόχο που επιλύεται στο ίδιο legacyKey', () => {
    const keys = [
      ...course.units.map((u) => u.route),
      ...course.units.flatMap((u) => LEGACY_TOOLS.map((t) => `${u.route}/${t}`)),
      ...Object.entries(unitSlugs).flatMap(([u, slugs]) => slugs.map((s) => `/week/${u.slice(1)}/${s}`)),
    ]
    assert.equal(keys.length, 69)
    for (const key of keys) {
      const target = toCanonical(key)
      const id = resolveUrl(target)
      assert.notEqual(id.kind, 'notFound', `${key} → ${target}`)
      assert.equal(id.legacyKey, key, `${key} → ${target}`)
    }
  })
  test('συγκεκριμένα παραδείγματα', () => {
    assert.equal(toCanonical('/week/2'), '/psd115/units/k2')
    assert.equal(toCanonical('/week/1/pavlov'), '/psd115/topics/pavlov')
    assert.equal(toCanonical('/week/3/overview'), '/psd115/topics/neurobiology-overview')
    assert.equal(toCanonical('/week/4/quiz'), '/study/quiz?scope=unit:psd115/k4')
    assert.deepEqual(resolveLegacy('/week/2/overview/'), { target: '/psd115/topics/research-methods-overview' })
  })
  test('άγνωστα legacy → Not Found (με link στη γνωστή εβδομάδα), ποτέ σιωπηλή ανακατεύθυνση', () => {
    assert.deepEqual(resolveLegacy('/week/2/does-not-exist'), { notFound: true, unit: { courseId: 'psd115', unitId: 'k2' } })
    assert.deepEqual(resolveLegacy('/week/9'), { notFound: true, unit: null })
    assert.deepEqual(resolveLegacy('/week/12/pavlov'), { notFound: true, unit: null })
    assert.throws(() => toCanonical('/week/1/nope'))
  })
})

describe('resolver (αναλλοίωτο B)', () => {
  test('κάθε canonical unit/topic/doc επιλύεται απευθείας', () => {
    for (const u of course.units) assert.equal(resolveUrl(unitPath('psd115', u.id)).kind, 'unit')
    for (const t of topics) {
      const id = resolveUrl(topicPath('psd115', t.id))
      assert.equal(id.kind, 'topic', t.id)
      assert.equal(id.unitId, t.unit)
      assert.equal(id.legacySlug, t.legacySlug)
    }
    for (const d of sources) assert.equal(resolveUrl(documentPath('psd115', d.id)).kind, 'doc')
  })
  test('course / term / study / progress', () => {
    assert.deepEqual(resolveUrl('/psd115'), { kind: 'course', courseId: 'psd115', hasContent: true, legacyKey: '' })
    assert.equal(resolveUrl('/psd200').hasContent, false)
    assert.equal(resolveUrl('/terms/2026F').kind, 'term')
    assert.equal(resolveUrl('/study/today?scope=term:2026F').kind, 'study')
    assert.equal(resolveUrl('/study/quiz?scope=psd115').kind, 'study')
    assert.equal(resolveUrl('/study/exam?scope=unit:psd115/k3').legacyKey, '/week/3/exam')
    assert.equal(resolveUrl('/progress?scope=unit:psd115/k2').unitId, 'k2')
    assert.equal(resolveUrl('/').kind, 'home')
  })
  test('αρνητικά → notFound', () => {
    for (const url of [
      '/nope',
      '/psd115/topics/overview',
      '/psd115/units/k9',
      '/psd115/docs/nope',
      '/psd115/foo/bar',
      '/psd115/units/k1/extra',
      '/study/quiz',
      '/study/quiz?scope=bad scope',
      '/study/quiz?scope=unit:psd115/k9',
      '/study/nope?scope=psd115',
      '/progress',
      '/terms/2030F',
    ]) {
      assert.equal(resolveUrl(url).kind, 'notFound', url)
    }
  })
})
