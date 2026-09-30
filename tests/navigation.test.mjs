/**
 * Tests της ακαδημαϊκής πλοήγησης (Phase 1C-C). Run: npm test
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { course } from '../content/courses/psd115/course.js'
import { topics } from '../content/courses/psd115/topics.js'
import { WEEK1_LESSON_NAV } from '../content/courses/psd115/units/k1/index.js'
import { WEEK2_LESSON_NAV } from '../content/courses/psd115/units/k2/index.js'
import { WEEK3_LESSON_NAV } from '../content/courses/psd115/units/k3/index.js'
import { WEEK4_LESSON_NAV } from '../content/courses/psd115/units/k4/index.js'
import { LEGACY_ROUTES, toCanonical } from '../src/core/routing/legacy.js'
import {
  activeCourseId,
  courseHomePath,
  courseIdentity,
  courseUnits,
  DEFAULT_COURSE_ID,
  topicNeighbors,
  unitNeighbors,
  unitTools,
  unitTopics,
  withTopics,
} from '../src/core/routing/navigation.js'
import { resolveLocation } from '../src/core/routing/resolve.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const LESSON_NAV = { k1: WEEK1_LESSON_NAV, k2: WEEK2_LESSON_NAV, k3: WEEK3_LESSON_NAV, k4: WEEK4_LESSON_NAV }
const allNavTopics = () => courseUnits('psd115').flatMap((u) => unitTopics('psd115', u.unitId))

describe('course → units', () => {
  test('οι units του psd115 προέρχονται από το course.js, με σειρά και canonical URLs', () => {
    const units = courseUnits('psd115')
    assert.deepEqual(
      units.map((u) => u.unitId),
      [...course.units].sort((a, b) => a.order - b.order).map((u) => u.id),
    )
    for (const u of units) assert.equal(u.path, `/psd115/units/${u.unitId}`)
  })
  test('ταυτότητα μαθήματος από το registry', () => {
    assert.deepEqual(courseIdentity('psd115'), { courseId: 'psd115', code: 'PSD115', title: 'Ψυχολογία ΙΙ', hasContent: true })
    assert.equal(courseIdentity('nope'), null)
  })
})

describe('unit → topics → canonical URL', () => {
  test('τα topicIds της πλοήγησης είναι ακριβώς αυτά του topics.js, με την ίδια σειρά', () => {
    assert.deepEqual(
      allNavTopics().map((t) => t.topicId),
      topics.map((t) => t.id),
    )
  })
  test('κάθε topic link είναι /psd115/topics/<topicId> και επιλύεται στο ίδιο topic', () => {
    for (const t of allNavTopics()) {
      assert.equal(t.path, `/psd115/topics/${t.topicId}`)
      assert.ok(!t.path.includes('/units/'), t.path)
      const id = resolveLocation(t.path)
      assert.equal(id.kind, 'topic')
      assert.equal(id.topicId, t.topicId)
      assert.equal(id.unitId, t.unitId)
    }
  })
  test('κανένα topicId δεν προκύπτει από pathname/slug: τα τρία overview έχουν semantic ids', () => {
    const ids = allNavTopics().map((t) => t.topicId)
    assert.ok(!ids.includes('overview'))
    for (const u of ['k2', 'k3', 'k4']) {
      const overview = unitTopics('psd115', u).find((t) => t.legacySlug === 'overview')
      assert.notEqual(overview.topicId, 'overview')
      assert.equal(overview.legacyKey, `${course.units.find((x) => x.id === u).route}/overview`)
    }
  })
  test('καμία διπλή εγγραφή πλοήγησης (topicId ή path)', () => {
    const list = allNavTopics()
    assert.equal(new Set(list.map((t) => t.topicId)).size, list.length)
    assert.equal(new Set(list.map((t) => t.path)).size, list.length)
    const units = courseUnits('psd115')
    assert.equal(new Set(units.map((u) => u.path)).size, units.length)
  })
  test('η σειρά θεμάτων κάθε unit ταυτίζεται με τη σειρά του lessonNav (ίδια εμπειρία με πριν)', () => {
    for (const [unitId, nav] of Object.entries(LESSON_NAV)) {
      assert.deepEqual(
        unitTopics('psd115', unitId).map((t) => t.legacyKey),
        nav.map((n) => n.to),
      )
    }
  })
  test('withTopics: ταυτότητα και σειρά από τα topics, κείμενο από το περιεχόμενο', () => {
    const cards = [...WEEK2_LESSON_NAV].reverse().map((n) => ({ slug: n.to.split('/').pop(), title: n.title }))
    const out = withTopics('psd115', 'k2', cards, (c) => c.slug)
    assert.deepEqual(
      out.map((c) => c.topicId),
      unitTopics('psd115', 'k2').map((t) => t.topicId),
    )
    assert.equal(out[0].path, '/psd115/topics/research-methods-overview')
    assert.deepEqual(withTopics('psd200', 'k1', cards, (c) => c.slug), [])
  })
})

describe('γείτονες και εργαλεία', () => {
  test('προηγούμενο/επόμενο θέμα = η παλιά σειρά του lessonNav, μέσα στην ίδια unit', () => {
    for (const [unitId, nav] of Object.entries(LESSON_NAV)) {
      const list = unitTopics('psd115', unitId)
      list.forEach((t, i) => {
        const { prev, next } = topicNeighbors('psd115', t.topicId)
        assert.equal(prev?.path ?? null, i > 0 ? toCanonical(nav[i - 1].to) : null)
        assert.equal(next?.path ?? null, i < nav.length - 1 ? toCanonical(nav[i + 1].to) : null)
      })
    }
    assert.deepEqual(topicNeighbors('psd115', 'nope'), { prev: null, next: null })
  })
  test('προηγούμενη/επόμενη unit', () => {
    assert.deepEqual(unitNeighbors('psd115', 'k1'), { prev: null, next: courseUnits('psd115')[1] })
    assert.equal(unitNeighbors('psd115', 'k4').next, null)
    assert.equal(unitNeighbors('psd115', 'k3').prev.unitId, 'k2')
  })
  test('εργαλεία unit → canonical /study URLs (ίδιοι στόχοι με τον legacy adapter)', () => {
    for (const u of courseUnits('psd115')) {
      const n = u.order
      for (const t of unitTools('psd115', u.unitId)) assert.equal(t.path, LEGACY_ROUTES.get(`/week/${n}/${t.tool}`))
    }
    assert.deepEqual(unitTools('psd115', 'k9'), [])
  })
})

describe('psd200 (μάθημα χωρίς περιεχόμενο)', () => {
  test('ταυτότητα από το registry, χωρίς fabricated units/topics', () => {
    assert.deepEqual(courseIdentity('psd200'), { courseId: 'psd200', code: 'PSD200', title: 'Αναπτυξιακή Ψυχολογία Ι', hasContent: false })
    assert.deepEqual(courseUnits('psd200'), [])
    assert.deepEqual(unitTopics('psd200', 'k1'), [])
    assert.deepEqual(unitTools('psd200', 'k1'), [])
    assert.deepEqual(unitNeighbors('psd200', 'k1'), { prev: null, next: null })
  })
  test('η σελίδα του μαθήματος επιλύεται· units/topics του όχι', () => {
    assert.equal(resolveLocation('/psd200').kind, 'course')
    for (const p of ['/psd200/units/k1', '/psd200/topics/pavlov', '/psd200/docs/k1-slides']) {
      assert.equal(resolveLocation(p).kind, 'notFound', p)
    }
  })
})

describe('ενεργό μάθημα (header)', () => {
  test('από την ταυτότητα της διαδρομής· προεπιλογή μόνο όταν η διαδρομή δεν έχει μάθημα', () => {
    assert.equal(activeCourseId(resolveLocation('/psd200')), 'psd200')
    assert.equal(activeCourseId(resolveLocation('/psd200/units/k1')), 'psd200')
    assert.equal(activeCourseId(resolveLocation('/psd115/topics/pavlov')), 'psd115')
    assert.equal(activeCourseId(resolveLocation('/study/quiz', '?scope=unit:psd115/k2')), 'psd115')
    assert.equal(activeCourseId(resolveLocation('/')), DEFAULT_COURSE_ID)
    assert.equal(activeCourseId(resolveLocation('/nope')), DEFAULT_COURSE_ID)
    assert.equal(courseHomePath('psd115'), '/')
    assert.equal(courseHomePath('psd200'), '/psd200')
  })
})

describe('legacy (αμετάβλητο)', () => {
  test('οι 69 legacy διαδρομές περνούν από τον ίδιο adapter', () => {
    assert.equal(LEGACY_ROUTES.size, 69)
    assert.equal(toCanonical('/week/2/empiricism'), '/psd115/topics/empiricism')
  })
  test('κανένα component/σελίδα δεν χρησιμοποιεί toCanonical ή γράφει /week/ link (μόνο ο router/adapter)', () => {
    const walk = (dir) =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))
    const files = [...walk(path.join(root, 'src/components')), ...walk(path.join(root, 'src/pages')), ...walk(path.join(root, 'src/layouts'))]
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8')
      const rel = path.relative(root, f)
      assert.doesNotMatch(src, /toCanonical/, rel)
      assert.doesNotMatch(src, /\bto=\{?["'`]\/week\//, rel)
    }
  })
})
