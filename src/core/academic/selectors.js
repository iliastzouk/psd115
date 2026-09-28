/**
 * Pure selectors πάνω στα δεδομένα του registry. Δεν διαβάζουν React state, αποθηκευμένη
 * πρόοδο ή browser APIs, και δεν υπολογίζουν τίποτα από την τρέχουσα ημερομηνία.
 * Όλα παίρνουν ρητά το registry: { program, terms, courses, enrollments }.
 */
import { UNKNOWN } from './schema.js'

/** Το term με `current: true`, αλλιώς null (κανένα δηλωμένο — ΔΕΝ υπολογίζεται από το ημερολόγιο). */
export function getCurrentTerm(reg) {
  return reg.terms.find((t) => t.current === true) ?? null
}

/** Θέση του term στην ακαδημαϊκή σειρά (σειρά του πίνακα)· -1 για άγνωστο/ανύπαρκτο. */
export function termIndex(reg, termId) {
  return reg.terms.findIndex((t) => t.id === termId)
}

/** @param {{ curriculumSemester?: number | null | string, kind?: string }} [filter] */
export function getCourses(reg, filter = {}) {
  return reg.courses.filter(
    (c) =>
      (filter.curriculumSemester === undefined || c.curriculumSemester === filter.curriculumSemester) &&
      (filter.kind === undefined || c.kind === filter.kind),
  )
}

export function getCourseById(reg, id) {
  return reg.courses.find((c) => c.id === id) ?? null
}

/** Βρίσκει μάθημα από κωδικό, και από εναλλακτικούς κωδικούς (π.χ. PSD124 → psd125). */
export function getCourseByCode(reg, code) {
  return reg.courses.find((c) => c.code === code || (c.alternateCodes ?? []).includes(code)) ?? null
}

/** @param {{ termId?: string, status?: string, courseId?: string }} [filter] */
export function getEnrollments(reg, filter = {}) {
  return reg.enrollments.filter(
    (e) =>
      (filter.termId === undefined || e.termId === filter.termId) &&
      (filter.status === undefined || e.status === filter.status) &&
      (filter.courseId === undefined || e.courseId === filter.courseId),
  )
}

/** Εγγραφές ενός μαθήματος σε ακαδημαϊκή σειρά· όσες έχουν άγνωστο term στο τέλος. */
export function getEnrollmentsForCourse(reg, courseId) {
  const order = (e) => {
    const i = termIndex(reg, e.termId)
    return i < 0 ? Number.MAX_SAFE_INTEGER : i
  }
  return getEnrollments(reg, { courseId }).sort((a, b) => order(a) - order(b))
}

const OUTSTANDING_STATUSES = new Set(['planned', 'in-progress', 'failed'])

/**
 * Κατάσταση μαθήματος για τον χρήστη, ΜΟΝΟ από τις εγγραφές του:
 * - 'completed':   τουλάχιστον μία εγγραφή passed
 * - 'outstanding': καμία passed και τουλάχιστον μία planned / in-progress / failed
 * - 'unconfirmed': καμία από τα παραπάνω, τουλάχιστον μία εγγραφή με status unknown
 * - 'none':        καμία εγγραφή (ή μόνο withdrawn) — το ότι υπάρχει στον κατάλογο δεν σημαίνει ότι εκκρεμεί
 */
export function getCourseStanding(reg, courseId) {
  const list = getEnrollments(reg, { courseId })
  if (list.some((e) => e.status === 'passed')) return 'completed'
  if (list.some((e) => OUTSTANDING_STATUSES.has(e.status))) return 'outstanding'
  if (list.some((e) => e.status === UNKNOWN)) return 'unconfirmed'
  return 'none'
}

const byStanding = (standing) => (reg) => reg.courses.filter((c) => getCourseStanding(reg, c.id) === standing)

export const getCompletedCourses = byStanding('completed')
export const getOutstandingCourses = byStanding('outstanding')
export const getUnconfirmedCourses = byStanding('unconfirmed')
