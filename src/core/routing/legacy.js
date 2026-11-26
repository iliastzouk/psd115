/**
 * Legacy διαδρομές (/week/...) → canonical, ως ΡΗΤΟΣ πίνακας που χτίζεται από τα δεδομένα
 * (units του course.js, πίνακας θεμάτων topics.js). Καμία ευρετική ανάλυση URL.
 *
 * Επίσης το αντίστροφο: για μια επιλυμένη ταυτότητα, το «legacy κλειδί» που χρειάζεται το υπάρχον
 * περιεχόμενο (π.χ. lessonNav.to, τίτλοι θεμάτων) — ώστε το content/ να μην αλλάξει.
 *
 * Φάση 6d-α: οι legacy διαδρομές είναι ΠΡΟΑΙΡΕΤΙΚΕΣ. Μόνο units με δηλωμένο legacy route (στον κατάλογο: `route`) και
 * θέματα με `legacySlug` αποκτούν παλιές διαδρομές· χωρίς legacy, το κλειδί είναι ''. Οι pure συναρτήσεις δέχονται τον
 * κατάλογο ως παράμετρο· ο πίνακας της εφαρμογής χτίζεται από τον κατάλογο περιεχομένου.
 */
import { contentCourseIds, getContentCourse, getUnit } from './catalog.js'
import { studyPath, topicPath, unitPath } from './paths.js'
import { unitScope } from './scope.js'

/** Εργαλεία που υπήρχαν ως /week/N/<tool>. */
export const LEGACY_TOOLS = Object.freeze(['flashcards', 'quiz', 'exam', 'review'])

/** Pure: legacy κλειδί μιας unit του καταλόγου ('' χωρίς legacy). */
export const unitLegacyKey = (unit) => unit?.route ?? ''
/** Pure: legacy κλειδί ενός θέματος ('' αν η unit ή το θέμα δεν έχουν legacy). */
export const topicLegacyKey = (unit, topic) => (unit?.route && topic?.legacySlug ? `${unit.route}/${topic.legacySlug}` : '')
/** Pure: legacy κλειδί ενός εργαλείου μελέτης της unit ('' χωρίς legacy ή για εργαλείο που δεν υπήρχε). */
export const toolLegacyKey = (unit, tool) => (unit?.route && LEGACY_TOOLS.includes(tool) ? `${unit.route}/${tool}` : '')

export const legacyKeyForUnit = (courseId, unitId) => unitLegacyKey(getUnit(courseId, unitId))
export const legacyKeyForTopic = (courseId, topic) => topicLegacyKey(getUnit(courseId, topic.unit), topic)
export const legacyKeyForTool = (courseId, unitId, tool) => toolLegacyKey(getUnit(courseId, unitId), tool)

/**
 * Pure: legacy path (χωρίς τελικό /) → canonical URL, για κάθε μάθημα του καταλόγου.
 * @param {Readonly<Record<string, { course: { units: object[] }, topics: object[] }>>} catalog
 * @returns {Map<string, string>}
 */
export function buildLegacyRoutes(catalog) {
  const map = new Map()
  const add = (from, to) => {
    if (map.has(from)) throw new Error(`Διπλή legacy διαδρομή: ${from}`)
    map.set(from, to)
  }
  for (const [courseId, { course, topics }] of Object.entries(catalog)) {
    const units = new Map(course.units.map((u) => [u.id, u]))
    for (const unit of course.units) {
      if (!unitLegacyKey(unit)) continue
      add(unit.route, unitPath(courseId, unit.id))
      for (const tool of LEGACY_TOOLS) add(toolLegacyKey(unit, tool), studyPath(tool, unitScope(courseId, unit.id)))
    }
    for (const topic of topics) {
      const key = topicLegacyKey(units.get(topic.unit), topic)
      if (key) add(key, topicPath(courseId, topic.id))
    }
  }
  return map
}

/**
 * Pure: επίλυση εισερχόμενου legacy URL με δεδομένο κατάλογο και πίνακα.
 * @returns {{ target: string } | { notFound: true, unit: { courseId: string, unitId: string } | null }}
 */
export function resolveLegacyIn(catalog, routes, pathname) {
  const key = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  const target = routes.get(key)
  if (target) return { target }
  // Άγνωστο: ΔΕΝ ανακατευθύνεται σιωπηλά. Αν ανήκει σε γνωστή εβδομάδα, προτείνεται link προς αυτή.
  for (const [courseId, { course }] of Object.entries(catalog)) {
    for (const unit of course.units) {
      if (unitLegacyKey(unit) && key.startsWith(`${unit.route}/`)) return { notFound: true, unit: { courseId, unitId: unit.id } }
    }
  }
  return { notFound: true, unit: null }
}

const APP_CATALOG = Object.freeze(Object.fromEntries(contentCourseIds().map((id) => [id, getContentCourse(id)])))

/** legacy path (χωρίς τελικό /) → canonical URL. */
export const LEGACY_ROUTES = buildLegacyRoutes(APP_CATALOG)

/** Ρητή αντιστοίχιση ενός legacy κλειδιού σε canonical URL· σφάλμα αν δεν υπάρχει (λάθος προγραμματισμού). */
export function toCanonical(legacyPath) {
  const target = LEGACY_ROUTES.get(legacyPath)
  if (!target) throw new Error(`Δεν υπάρχει canonical αντιστοίχιση για ${legacyPath}`)
  return target
}

/** Επίλυση εισερχόμενου legacy URL της εφαρμογής (βλ. resolveLegacyIn). */
export const resolveLegacy = (pathname) => resolveLegacyIn(APP_CATALOG, LEGACY_ROUTES, pathname)
