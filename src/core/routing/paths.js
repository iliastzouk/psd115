/**
 * Canonical URL builders (Phase 1C-B). Μόνο κατασκευή URLs — καμία ανάγνωση δεδομένων.
 *
 *   /                              home
 *   /:courseId                     course
 *   /:courseId/units/:unitId       unit
 *   /:courseId/topics/:topicId     topic (ΧΩΡΙΣ unit: η ταυτότητα του θέματος δεν εξαρτάται από την unit)
 *   /:courseId/docs/:docId         document
 *   /terms/:termId                 term
 *   /study/:tool?scope=...         εργαλεία μελέτης (έξω από την ιεραρχία του μαθήματος)
 *   /progress?scope=...            πρόοδος
 *
 * Τα URLs είναι αναπαράσταση των ταυτοτήτων (courseId, unitId, topicId, docId, termId) — ποτέ ταυτότητα.
 */
export const STUDY_TOOLS = Object.freeze(['quiz', 'flashcards', 'exam', 'review', 'today'])

/** Query value: κωδικοποίηση, αλλά τα ':' και '/' του scope μένουν αναγνώσιμα (έγκυρα σε query). */
const q = (v) => encodeURIComponent(v).replace(/%3A/gi, ':').replace(/%2F/gi, '/')

export const homePath = () => '/'
export const coursePath = (courseId) => `/${courseId}`
export const unitPath = (courseId, unitId) => `/${courseId}/units/${unitId}`
export const topicPath = (courseId, topicId) => `/${courseId}/topics/${topicId}`
export const documentPath = (courseId, docId) => `/${courseId}/docs/${docId}`
export const termPath = (termId) => `/terms/${termId}`

export function studyPath(tool, scope) {
  if (!STUDY_TOOLS.includes(tool)) throw new Error(`Άγνωστο εργαλείο μελέτης: ${tool}`)
  return `/study/${tool}?scope=${q(scope)}`
}

export const progressPath = (scope) => `/progress?scope=${q(scope)}`
