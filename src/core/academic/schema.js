/**
 * Schema και έλεγχος του academic registry (Phase 1A). Pure JS, χωρίς browser APIs.
 *
 * Σημασιολογία τιμών:
 *   UNKNOWN ('unknown') = η πληροφορία ΙΣΧΥΕΙ αλλά δεν έχει επιβεβαιωθεί.
 *   null                = ρητά «δεν εφαρμόζεται / δεν υπάρχει ακόμα» (επιβεβαιωμένο).
 * Ποτέ δεν μετατρέπουμε το unknown σε null, false, 0 ή κενό string.
 */
import { isCourseId } from './ids.js'

export const UNKNOWN = 'unknown'
export const isUnknown = (v) => v === UNKNOWN

export const COURSE_KINDS = ['required', 'elective', UNKNOWN]
/** Κατάσταση του μαθήματος στον κατάλογο (ΟΧΙ το αποτέλεσμα του χρήστη — αυτό είναι στην Enrollment). */
export const COURSE_STATUSES = ['active', 'retired', UNKNOWN]
export const ENROLLMENT_STATUSES = ['planned', 'in-progress', 'passed', 'failed', 'withdrawn', UNKNOWN]
export const EXAM_KINDS = ['final', 'midterm', 'resit', 'other']

/** YYYY + εποχή: S (spring), U (summer), F (fall). Η σειρά ορίζεται από τον πίνακα, όχι από το ID. */
const TERM_ID_RE = /^\d{4}[SUF]$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RANGE_RE = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/
/** Π.χ. `psd200@2026F` (courseId@termId). */
const ENROLLMENT_ID_RE = /^[a-z0-9][A-Za-z0-9@._-]*$/
const MAX_SEMESTERS = 16

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isText = (v) => typeof v === 'string' && v.trim() !== '' && v === v.trim()

export function isValidDate(v) {
  if (typeof v !== 'string' || !DATE_RE.test(v)) return false
  const [y, m, d] = v.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

function checkUnique(list, getKey, label, errors) {
  const seen = new Set()
  for (const x of list) {
    const k = getKey(x)
    if (seen.has(k)) errors.push(`${label}: διπλό «${k}»`)
    seen.add(k)
  }
}

export function validateProgram(p) {
  const errors = []
  if (!isObj(p)) return ['program: αναμενόταν αντικείμενο']
  for (const f of ['id', 'name', 'institution']) if (!isText(p[f])) errors.push(`program.${f}: υποχρεωτικό κείμενο`)
  if ('institutionId' in p && !isText(p.institutionId)) errors.push('program.institutionId: αναμενόταν κείμενο')
  const ts = p.totalSemesters
  if (!(isUnknown(ts) || (Number.isInteger(ts) && ts >= 1 && ts <= MAX_SEMESTERS))) {
    errors.push(`program.totalSemesters: ακέραιος 1–${MAX_SEMESTERS} ή "${UNKNOWN}"`)
  }
  return errors
}

export function validateTerms(terms) {
  const errors = []
  if (!Array.isArray(terms)) return ['terms: αναμενόταν πίνακας']
  terms.forEach((t, i) => {
    const w = `terms[${i}]${t?.id ? ` (${t.id})` : ''}`
    if (!isObj(t)) return errors.push(`${w}: αναμενόταν αντικείμενο`)
    if (typeof t.id !== 'string' || !TERM_ID_RE.test(t.id)) errors.push(`${w}.id: μορφή YYYY + S/U/F (π.χ. 2026F)`)
    if (!isText(t.label)) errors.push(`${w}.label: υποχρεωτικό`)
    for (const f of ['start', 'end']) {
      if (!(isUnknown(t[f]) || isValidDate(t[f]))) errors.push(`${w}.${f}: ημερομηνία YYYY-MM-DD ή "${UNKNOWN}"`)
    }
    if (isValidDate(t.start) && isValidDate(t.end) && t.start > t.end) errors.push(`${w}: start μετά το end`)
    if (typeof t.current !== 'boolean') errors.push(`${w}.current: true/false`)
  })
  checkUnique(terms.filter(isObj), (t) => t.id, 'terms.id', errors)
  const current = terms.filter((t) => isObj(t) && t.current === true)
  if (current.length > 1) errors.push(`terms: το πολύ ένα current term (βρέθηκαν ${current.map((t) => t.id).join(', ')})`)
  // Η σειρά του πίνακα είναι η ακαδημαϊκή σειρά· όπου οι ημερομηνίες είναι γνωστές, πρέπει να συμφωνούν.
  const dated = terms.filter((t) => isObj(t) && isValidDate(t.start))
  for (let i = 1; i < dated.length; i++) {
    if (dated[i].start < dated[i - 1].start) errors.push(`terms: το ${dated[i].id} είναι πριν το ${dated[i - 1].id} αλλά μετά στη σειρά`)
  }
  return errors
}

export function validateCourses(courses, { totalSemesters = UNKNOWN } = {}) {
  const errors = []
  if (!Array.isArray(courses)) return ['courses: αναμενόταν πίνακας']
  const maxSem = Number.isInteger(totalSemesters) ? totalSemesters : MAX_SEMESTERS
  courses.forEach((c, i) => {
    const w = `courses[${i}]${c?.id ? ` (${c.id})` : ''}`
    if (!isObj(c)) return errors.push(`${w}: αναμενόταν αντικείμενο`)
    if (!isCourseId(c.id)) errors.push(`${w}.id: lowercase αναγνωριστικό`)
    if (!isText(c.code)) errors.push(`${w}.code: υποχρεωτικό`)
    if ('alternateCodes' in c && (!Array.isArray(c.alternateCodes) || !c.alternateCodes.every(isText))) {
      errors.push(`${w}.alternateCodes: πίνακας κωδικών`)
    }
    if (!isText(c.title)) errors.push(`${w}.title: υποχρεωτικό`)
    if (!COURSE_KINDS.includes(c.kind)) errors.push(`${w}.kind: ${COURSE_KINDS.join(' | ')}`)
    if (!COURSE_STATUSES.includes(c.status)) errors.push(`${w}.status: ${COURSE_STATUSES.join(' | ')}`)
    const s = c.curriculumSemester
    if (s === null) {
      // null = «εξάμηνο δεν εφαρμόζεται», μόνο για ρητά επιλογής μάθημα.
      if (c.kind !== 'elective') errors.push(`${w}.curriculumSemester: null επιτρέπεται μόνο σε kind "elective"`)
    } else if (!(isUnknown(s) || (Number.isInteger(s) && s >= 1 && s <= maxSem))) {
      errors.push(`${w}.curriculumSemester: ακέραιος 1–${maxSem}, "${UNKNOWN}", ή null (μόνο elective)`)
    }
  })
  const objs = courses.filter(isObj)
  checkUnique(objs, (c) => c.id, 'courses.id', errors)
  checkUnique(objs.flatMap((c) => [c.code, ...(c.alternateCodes ?? [])]), (x) => x, 'courses.code', errors)
  return errors
}

function validateGrade(e, w, errors) {
  const g = e.grade
  const known = (typeof g === 'number' && Number.isFinite(g)) || (isText(g) && !isUnknown(g))
  switch (e.status) {
    case 'planned':
    case 'in-progress':
      // Ο βαθμός δεν έχει εκδοθεί ακόμα — γνωστό γεγονός.
      if (g !== null) errors.push(`${w}.grade: null όσο το μάθημα είναι ${e.status}`)
      break
    case 'passed':
    case 'failed':
      // Βαθμός υπάρχει· η τιμή μπορεί να είναι γνωστή ή unknown, ποτέ null.
      if (!(known || isUnknown(g))) errors.push(`${w}.grade: τιμή ή "${UNKNOWN}" για ${e.status}`)
      break
    case 'withdrawn':
      if (!(g === null || known || isUnknown(g))) errors.push(`${w}.grade: null, τιμή ή "${UNKNOWN}"`)
      break
    case UNKNOWN:
      // Χωρίς επιβεβαιωμένο status δεν ξέρουμε ούτε αν εκδόθηκε βαθμός.
      if (!isUnknown(g)) errors.push(`${w}.grade: "${UNKNOWN}" όταν το status είναι "${UNKNOWN}"`)
      break
  }
}

export function validateEnrollments(enrollments, { courses = [], terms = [] } = {}) {
  const errors = []
  if (!Array.isArray(enrollments)) return ['enrollments: αναμενόταν πίνακας']
  const courseById = new Map(courses.filter(isObj).map((c) => [c.id, c]))
  const termIds = new Set(terms.filter(isObj).map((t) => t.id))
  enrollments.forEach((e, i) => {
    const w = `enrollments[${i}]${e?.id ? ` (${e.id})` : ''}`
    if (!isObj(e)) return errors.push(`${w}: αναμενόταν αντικείμενο`)
    if (typeof e.id !== 'string' || !ENROLLMENT_ID_RE.test(e.id)) errors.push(`${w}.id: αναγνωριστικό (π.χ. psd200@2026F)`)
    const course = courseById.get(e.courseId)
    if (!course) errors.push(`${w}.courseId: ανύπαρκτο μάθημα «${e.courseId}»`)
    if (!(isUnknown(e.termId) || termIds.has(e.termId))) errors.push(`${w}.termId: ανύπαρκτο term «${e.termId}»`)
    if (!isUnknown(e.enrolledCode)) {
      const codes = course ? [course.code, ...(course.alternateCodes ?? [])] : []
      if (!codes.includes(e.enrolledCode)) errors.push(`${w}.enrolledCode: κωδικός του μαθήματος ή "${UNKNOWN}"`)
    }
    if (!(isUnknown(e.instructor) || isText(e.instructor))) errors.push(`${w}.instructor: όνομα ή "${UNKNOWN}"`)
    if (!ENROLLMENT_STATUSES.includes(e.status)) errors.push(`${w}.status: ${ENROLLMENT_STATUSES.join(' | ')}`)
    else validateGrade(e, w, errors)

    if (isUnknown(e.exams)) {
      /* δεν ξέρουμε ποιες εξετάσεις υπάρχουν */
    } else if (!Array.isArray(e.exams)) {
      errors.push(`${w}.exams: πίνακας ή "${UNKNOWN}"`)
    } else {
      e.exams.forEach((x, j) => {
        const xw = `${w}.exams[${j}]`
        if (!isObj(x)) return errors.push(`${xw}: αναμενόταν αντικείμενο`)
        if (!EXAM_KINDS.includes(x.kind)) errors.push(`${xw}.kind: ${EXAM_KINDS.join(' | ')}`)
        if (!(isUnknown(x.date) || isValidDate(x.date))) errors.push(`${xw}.date: YYYY-MM-DD ή "${UNKNOWN}"`)
        if (!(isUnknown(x.time) || (typeof x.time === 'string' && TIME_RANGE_RE.test(x.time)))) {
          errors.push(`${xw}.time: HH:MM-HH:MM ή "${UNKNOWN}"`)
        }
        if (!(isUnknown(x.scope) || (Array.isArray(x.scope) && x.scope.every(isText)))) {
          errors.push(`${xw}.scope: πίνακας (topic IDs) ή "${UNKNOWN}"`)
        }
      })
    }
  })
  checkUnique(enrollments.filter(isObj), (e) => e.id, 'enrollments.id', errors)
  return errors
}

/**
 * @param {{ program: object, terms: object[], courses: object[], enrollments: object[] }} reg
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateRegistry(reg) {
  if (!isObj(reg)) return { ok: false, errors: ['registry: αναμενόταν αντικείμενο'] }
  const errors = [
    ...validateProgram(reg.program),
    ...validateTerms(reg.terms),
    ...validateCourses(reg.courses, { totalSemesters: reg.program?.totalSemesters }),
    ...validateEnrollments(reg.enrollments, { courses: reg.courses ?? [], terms: reg.terms ?? [] }),
  ]
  return { ok: errors.length === 0, errors }
}
