/**
 * Όλες οι ερωτήσεις κουίζ Εβδομάδας 1 (για analytics / εξαγωγή / μελλοντικό API)
 */
import { definitionQuizQuestions } from '../week1/definitionPsychology.js'
import { philosophersQuizQuestions } from '../week1/philosophers.js'
import { wundtQuizQuestions } from '../week1/wundt.js'

export const week1QuizQuestions = [
  ...definitionQuizQuestions,
  ...philosophersQuizQuestions,
  ...wundtQuizQuestions,
]

export default week1QuizQuestions
