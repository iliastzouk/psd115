/**
 * Δεδομένα της αρχικής μαθημάτων (`/`, Φάση 6c): pure, χωρίς React, storage ή πρόοδο, και χωρίς κανένα μάθημα στον κώδικα.
 *
 * Εξάμηνα, μαθήματα και εγγραφές: από το registry. Διαθεσιμότητα: ΜΟΝΟ από τον κατάλογο περιεχομένου (`hasContent`).
 * `has-content` σημαίνει ότι έχει καταχωριστεί υλικό μελέτης — ΟΧΙ ότι είναι πλήρες ή έτοιμο για εξετάσεις.
 *
 * Σειρά ενοτήτων: τρέχον εξάμηνο (`current: true`) → επόμενα (αύξουσα σειρά) → προηγούμενα (νεότερο πρώτο) → μαθήματα
 * χωρίς εγγραφή. Χωρίς τρέχον εξάμηνο: όλα τα εξάμηνα, νεότερο πρώτο. Εξάμηνο χωρίς εγγραφές δεν εμφανίζεται.
 */
import { isValidDate, UNKNOWN } from '../academic/schema.js'
import { getCourseById, getCurrentTerm, getEnrollments } from '../academic/selectors.js'
import { coursePath } from './paths.js'

/** @typedef {'has-content' | 'no-content'} CourseContentStatus */

export const COURSE_STATUS_LABEL = Object.freeze({
  'has-content': 'Υπάρχει υλικό μελέτης',
  'no-content': 'Υλικό σε προετοιμασία',
})
export const COURSE_STATUS_NOTE = 'Η ένδειξη «Υπάρχει υλικό μελέτης» δείχνει ότι έχει καταχωριστεί υλικό· δεν σημαίνει ότι είναι πλήρες ή έτοιμο για εξετάσεις.'

function finalExamDate(exams) {
  if (!Array.isArray(exams)) return null
  const date = exams.find((x) => x?.kind === 'final')?.date
  return date && date !== UNKNOWN && isValidDate(date) ? date : null
}

function entry(reg, hasContent, e) {
  const course = getCourseById(reg, e.courseId)
  if (!course) return null
  return Object.freeze({
    courseId: course.id,
    code: course.code,
    title: course.title,
    status: hasContent(course.id) ? 'has-content' : 'no-content',
    path: coursePath(course.id),
    examDate: finalExamDate(e.exams),
  })
}

/**
 * @param {{ terms: object[], courses: object[], enrollments: object[] }} reg
 * @param {(courseId: string) => boolean} hasContent  από τον κατάλογο περιεχομένου
 * @returns {{ current: { termId: string, label: string } | null,
 *   sections: { termId: string | null, label: string | null, role: 'current' | 'upcoming' | 'past' | 'term' | 'unassigned',
 *               courses: { courseId, code, title, status: CourseContentStatus, path, examDate: string | null }[] }[] }}
 */
export function courseHub(reg, hasContent) {
  const current = getCurrentTerm(reg)
  const at = current ? reg.terms.indexOf(current) : -1
  const indexed = reg.terms.map((t, i) => ({ t, i }))
  const ordered =
    at < 0
      ? [...indexed].reverse()
      : [indexed[at], ...indexed.slice(at + 1), ...indexed.slice(0, at).reverse()]
  const role = (i) => (at < 0 ? 'term' : i === at ? 'current' : i > at ? 'upcoming' : 'past')

  const sections = ordered
    .map(({ t, i }) => {
      const courses = getEnrollments(reg, { termId: t.id })
        .map((e) => entry(reg, hasContent, e))
        .filter(Boolean)
      return Object.freeze({ termId: t.id, label: t.label, role: role(i), courses: Object.freeze(courses) })
    })
    .filter((s) => s.courses.length)

  const enrolled = new Set(reg.enrollments.map((e) => e.courseId))
  const unassigned = reg.courses.filter((c) => !enrolled.has(c.id)).map((c) => entry(reg, hasContent, { courseId: c.id, exams: UNKNOWN }))
  if (unassigned.length) sections.push(Object.freeze({ termId: null, label: null, role: 'unassigned', courses: Object.freeze(unassigned) }))

  return Object.freeze({
    current: current ? Object.freeze({ termId: current.id, label: current.label }) : null,
    sections: Object.freeze(sections),
  })
}
