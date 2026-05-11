/**
 * Όλες οι ερωτήσεις κουίζ Εβδομάδας 1 (για analytics / εξαγωγή / μελλοντικό API)
 */
import { definitionQuizQuestions } from '../week1/definitionPsychology.js'
import { philosophersQuizQuestions } from '../week1/philosophers.js'
import { wundtQuizQuestions } from '../week1/wundt.js'
import { functionalismQuizQuestions } from '../week1/functionalism.js'
import { clinicalQuizQuestions } from '../week1/clinicalPsychology.js'
import { psychoanalysisQuizQuestions } from '../week1/psychoanalysis.js'
import { humanisticQuizQuestions } from '../week1/humanisticPsychology.js'

export const week1QuizQuestions = [
  ...definitionQuizQuestions,
  ...philosophersQuizQuestions,
  ...wundtQuizQuestions,
  ...functionalismQuizQuestions,
  ...clinicalQuizQuestions,
  ...psychoanalysisQuizQuestions,
  ...humanisticQuizQuestions,
]

export default week1QuizQuestions
