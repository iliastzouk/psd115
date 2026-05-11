/**
 * PSD115 Exam Prep — καθολικό dataset
 * Εβδομάδα 1: data/week1/* · Λοιπά θέματα: legacy παρακάτω (μέχρι να μεταφερθούν σε week1)
 */
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

export const CATEGORIES = [
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
  { id: 'cognitive', label: 'Γνωστική Ψυχολογία' },
  { id: 'gestalt', label: 'Ψυχολογία Gestalt' },
  { id: 'evolutionary', label: 'Εξελικτική Ψυχολογία' },
]

/** Υπόλοιπες κάρτες Εβδ. 1 (μέχρι migration σε week1/*.js) */
const LEGACY_FLASHCARDS = [
  {
    id: 'fc-cog-1',
    categoryId: 'cognitive',
    front: 'Τι μελετά η Γνωστική Ψυχολογία;',
    back: 'Νοητικές διεργασίες όπως αντίληψη, προσοχή, μνήμη, σκέψη, γλώσσα και μάθηση — συχνά με πειραματικές μεθόδους.',
  },
  {
    id: 'fc-cog-2',
    categoryId: 'cognitive',
    front: 'Ποιος γλωσσολόγος αναφέρεται ως παράδειγμα γνωστικής προσέγγισης στη γλώσσα;',
    back: 'Noam Chomsky — η γλώσσα βασίζεται σε νοητικούς κανόνες (παραλληλισμός με κανόνες βήμα-βήμα).',
  },
  {
    id: 'fc-ges-1',
    categoryId: 'gestalt',
    front: 'Τρεις βασικοί εκπρόσωποι της σχολής Gestalt;',
    back: 'Max Wertheimer, Kurt Koffka και Wolfgang Köhler.',
  },
  {
    id: 'fc-ges-2',
    categoryId: 'gestalt',
    front: 'Ποια είναι η κεντρική ιδέα της Gestalt για τη συνειδητή εμπειρία;',
    back: 'Κατανοείται καλύτερα ως σύνολο και όχι ως απλό άθροισμα επιμέρους στοιχείων.',
  },
  {
    id: 'fc-evo-1',
    categoryId: 'evolutionary',
    front: 'Τι τονίζει η Εξελικτική Ψυχολογία;',
    back: 'Τη βιολογία και τη θεωρία εξέλιξης του Δαρβίνου — η συμπεριφορά ως αποτέλεσμα μακράς φυσικής επιλογής.',
  },
  {
    id: 'fc-evo-2',
    categoryId: 'evolutionary',
    front: 'Τι μελετά σε επίπεδο είδους;',
    back: 'Την αλλαγή της συμπεριφοράς στα έμβια όντα κατά τη διάρκεια της εξέλιξης του είδους.',
  },
]

const LEGACY_QUIZ_QUESTIONS = [
  {
    id: 'q-cog-1',
    categoryId: 'cognitive',
    type: 'mcq',
    question: 'Η γνωστική ψυχολογία περιλαμβάνει πειραματική διερεύνηση:',
    options: [
      'Μόνο κοινωνικών κανόνων',
      'Νοητικών διεργασιών όπως αντίληψη, προσοχή, μνήμη, σκέψη, γλώσσα, μάθηση',
      'Μόνο ορμονών',
      'Μόνο κληρονομικότητας χωρίς συμπεριφορά',
    ],
    correctIndex: 1,
    explanation: 'Η γνωστική ψυχολογία διερευνά νοητικές διεργασίες με πειραματικές μεθόδους.',
  },
  {
    id: 'q-cog-2',
    categoryId: 'cognitive',
    type: 'tf',
    question: 'Ο Chomsky χρησιμοποιείται ως παράδειγμα σύνδεσης γλώσσας με νοητικούς κανόνες.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Στο υλικό ο Chomsky συνδέεται με νοητικούς κανόνες γλώσσας (παραλληλισμός με υπολογιστικούς κανόνες).',
  },
  {
    id: 'q-ges-1',
    categoryId: 'gestalt',
    type: 'mcq',
    question: 'Η σχολή Gestalt υποστηρίζει ότι η συνειδητή εμπειρία:',
    options: [
      'Είναι απλώς άθροισμα ανεξάρτητων αισθήσεων χωρίς οργάνωση',
      'Κατανοείται καλύτερα ως σύνολο, όχι μόνο ως επιμέρους στοιχεία',
      'Δεν σχετίζεται με αντίληψη',
      'Βασίζεται μόνο στο ασυνείδητο',
    ],
    correctIndex: 1,
    explanation: 'Wertheimer, Koffka, Köhler: η εμπειρία ως σύνολο, όχι μόνο άθροισμα μερών.',
  },
  {
    id: 'q-ges-2',
    categoryId: 'gestalt',
    type: 'tf',
    question: 'Η Gestalt αποκαλείται και «μορφολογική σχολή» στο υλικό.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Στο υλικό εμφανίζεται ως «Μορφολογική σχολή / Σχολή Gestalt».',
  },
  {
    id: 'q-evo-1',
    categoryId: 'evolutionary',
    type: 'mcq',
    question: 'Η εξελικτική ψυχολογία συνδέει τη συμπεριφορά με:',
    options: [
      'Μόνο με τη μόδα της δεκαετίας',
      'Μακρά εξέλιξη μέσω φυσικής επιλογής και βιολογικές βάσεις',
      'Μόνο με τυχαία όνειρα',
      'Μόνο με το IQ ως μοναδικό κριτήριο',
    ],
    correctIndex: 1,
    explanation: 'Τονίζεται η βιολογία και η δαρβινική εξέλιξη μέσω φυσικής επιλογής.',
  },
  {
    id: 'q-evo-2',
    categoryId: 'evolutionary',
    type: 'tf',
    question: 'Η εξελικτική ψυχολογία μελετά αλλαγές συμπεριφοράς σε επίπεδο είδους κατά την εξέλιξη.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Στο υλικό αναφέρεται μελέτη αλλαγής συμπεριφοράς κατά την εξέλιξη του είδους.',
  },
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
  ...LEGACY_QUIZ_QUESTIONS,
]

export function getCategoryLabel(categoryId) {
  return CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId
}
