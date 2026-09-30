/**
 * Scope = δομημένο αναγνωριστικό (όχι pathname) για εργαλεία μελέτης και πρόοδο:
 *
 *   psd115                 μάθημα
 *   unit:psd115/k2         unit μαθήματος
 *   topic:psd115/pavlov    θέμα μαθήματος
 *   term:2026F             ακαδημαϊκό term
 *
 * Εδώ γίνεται μόνο συντακτικός έλεγχος· η ύπαρξη ελέγχεται στο resolve.
 */
const COURSE = '[a-z][a-z0-9-]*'
const LOCAL = '[a-z0-9][a-z0-9-]*'
const COURSE_RE = new RegExp(`^(${COURSE})$`)
const UNIT_RE = new RegExp(`^unit:(${COURSE})/(${LOCAL})$`)
const TOPIC_RE = new RegExp(`^topic:(${COURSE})/(${LOCAL})$`)
const TERM_RE = /^term:(\d{4}[SUF])$/

/** @returns {null | { kind: 'course', courseId } | { kind: 'unit', courseId, unitId } | { kind: 'topic', courseId, topicId } | { kind: 'term', termId }} */
export function parseScope(value) {
  if (typeof value !== 'string') return null
  let m
  if ((m = value.match(COURSE_RE))) return { kind: 'course', courseId: m[1] }
  if ((m = value.match(UNIT_RE))) return { kind: 'unit', courseId: m[1], unitId: m[2] }
  if ((m = value.match(TOPIC_RE))) return { kind: 'topic', courseId: m[1], topicId: m[2] }
  if ((m = value.match(TERM_RE))) return { kind: 'term', termId: m[1] }
  return null
}

export function formatScope(scope) {
  switch (scope?.kind) {
    case 'course':
      return scope.courseId
    case 'unit':
      return `unit:${scope.courseId}/${scope.unitId}`
    case 'topic':
      return `topic:${scope.courseId}/${scope.topicId}`
    case 'term':
      return `term:${scope.termId}`
    default:
      throw new Error(`Άκυρο scope: ${JSON.stringify(scope)}`)
  }
}

export const courseScope = (courseId) => formatScope({ kind: 'course', courseId })
export const unitScope = (courseId, unitId) => formatScope({ kind: 'unit', courseId, unitId })
