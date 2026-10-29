/**
 * Μάθημα της συνεδρίας μελέτης (Φάση 5, I1): το μάθημα της διαδρομής → περιεχόμενο από το STUDY_CONTENT και αν η
 * πρόοδός του εξυπηρετείται από το ProgressService. Pure — χωρίς React· το useStudySession μόνο το καλεί.
 *
 * Καταστάσεις:
 *  - ready        περιεχόμενο + πρόοδος από το service· οι ενέργειες αποθηκεύονται όπως πριν
 *  - no-content   χωρίς περιεχόμενο μελέτης (π.χ. psd200)· κενό περιεχόμενο
 *  - no-progress  με περιεχόμενο, αλλά το service δεν κρατά πρόοδο για αυτό το μάθημα
 * Εκτός ready: κενή πρόοδος μόνο για ανάγνωση και ΚΑΜΙΑ ενέργεια (ούτε refresh, ούτε recorder, ούτε εγγραφή).
 * Ποτέ fallback σε περιεχόμενο ή πρόοδο άλλου μαθήματος.
 */
import { emptySnapshot } from '../progress/snapshot.js'
import { STUDY_CONTENT } from './content.js'

const EMPTY_CONTENT = Object.freeze({
  flashcards: Object.freeze([]),
  quizQuestions: Object.freeze([]),
  categories: Object.freeze([]),
  getCategoryLabel: (categoryId) => categoryId,
})

/**
 * @param {string} courseId          το μάθημα της διαδρομής
 * @param {string} progressCourseId  το μάθημα που εξυπηρετεί το ProgressService (`service.courseId`)
 * @param {object} [contentMap]      STUDY_CONTENT (παράμετρος μόνο για tests)
 */
export function studyCourse(courseId, progressCourseId, contentMap = STUDY_CONTENT) {
  const course = typeof courseId === 'string' && Object.hasOwn(contentMap, courseId) ? contentMap[courseId] : null
  if (!course) return Object.freeze({ courseId: courseId ?? null, status: 'no-content', canRecord: false, content: EMPTY_CONTENT })
  const status = courseId === progressCourseId ? 'ready' : 'no-progress'
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

/** Η πρόοδος που βλέπει η συνεδρία: του service για ready, αλλιώς σταθερή κενή πρόοδος του ίδιου μαθήματος. */
export function sessionProgress(state, course) {
  if (course.canRecord) return state.courses[course.courseId]
  if (!emptyByCourse.has(course.courseId)) emptyByCourse.set(course.courseId, readOnlyEmpty(course.courseId))
  return emptyByCourse.get(course.courseId)
}

/** Μήνυμα για τον χρήστη: μόνο όταν υπάρχει υλικό που μπορεί να μελετήσει αλλά η πρόοδός του δεν αποθηκεύεται. */
export function studyCourseNotice(course) {
  return course.status === 'no-progress' ? 'Η πρόοδος για αυτό το μάθημα δεν αποθηκεύεται ακόμα.' : null
}

/**
 * Οι ενέργειες της συνεδρίας, με την ίδια σειρά όπως πριν (Φάση 3): refresh → recorder (shadow) → service.
 * Εκτός ready → false χωρίς καμία κλήση.
 * @param {{ course: ReturnType<typeof studyCourse>, service: object,
 *   record: { flashcardSeen: Function, quizAnswer: Function, wrongBookClear: Function, wrongBookRemove: Function } }} deps
 */
export function createStudyActions({ course, service, record }) {
  const run = (recordFn, act) => {
    if (!course.canRecord) return false
    service.refresh()
    recordFn()
    return act()
  }
  return {
    markCardSeen: (cardId) => run(() => record.flashcardSeen({ cardId }), () => service.markCardSeen(cardId)),
    answer: ({ questionId, ok, wrong }) =>
      run(() => record.quizAnswer({ questionId, ok, wrong }), () => service.answerQuestion({ questionId, ok, wrong })),
    clearWrongBook: () => run(() => record.wrongBookClear(), () => service.clearWrongBook()),
    removeWrong: (uid) => run(() => record.wrongBookRemove({ uid }), () => service.removeWrong(uid)),
  }
}
