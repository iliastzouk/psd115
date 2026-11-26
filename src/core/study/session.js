/**
 * Μάθημα της συνεδρίας μελέτης (Φάση 5, I1): το μάθημα της διαδρομής → περιεχόμενο από το STUDY_CONTENT και αν η
 * πρόοδός του εξυπηρετείται από το ProgressService. Pure — χωρίς React· το useStudySession μόνο το καλεί.
 * Φάση 6a: οι ενέργειες πηγαίνουν στο `service.forCourse(courseId)` (δεμένες στο μάθημα· χωρίς shadow recorder).
 *
 * Καταστάσεις:
 *  - ready        περιεχόμενο + πρόοδος από το service· οι ενέργειες αποθηκεύονται όπως πριν
 *  - no-content   χωρίς περιεχόμενο μελέτης (π.χ. psd200)· κενό περιεχόμενο
 *  - no-progress  με περιεχόμενο, αλλά το service δεν κρατά πρόοδο για αυτό το μάθημα
 * Εκτός ready: κενή πρόοδος μόνο για ανάγνωση και ΚΑΜΙΑ ενέργεια (ούτε refresh, ούτε recorder, ούτε εγγραφή).
 * Ποτέ fallback σε περιεχόμενο ή πρόοδο άλλου μαθήματος.
 */
import { emptySnapshot } from '../progress/snapshotShape.js'
import { STUDY_CONTENT } from './content.js'

const EMPTY_CONTENT = Object.freeze({
  flashcards: Object.freeze([]),
  quizQuestions: Object.freeze([]),
  categories: Object.freeze([]),
  getCategoryLabel: (categoryId) => categoryId,
})

/**
 * @param {string} courseId                                 το μάθημα της διαδρομής
 * @param {string | ((courseId: string) => boolean)} served  αν το ProgressService εξυπηρετεί το μάθημα (`service.supports`)
 * @param {object} [contentMap]                             STUDY_CONTENT (παράμετρος μόνο για tests)
 */
export function studyCourse(courseId, served, contentMap = STUDY_CONTENT) {
  const course = typeof courseId === 'string' && Object.hasOwn(contentMap, courseId) ? contentMap[courseId] : null
  if (!course) return Object.freeze({ courseId: courseId ?? null, status: 'no-content', canRecord: false, content: EMPTY_CONTENT })
  const status = (typeof served === 'function' ? served(courseId) : courseId === served) ? 'ready' : 'no-progress'
  return Object.freeze({
    courseId,
    status,
    canRecord: status === 'ready',
    content: Object.freeze({
      flashcards: course.flashcards,
      quizQuestions: course.quizQuestions,
      categories: course.categories,
      getCategoryLabel: course.getCategoryLabel,
    }),
  })
}

/** Κενή πρόοδος μόνο για ανάγνωση (βαθύ freeze: καμία σιωπηρή δημιουργία δεδομένων). */
function readOnlyEmpty(courseId) {
  const s = emptySnapshot(courseId)
  for (const k of ['byGroup', 'flashcardSeenIds', 'wrongBook', 'checklists']) Object.freeze(s[k])
  return Object.freeze(s)
}
const emptyByCourse = new Map()

/**
 * Η πρόοδος που βλέπει η συνεδρία: του service για ready, αλλιώς σταθερή κενή πρόοδος του ίδιου μαθήματος (και όταν το
 * service είναι degraded ή το μάθημα unavailable — Φάση 6a, J4).
 */
export function sessionProgress(state, course) {
  if (course.canRecord && state.courses[course.courseId]) return state.courses[course.courseId]
  if (!emptyByCourse.has(course.courseId)) emptyByCourse.set(course.courseId, readOnlyEmpty(course.courseId))
  return emptyByCourse.get(course.courseId)
}

/**
 * Μήνυμα για τον χρήστη όταν υπάρχει υλικό που μπορεί να μελετήσει αλλά η πρόοδός του δεν αποθηκεύεται: μάθημα χωρίς
 * υποστήριξη προόδου, ή (Φάση 6a, J4) μάθημα που η πρόοδός του δεν διαβάζεται με ασφάλεια (`state.unavailable`).
 */
export function studyCourseNotice(course, state) {
  if (course.status === 'no-progress') return 'Η πρόοδος για αυτό το μάθημα δεν αποθηκεύεται ακόμα.'
  if (course.status === 'ready' && state?.status === 'ready' && state.unavailable?.[course.courseId]) {
    return 'Η πρόοδος αυτού του μαθήματος δεν μπορεί να διαβαστεί με ασφάλεια· οι αλλαγές του δεν αποθηκεύονται. Τα υπόλοιπα μαθήματα αποθηκεύονται κανονικά.'
  }
  return null
}

/**
 * Οι ενέργειες της συνεδρίας → `service.forCourse(courseId)` (Φάση 6a). Το service κάνει μόνο του τη φρέσκια ανάγνωση
 * πριν από κάθε αλλαγή. Εκτός ready → false χωρίς καμία κλήση.
 * @param {{ course: ReturnType<typeof studyCourse>, service: { forCourse: (courseId: string) => object } }} deps
 */
export function createStudyActions({ course, service }) {
  const run = (act) => (course.canRecord ? act(service.forCourse(course.courseId)) : false)
  return {
    markCardSeen: (cardId) => run((a) => a.markCardSeen(cardId)),
    answer: ({ questionId, ok, wrong }) => run((a) => a.answerQuestion({ questionId, ok, wrong })),
    clearWrongBook: () => run((a) => a.clearWrongBook()),
    removeWrong: (uid) => run((a) => a.removeWrong(uid)),
  }
}
