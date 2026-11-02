/**
 * Φάση 6d-α (α4) — οι παλιές διαδρομές είναι προαιρετικές και οι διαφάνειες βρίσκονται ανά topicId.
 *
 *  - buildLegacyRoutes / resolveLegacyIn (pure): μόνο units με δηλωμένο legacy route και topics με legacySlug· μάθημα
 *    χωρίς legacy δεν προσθέτει καμία διαδρομή. Ο πίνακας της εφαρμογής μένει ΑΚΡΙΒΩΣ ο ίδιος (69, ίδια σειρά).
 *  - legacy κλειδιά: '' όπου δεν υπάρχει legacy (ποτέ null ή «undefined/…»).
 *  - checkTopicMap: ο έλεγχος legacy αντιστοίχισης μόνο όπου δηλώνεται.
 *  - διαφάνειες: slides.byTopic του manifest (PSD115: adapter από τους πίνακες ανά legacy διαδρομή).
 * Το demo-chapters περνά ως παράμετρος σε pure συναρτήσεις.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { psd115 } from '../content/courses/psd115/index.js'
import { course } from '../content/courses/psd115/course.js'
import { topics } from '../content/courses/psd115/topics.js'
import { K1_PPT_SLIDES_BY_ROUTE } from '../content/courses/psd115/units/k1/k1PptRefsByRoute.js'
import { K2_PPT_SLIDES_BY_ROUTE } from '../content/courses/psd115/units/k2/k2PptRefsByRoute.js'
import { K3_PPT_SLIDES_BY_ROUTE } from '../content/courses/psd115/units/k3/k3PptRefsByRoute.js'
import { K4_PPT_SLIDES_BY_ROUTE } from '../content/courses/psd115/units/k4/k4PptRefsByRoute.js'
import { deriveCatalog, deriveTopicSlides } from '../src/core/content/registry.js'
import { checkCourseContent } from '../src/core/content/courseContract.js'
import { checkTopicMap, getTopicSlides } from '../src/core/routing/catalog.js'
import {
  buildLegacyRoutes,
  LEGACY_ROUTES,
  LEGACY_TOOLS,
  resolveLegacyIn,
  topicLegacyKey,
  toolLegacyKey,
  unitLegacyKey,
} from '../src/core/routing/legacy.js'
import { demoChapters } from './fixtures/courses/demo-chapters/index.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8')
const clone = (v) =>
  typeof v === 'function' ? v : Array.isArray(v) ? v.map(clone) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clone(x)])) : v

/** demo-chapters με legacy διαδρομή ΜΟΝΟ στο ch2 (3 θέματα). */
function demoWithLegacyCh2() {
  const m = clone(demoChapters)
  m.units[1].legacy = { route: '/old/2' }
  for (const t of m.topics.filter((x) => x.unit === 'ch2')) t.legacySlug = `old-${t.id}`
  return m
}

describe('buildLegacyRoutes (pure)', () => {
  test('ο πίνακας της εφαρμογής: ακριβώς 69 διαδρομές, ίδιες με τον υπολογισμό από τα manifests, ίδια σειρά', () => {
    assert.equal(LEGACY_ROUTES.size, 69)
    assert.deepEqual([...buildLegacyRoutes(deriveCatalog([psd115]))], [...LEGACY_ROUTES])
  })
  test('μάθημα χωρίς legacy (demo-chapters) δεν προσθέτει καμία διαδρομή, μόνο του ή μαζί με το PSD115', () => {
    assert.equal(buildLegacyRoutes(deriveCatalog([demoChapters])).size, 0)
    assert.deepEqual([...buildLegacyRoutes(deriveCatalog([psd115, demoChapters]))], [...LEGACY_ROUTES])
  })
  test('legacy μόνο σε μία unit: unit + εργαλεία + τα θέματά της, τίποτα για τις άλλες', () => {
    const routes = buildLegacyRoutes(deriveCatalog([demoWithLegacyCh2()]))
    assert.deepEqual([...routes], [
      ['/old/2', '/demo-chapters/units/ch2'],
      ...LEGACY_TOOLS.map((t) => [`/old/2/${t}`, `/study/${t}?scope=unit:demo-chapters/ch2`]),
      ['/old/2/old-kinds', '/demo-chapters/topics/kinds'],
      ['/old/2/old-examples', '/demo-chapters/topics/examples'],
      ['/old/2/old-comparison', '/demo-chapters/topics/comparison'],
    ])
  })
  test('κανένα κλειδί «undefined» ή κενό', () => {
    for (const r of [LEGACY_ROUTES, buildLegacyRoutes(deriveCatalog([psd115, demoWithLegacyCh2(), { ...demoChapters, id: 'demo-two' }]))]) {
      for (const k of r.keys()) assert.ok(k && !k.includes('undefined'), k)
    }
  })
})

describe('resolveLegacyIn (pure)', () => {
  const catalog = deriveCatalog([psd115, demoChapters])
  const routes = buildLegacyRoutes(catalog)
  test('γνωστή διαδρομή → canonical· άγνωστο θέμα σε γνωστή εβδομάδα → link στην εβδομάδα', () => {
    assert.deepEqual(resolveLegacyIn(catalog, routes, '/week/1/pavlov/'), { target: '/psd115/topics/pavlov' })
    assert.deepEqual(resolveLegacyIn(catalog, routes, '/week/3/nope'), { notFound: true, unit: { courseId: 'psd115', unitId: 'k3' } })
  })
  test('units χωρίς legacy route δεν «πιάνουν» καμία διαδρομή', () => {
    for (const p of ['/undefined/x', 'undefined/x', '/ch1/x', '/demo-chapters/x', '/old/2/x']) assert.deepEqual(resolveLegacyIn(catalog, routes, p), { notFound: true, unit: null }, p)
  })
  test('με legacy στο ch2: άγνωστο θέμα του /old/2 → link στο ch2', () => {
    const c = deriveCatalog([demoWithLegacyCh2()])
    assert.deepEqual(resolveLegacyIn(c, buildLegacyRoutes(c), '/old/2/nope'), { notFound: true, unit: { courseId: 'demo-chapters', unitId: 'ch2' } })
  })
})

describe('legacy κλειδιά: κενό όπου δεν υπάρχει legacy', () => {
  const [ch1] = deriveCatalog([demoChapters])['demo-chapters'].course.units
  const k1 = deriveCatalog([psd115]).psd115.course.units[0]
  test('unit', () => {
    assert.equal(unitLegacyKey(ch1), '')
    assert.equal(unitLegacyKey(k1), '/week/1')
    assert.equal(unitLegacyKey(undefined), '')
  })
  test('topic', () => {
    assert.equal(topicLegacyKey(ch1, { id: 'overview', unit: 'ch1' }), '')
    assert.equal(topicLegacyKey(k1, { id: 'x', unit: 'k1' }), '', 'unit με legacy, topic χωρίς legacySlug')
    assert.equal(topicLegacyKey(k1, topics[0]), '/week/1/definition')
  })
  test('εργαλείο', () => {
    assert.equal(toolLegacyKey(ch1, 'quiz'), '')
    assert.equal(toolLegacyKey(k1, 'quiz'), '/week/1/quiz')
    assert.equal(toolLegacyKey(k1, 'today'), '')
  })
})

describe('checkTopicMap: legacy έλεγχος μόνο όπου δηλώνεται', () => {
  test('μάθημα χωρίς legacy: έγκυρο χωρίς unitSlugs', () => {
    const c = deriveCatalog([demoChapters])['demo-chapters']
    assert.deepEqual(checkTopicMap({ course: c.course, topics: c.topics, unitSlugs: {} }), [])
  })
  test('legacy μόνο στο ch2: ελέγχεται μόνο εκεί', () => {
    const m = demoWithLegacyCh2()
    const c = deriveCatalog([m])['demo-chapters']
    const slugs = ['old-kinds', 'old-examples', 'old-comparison']
    assert.deepEqual(checkTopicMap({ course: c.course, topics: c.topics, unitSlugs: { ch2: slugs } }), [])
    assert.match(checkTopicMap({ course: c.course, topics: c.topics, unitSlugs: { ch2: slugs.slice(1) } }).join(), /χωρίς legacy αντιστοίχιση/)
    assert.match(checkTopicMap({ course: c.course, topics: c.topics, unitSlugs: { ch2: [...slugs, 'extra'] } }).join(), /ch2\/extra: λείπει/)
  })
  test('τα υπόλοιπα (διπλό id, άγνωστη unit) ελέγχονται πάντα', () => {
    const c = deriveCatalog([demoChapters])['demo-chapters']
    assert.match(checkTopicMap({ course: c.course, topics: [...c.topics, { id: 'overview', unit: 'ch1' }], unitSlugs: {} }).join(), /διπλό topicId/)
    assert.match(checkTopicMap({ course: c.course, topics: [{ id: 'x', unit: 'ch9' }], unitSlugs: {} }).join(), /χωρίς έγκυρη unit/)
  })
})

describe('διαφάνειες ανά topicId', () => {
  const BY_ROUTE = { k1: K1_PPT_SLIDES_BY_ROUTE, k2: K2_PPT_SLIDES_BY_ROUTE, k3: K3_PPT_SLIDES_BY_ROUTE, k4: K4_PPT_SLIDES_BY_ROUTE }
  const routeOf = (unitId) => course.units.find((u) => u.id === unitId).route
  test('PSD115: κάθε θέμα έχει τις ίδιες διαφάνειες με τον πίνακα ανά legacy διαδρομή (49/49)', () => {
    assert.equal(Object.keys(psd115.slides.byTopic).length, topics.length)
    for (const t of topics) {
      const expected = BY_ROUTE[t.unit][`${routeOf(t.unit)}/${t.legacySlug}`]
      assert.ok(expected?.length, t.id)
      assert.deepEqual(getTopicSlides('psd115', t.id), expected, t.id)
      assert.equal(psd115.slides.byTopic[t.id], expected, t.id)
    }
  })
  test('PSD115: decks ανά unit όπως πριν· το manifest μένει έγκυρο', () => {
    assert.deepEqual(psd115.slides.decks, Object.fromEntries(course.units.map((u) => [u.id, u.deck])))
    assert.deepEqual(checkCourseContent(psd115), [])
  })
  test('άγνωστο θέμα / μάθημα / μάθημα χωρίς slides → null', () => {
    assert.equal(getTopicSlides('psd115', 'nope'), null)
    assert.equal(getTopicSlides('psd200', 'pavlov'), null)
    assert.deepEqual(deriveTopicSlides([demoChapters]), { 'demo-chapters': {} })
    assert.deepEqual(deriveTopicSlides([psd115]).psd115, psd115.slides.byTopic)
    assert.ok(Object.isFrozen(deriveTopicSlides([psd115])) && Object.isFrozen(deriveTopicSlides([psd115]).psd115))
  })
  test('τα layouts βρίσκουν τις διαφάνειες με το topicId, όχι με το legacy κλειδί', () => {
    for (const n of [1, 2, 3, 4]) {
      const code = read(`src/pages/Week${n}Layout.jsx`)
      assert.doesNotMatch(code, /PPT_SLIDES_BY_ROUTE|useLegacyRouteKey|legacyKey/, `Week${n}Layout`)
      assert.match(code, /getTopicSlides\('psd115', id\.topicId\)/, `Week${n}Layout`)
    }
  })
  test('κανείς στο src/ δεν διαβάζει πια διαφάνειες με legacy κλειδί· το useLegacyRouteKey αφαιρέθηκε', () => {
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
    for (const f of walk(path.join(root, 'src'))) assert.doesNotMatch(fs.readFileSync(f, 'utf8'), /PPT_SLIDES_BY_ROUTE|useLegacyRouteKey/, path.relative(root, f))
  })
})
