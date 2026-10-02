/**
 * STUDY_CONTENT — adapter από `courseId + unitId` στα ΥΠΑΡΧΟΝΤΑ exports περιεχομένου (Phase 1D).
 *
 * Δεν είναι ταυτότητα: οι units ορίζονται στο course.js (ένα test ελέγχει ότι τα κλειδιά ταυτίζονται).
 * Εδώ μόνο δένονται τα ονόματα του περιεχομένου (WEEKn_CATEGORIES, getWeekNExamQuestions) σε unitId.
 * Κανένα topic, καμία διεύθυνση. Μάθημα χωρίς εγγραφή = χωρίς υλικό μελέτης (π.χ. psd200).
 */
import {
  WEEK1_CATEGORIES,
  WEEK2_CATEGORIES,
  WEEK3_CATEGORIES,
  WEEK4_CATEGORIES,
  flashcards,
  quizQuestions,
} from '../../../content/courses/psd115/questions.js'
import { getWeek1ExamQuestions } from '../../../content/courses/psd115/units/k1/index.js'
import { getWeek2ExamQuestions } from '../../../content/courses/psd115/units/k2/index.js'
import { getWeek3ExamQuestions } from '../../../content/courses/psd115/units/k3/index.js'
import { getWeek4ExamQuestions } from '../../../content/courses/psd115/units/k4/index.js'

export const STUDY_CONTENT = Object.freeze({
  psd115: Object.freeze({
    flashcards,
    quizQuestions,
    units: Object.freeze({
      k1: Object.freeze({ categories: WEEK1_CATEGORIES, examQuestions: getWeek1ExamQuestions }),
      k2: Object.freeze({ categories: WEEK2_CATEGORIES, examQuestions: getWeek2ExamQuestions }),
      k3: Object.freeze({ categories: WEEK3_CATEGORIES, examQuestions: getWeek3ExamQuestions }),
      k4: Object.freeze({ categories: WEEK4_CATEGORIES, examQuestions: getWeek4ExamQuestions }),
    }),
  }),
})
