/**
 * Ακαδημαϊκή πλοήγηση (Phase 1C-C): course → units → topics, pure (χωρίς React/browser APIs).
 *
 * Πηγές αλήθειας (καμία αντιγραφή εδώ):
 *  - ταυτότητα μαθήματος (κωδικός, τίτλος): academic registry
 *  - units: content course.js · topics (topicId → unit + legacySlug): content topics.js
 *  - canonical URLs: paths.js
 * Τα legacy κλειδιά (/week/...) εκτίθενται ΜΟΝΟ ως `legacyKey`, για να βρει το υπάρχον περιεχόμενο
 * τα δεδομένα του (π.χ. τίτλους του lessonNav)· ποτέ ως ταυτότητα ή link.
 */
import { registry } from '../academic/data/index.js'
import { getContentCourse, getUnit } from './catalog.js'
import { LEGACY_TOOLS, legacyKeyForTopic } from './legacy.js'
import { coursePath, studyPath, topicPath, unitPath } from './paths.js'
import { unitScope } from './scope.js'

/**
 * Το μάθημα της αρχικής σελίδας (`/`) και των σελίδων χωρίς μάθημα (όροι, Not Found).
 * Η εφαρμογή είναι ακόμα «PSD115 Exam Prep»· όταν αποκτήσει γενική αρχική, αυτό φεύγει.
 */
export const DEFAULT_COURSE_ID = 'psd115'

/** Ταυτότητα μαθήματος από το registry (ή null αν δεν υπάρχει). */
export function courseIdentity(courseId) {
  const course = registry.courses.find((c) => c.id === courseId)
  if (!course) return null
  return { courseId: course.id, code: course.code, title: course.title, hasContent: Boolean(getContentCourse(courseId)) }
}

/** Το ενεργό μάθημα μιας επιλυμένης διαδρομής (resolveLocation)· αλλιώς το προεπιλεγμένο. */
export function activeCourseId(identity) {
  const id = identity?.courseId
  return id && courseIdentity(id) ? id : DEFAULT_COURSE_ID
}

/** Αρχική σελίδα ενός μαθήματος: `/` για το προεπιλεγμένο, αλλιώς το canonical `/:courseId`. */
export const courseHomePath = (courseId) => (courseId === DEFAULT_COURSE_ID ? '/' : coursePath(courseId))

/** Units ενός μαθήματος, ταξινομημένες κατά `order`. Κενό για μάθημα χωρίς περιεχόμενο. */
export function courseUnits(courseId) {
  const content = getContentCourse(courseId)
  if (!content) return []
  return [...content.course.units]
    .sort((a, b) => a.order - b.order)
    .map((u) => ({ courseId, unitId: u.id, order: u.order, label: u.label, title: u.title, path: unitPath(courseId, u.id) }))
}

/** Topics μιας unit, με τη σειρά του topics.js. */
export function unitTopics(courseId, unitId) {
  const content = getContentCourse(courseId)
  if (!content || !getUnit(courseId, unitId)) return []
  return content.topics
    .filter((t) => t.unit === unitId)
    .map((t) => ({
      courseId,
      unitId,
      topicId: t.id,
      legacySlug: t.legacySlug,
      legacyKey: legacyKeyForTopic(courseId, t),
      path: topicPath(courseId, t.id),
    }))
}

/**
 * Συνδέει εγγραφές παρουσίασης του περιεχομένου (π.χ. κάρτες θεμάτων) με τα canonical topics.
 * Η σειρά και η ταυτότητα έρχονται από τα topics· οι εγγραφές δίνουν μόνο κείμενο/εμφάνιση.
 * @template T
 * @param {string} courseId
 * @param {string} unitId
 * @param {T[]} items
 * @param {(item: T) => string} getSlug  legacy slug της εγγραφής
 * @returns {(T & { topicId: string, path: string })[]}
 */
export function withTopics(courseId, unitId, items, getSlug) {
  const bySlug = new Map(items.map((item) => [getSlug(item), item]))
  return unitTopics(courseId, unitId)
    .filter((t) => bySlug.has(t.legacySlug))
    .map((t) => ({ ...bySlug.get(t.legacySlug), topicId: t.topicId, path: t.path }))
}

/** Προηγούμενο/επόμενο topic μέσα στην ίδια unit. */
export function topicNeighbors(courseId, topicId) {
  const topic = getContentCourse(courseId)?.topics.find((t) => t.id === topicId)
  if (!topic) return { prev: null, next: null }
  const list = unitTopics(courseId, topic.unit)
  const i = list.findIndex((t) => t.topicId === topicId)
  return { prev: list[i - 1] ?? null, next: list[i + 1] ?? null }
}

/** Προηγούμενη/επόμενη unit του μαθήματος. */
export function unitNeighbors(courseId, unitId) {
  const list = courseUnits(courseId)
  const i = list.findIndex((u) => u.unitId === unitId)
  if (i < 0) return { prev: null, next: null }
  return { prev: list[i - 1] ?? null, next: list[i + 1] ?? null }
}

/** Εργαλεία μελέτης μιας unit (canonical /study URLs). */
export function unitTools(courseId, unitId) {
  if (!getUnit(courseId, unitId)) return []
  return LEGACY_TOOLS.map((tool) => ({ tool, path: studyPath(tool, unitScope(courseId, unitId)) }))
}
