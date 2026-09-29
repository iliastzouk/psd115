/**
 * Legacy διαδρομές (/week/...) → canonical, ως ΡΗΤΟΣ πίνακας που χτίζεται από τα δεδομένα
 * (units του course.js, πίνακας θεμάτων topics.js). Καμία ευρετική ανάλυση URL.
 *
 * Επίσης το αντίστροφο: για μια επιλυμένη ταυτότητα, το «legacy κλειδί» που χρειάζεται το υπάρχον
 * περιεχόμενο (π.χ. διαφάνειες ανά διαδρομή, lessonNav.to) — ώστε το content/ να μην αλλάξει.
 */
import { contentCourseIds, getContentCourse, getUnit } from './catalog.js'
import { studyPath, topicPath, unitPath } from './paths.js'
import { unitScope } from './scope.js'

/** Εργαλεία που υπήρχαν ως /week/N/<tool>. */
export const LEGACY_TOOLS = Object.freeze(['flashcards', 'quiz', 'exam', 'review'])

export const legacyKeyForUnit = (courseId, unitId) => getUnit(courseId, unitId)?.route ?? null
export function legacyKeyForTopic(courseId, topic) {
  const base = legacyKeyForUnit(courseId, topic.unit)
  return base ? `${base}/${topic.legacySlug}` : null
}
export function legacyKeyForTool(courseId, unitId, tool) {
  const base = legacyKeyForUnit(courseId, unitId)
  return base && LEGACY_TOOLS.includes(tool) ? `${base}/${tool}` : null
}

function buildLegacyRoutes() {
  const map = new Map()
  const add = (from, to) => {
    if (map.has(from)) throw new Error(`Διπλή legacy διαδρομή: ${from}`)
    map.set(from, to)
  }
  for (const courseId of contentCourseIds()) {
    const { course, topics } = getContentCourse(courseId)
    for (const unit of course.units) {
      add(unit.route, unitPath(courseId, unit.id))
      for (const tool of LEGACY_TOOLS) add(`${unit.route}/${tool}`, studyPath(tool, unitScope(courseId, unit.id)))
    }
    for (const topic of topics) add(legacyKeyForTopic(courseId, topic), topicPath(courseId, topic.id))
  }
  return map
}

/** legacy path (χωρίς τελικό /) → canonical URL. */
export const LEGACY_ROUTES = buildLegacyRoutes()

/** Ρητή αντιστοίχιση ενός legacy κλειδιού σε canonical URL· σφάλμα αν δεν υπάρχει (λάθος προγραμματισμού). */
export function toCanonical(legacyPath) {
  const target = LEGACY_ROUTES.get(legacyPath)
  if (!target) throw new Error(`Δεν υπάρχει canonical αντιστοίχιση για ${legacyPath}`)
  return target
}

/**
 * Επίλυση εισερχόμενου legacy URL.
 * @returns {{ target: string } | { notFound: true, unit: { courseId: string, unitId: string } | null }}
 */
export function resolveLegacy(pathname) {
  const key = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  const target = LEGACY_ROUTES.get(key)
  if (target) return { target }
  // Άγνωστο: ΔΕΝ ανακατευθύνεται σιωπηλά. Αν ανήκει σε γνωστή εβδομάδα, προτείνεται link προς αυτή.
  for (const courseId of contentCourseIds()) {
    for (const unit of getContentCourse(courseId).course.units) {
      if (key.startsWith(`${unit.route}/`)) return { notFound: true, unit: { courseId, unitId: unit.id } }
    }
  }
  return { notFound: true, unit: null }
}
