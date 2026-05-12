/**
 * PSD115 Exam Prep — καθολικό dataset
 * Εβδομάδα 1: data/week1/* · Εβδομάδα 2–3: data/week2|week3/*
 */
import { week2Flashcards, week2QuizQuestions } from './week2/index.js'
import { week3Flashcards, week3QuizQuestions } from './week3/index.js'
import { definitionFlashcards, definitionQuizQuestions } from './week1/definitionPsychology.js'
import { philosopherFlashcards, philosophersQuizQuestions } from './week1/philosophers.js'
import { wundtFlashcards, wundtQuizQuestions } from './week1/wundt.js'
import { functionalismFlashcards, functionalismQuizQuestions } from './week1/functionalism.js'
import { clinicalFlashcards, clinicalQuizQuestions } from './week1/clinicalPsychology.js'
import { psychoanalysisFlashcards, psychoanalysisQuizQuestions } from './week1/psychoanalysis.js'
import { humanisticFlashcards, humanisticQuizQuestions } from './week1/humanisticPsychology.js'
import { behaviorismFlashcards, behaviorismQuizQuestions } from './week1/behaviorism.js'
import { pavlovFlashcards, pavlovQuizQuestions } from './week1/pavlov.js'
import { littleAlbertFlashcards, littleAlbertQuizQuestions } from './week1/littleAlbert.js'
import { thorndikeFlashcards, thorndikeQuizQuestions } from './week1/thorndike.js'
import { skinnerFlashcards, skinnerQuizQuestions } from './week1/skinner.js'
import { cognitiveFlashcards, cognitiveQuizQuestions } from './week1/cognitive.js'
import { chomskyFlashcards, chomskyQuizQuestions } from './week1/chomsky.js'
import { neuroscienceFlashcards, neuroscienceQuizQuestions } from './week1/neuroscience.js'
import { gestaltFlashcards, gestaltQuizQuestions } from './week1/gestalt.js'
import { evolutionaryFlashcards, evolutionaryQuizQuestions } from './week1/evolutionary.js'
import { socialPsychologyFlashcards, socialPsychologyQuizQuestions } from './week1/socialPsychology.js'
import {
  educationalPsychologyFlashcards,
  educationalPsychologyQuizQuestions,
} from './week1/educationalPsychology.js'
import { otherBranchesFlashcards, otherBranchesQuizQuestions } from './week1/otherBranches.js'

export const WEEK1_CATEGORIES = [
  { id: 'definition', label: 'Ορισμός της Ψυχολογίας' },
  { id: 'history', label: 'Ιστορία της Ψυχολογίας' },
  { id: 'structuralism', label: 'Δομισμός (Structuralism)' },
  { id: 'functionalism', label: 'Λειτουργισμός (Functionalism)' },
  { id: 'clinical', label: 'Κλινική Ψυχολογία' },
  { id: 'psychoanalysis', label: 'Ψυχανάλυση' },
  { id: 'humanistic', label: 'Ανθρωπιστική Ψυχολογία' },
  { id: 'behaviorism', label: 'Συμπεριφορισμός' },
  { id: 'pavlov', label: 'Pavlov — Κλασική μάθηση' },
  { id: 'littleAlbert', label: 'Little Albert (1920)' },
  { id: 'thorndike', label: 'Thorndike — Νόμος αποτελέσματος' },
  { id: 'skinner', label: 'Skinner — Συντελεστική μάθηση' },
  { id: 'cognitive', label: 'Γνωστική Ψυχολογία' },
  { id: 'chomsky', label: 'Chomsky — Γλώσσα' },
  { id: 'neuroscience', label: 'Γνωστική νευροεπιστήμη' },
  { id: 'gestalt', label: 'Ψυχολογία Gestalt' },
  { id: 'evolutionary', label: 'Εξελικτική Ψυχολογία' },
  { id: 'socialPsychology', label: 'Κοινωνική Ψυχολογία' },
  { id: 'educationalPsychology', label: 'Εκπαιδευτική Ψυχολογία' },
  { id: 'otherBranches', label: 'Υπόλοιποι κλάδοι Ψυχολογίας' },
]

export const WEEK2_CATEGORIES = [
  { id: 'w2-overview', label: 'Εβδ.2 — Επισκόπηση μεθόδου' },
  { id: 'w2-empiricism', label: 'Εβδ.2 — Εμπειρισμός' },
  { id: 'w2-observation', label: 'Εβδ.2 — Παρατήρηση & μέτρηση' },
  { id: 'w2-observer-bias', label: 'Εβδ.2 — Μεροληψία παρατηρητή' },
  { id: 'w2-variables', label: 'Εβδ.2 — Μεταβλητές & συσχέτιση' },
  { id: 'w2-experiment', label: 'Εβδ.2 — Πειραματική μέθοδος' },
  { id: 'w2-sampling-stats', label: 'Εβδ.2 — Δειγματοληψία & στατιστική' },
  { id: 'w2-ethics', label: 'Εβδ.2 — Δεοντολογία' },
]

export const WEEK3_CATEGORIES = [
  { id: 'w3-overview', label: 'Εβδ.3 — Επισκόπηση / στόχοι' },
  { id: 'w3-neuron', label: 'Εβδ.3 — Νευρώνας' },
  { id: 'w3-signaling', label: 'Εβδ.3 — Σήμανση' },
  { id: 'w3-synapse', label: 'Εβδ.3 — Σύναψη & νευροδιαβιβαστές' },
  { id: 'w3-development', label: 'Εβδ.3 — Ανάπτυξη ΚΝΣ' },
  { id: 'w3-nervous-system', label: 'Εβδ.3 — Οργάνωση νευρικού' },
  { id: 'w3-brain-structure', label: 'Εβδ.3 — Δομή εγκεφάλου' },
  { id: 'w3-cortex', label: 'Εβδ.3 — Φλοιός & ευπλαστότητα' },
  { id: 'w3-lesions-eeg', label: 'Εβδ.3 — Βλάβες & ΗΕΓ' },
  { id: 'w3-imaging', label: 'Εβδ.3 — Απεικόνιση εγκεφάλου' },
]

/** Όλες οι κατηγορίες (φίλτρα / αναφορές) */
export const CATEGORIES = [...WEEK1_CATEGORIES, ...WEEK2_CATEGORIES, ...WEEK3_CATEGORIES]

/** Υπόλοιπες κάρτες Εβδ. 1 (μέχρι migration σε week1/*.js) */
const LEGACY_FLASHCARDS = []

const LEGACY_QUIZ_QUESTIONS = [
  {
    id: 'q-mix-1',
    categoryId: 'history',
    type: 'mcq',
    question: 'Ποιο έτος αναφέρεται για την ίδρυση της American Psychological Association (APA);',
    options: ['1799', '1892', '1926', '2001'],
    correctIndex: 1,
    explanation: 'Στο υλικό: το 1892 επτά ψυχολόγοι ίδρυσαν την APA.',
  },
  {
    id: 'q-mix-2',
    categoryId: 'history',
    type: 'tf',
    question:
      'Στην Ελλάδα, η ψυχολογία διδάχθηκε για πρώτη φορά ως μάθημα το 1926 στο Πανεπιστήμιο Αθηνών.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Στο υλικό αναφέρεται το 1926 (Αθήνα) και ίδρυση πρώτου ψυχολογικού εργαστηρίου την ίδια χρονιά.',
  },
]

export const flashcards = [
  ...definitionFlashcards,
  ...philosopherFlashcards,
  ...wundtFlashcards,
  ...functionalismFlashcards,
  ...clinicalFlashcards,
  ...psychoanalysisFlashcards,
  ...humanisticFlashcards,
  ...behaviorismFlashcards,
  ...pavlovFlashcards,
  ...littleAlbertFlashcards,
  ...thorndikeFlashcards,
  ...skinnerFlashcards,
  ...cognitiveFlashcards,
  ...chomskyFlashcards,
  ...neuroscienceFlashcards,
  ...gestaltFlashcards,
  ...evolutionaryFlashcards,
  ...socialPsychologyFlashcards,
  ...educationalPsychologyFlashcards,
  ...otherBranchesFlashcards,
  ...week2Flashcards,
  ...week3Flashcards,
  ...LEGACY_FLASHCARDS,
]

export const quizQuestions = [
  ...definitionQuizQuestions,
  ...philosophersQuizQuestions,
  ...wundtQuizQuestions,
  ...functionalismQuizQuestions,
  ...clinicalQuizQuestions,
  ...psychoanalysisQuizQuestions,
  ...humanisticQuizQuestions,
  ...behaviorismQuizQuestions,
  ...pavlovQuizQuestions,
  ...littleAlbertQuizQuestions,
  ...thorndikeQuizQuestions,
  ...skinnerQuizQuestions,
  ...cognitiveQuizQuestions,
  ...chomskyQuizQuestions,
  ...neuroscienceQuizQuestions,
  ...gestaltQuizQuestions,
  ...evolutionaryQuizQuestions,
  ...socialPsychologyQuizQuestions,
  ...educationalPsychologyQuizQuestions,
  ...otherBranchesQuizQuestions,
  ...week2QuizQuestions,
  ...week3QuizQuestions,
  ...LEGACY_QUIZ_QUESTIONS,
]

export function getCategoryLabel(categoryId) {
  return CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId
}
