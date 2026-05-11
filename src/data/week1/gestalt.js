/**
 * Εβδομάδα 1 — Ψυχολογία Gestalt
 * Συμπαγές · το όλο vs τα μέρη · αντίληψη.
 */

export const gestaltLesson = {
  title: 'Ψυχολογία Gestalt',

  pptSlide: `Gestalt
Το όλο ≠ άθροισμα μερών
Αντίληψη · οργάνωση εμπειρίας`.trim(),

  theory: `Η Ψυχολογία Gestalt υποστηρίζει ότι το όλο είναι διαφορετικό από το άθροισμα των μερών του.`.trim(),

  perceptionTitle: 'Αντίληψη',

  perception: `Η προσέγγιση Gestalt μελετά τον τρόπο με τον οποίο οι άνθρωποι οργανώνουν και αντιλαμβάνονται τα στοιχεία ως ενιαία σύνολα.`.trim(),

  organizationTitle: 'Οργάνωση της Εμπειρίας',

  organization: `Ο ανθρώπινος νους οργανώνει τα επιμέρους στοιχεία σε ολοκληρωμένες μορφές και πρότυπα.`.trim(),

  wholeTitle: 'Το Όλο',

  whole: `Σύμφωνα με την Gestalt, το όλο δεν είναι απλώς το άθροισμα των μερών αλλά κάτι διαφορετικό και οργανωμένο.`.trim(),

  keyPoints: ['Gestalt', 'Αντίληψη', 'Οργάνωση εμπειρίας', 'Το όλο', 'Μορφές και πρότυπα'],

  examTrapIntro: 'ΠΡΟΣΟΧΗ',

  examTrapBody: `Η Gestalt δίνει έμφαση στο οργανωμένο όλο και όχι στα μεμονωμένα στοιχεία.`.trim(),

  memoryHackLines: ['Gestalt = whole', 'Whole > parts', 'Αντίληψη και οργάνωση'],

  progressChecklist: [
    'Ξέρω τι είναι η Gestalt',
    'Ξέρω τη βασική αρχή του όλου',
    'Ξέρω τη σχέση Gestalt και αντίληψης',
    'Μπορώ να εξηγήσω την οργάνωση της εμπειρίας',
  ],
}

export const gestaltMemoryHacks = gestaltLesson.memoryHackLines

export const gestaltChecklist = gestaltLesson.progressChecklist

export const gestaltMeta = {
  slug: 'gestalt',
  title: gestaltLesson.title,
  short: 'Το όλο vs μέρη, αντίληψη, οργάνωση εμπειρίας — Wertheimer, Koffka, Köhler',
}

export const gestaltExamQuestions = [
  {
    id: 'exam-gestalt-1',
    question: 'Τι υποστηρίζει η Ψυχολογία Gestalt;',
    idealAnswer: `Η Ψυχολογία Gestalt υποστηρίζει ότι το όλο είναι διαφορετικό από το άθροισμα των μερών του και ότι ο ανθρώπινος νους οργανώνει τα στοιχεία σε ολοκληρωμένες μορφές.`,
  },
]

export const gestaltFlashcards = [
  {
    id: 'fc-gestalt-1',
    categoryId: 'gestalt',
    front: 'Τι υποστηρίζει η Ψυχολογία Gestalt;',
    back: 'Ότι το όλο είναι διαφορετικό από το άθροισμα των μερών του.',
  },
  {
    id: 'fc-gestalt-2',
    categoryId: 'gestalt',
    front: 'Με τι ασχολείται η Gestalt;',
    back: 'Με την αντίληψη και την οργάνωση της εμπειρίας.',
  },
  {
    id: 'fc-gestalt-3',
    categoryId: 'gestalt',
    front: 'Πώς οργανώνει ο νους τα στοιχεία σύμφωνα με την Gestalt;',
    back: 'Σε ολοκληρωμένες μορφές και πρότυπα.',
  },
]

const gestaltTfQuestions = [
  {
    id: 'q-gestalt-tf-1',
    categoryId: 'gestalt',
    type: 'tf',
    question: 'Η Gestalt δίνει έμφαση στο οργανωμένο όλο.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Το όλο αποτελεί βασική αρχή της Gestalt.',
  },
  {
    id: 'q-gestalt-tf-2',
    categoryId: 'gestalt',
    type: 'tf',
    question: 'Η Gestalt θεωρεί ότι το όλο είναι απλώς το άθροισμα των μερών.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 1,
    explanation: 'Το όλο θεωρείται κάτι διαφορετικό και οργανωμένο.',
  },
  {
    id: 'q-gestalt-tf-3',
    categoryId: 'gestalt',
    type: 'tf',
    question: 'Η Gestalt σχετίζεται με την αντίληψη.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Η αντίληψη αποτελεί βασικό αντικείμενο μελέτης.',
  },
]

const rawGestaltMcq = [
  {
    question: 'Ποια είναι η βασική αρχή της Gestalt;',
    options: [
      'Η συμπεριφορά διαμορφώνεται από ενισχυτές',
      'Το όλο είναι διαφορετικό από το άθροισμα των μερών',
      'Η γλώσσα είναι έμφυτη',
      'Η μάθηση γίνεται μέσω τιμωρίας',
    ],
    answer: 'Το όλο είναι διαφορετικό από το άθροισμα των μερών',
    explanation: 'Αποτελεί τη βασική αρχή της Gestalt.',
  },
  {
    question: 'Με τι σχετίζεται η Gestalt;',
    options: ['Αντίληψη', 'Ασυνείδητο', 'Ενίσχυση', 'Όνειρα'],
    answer: 'Αντίληψη',
    explanation: 'Η Gestalt μελετά την οργάνωση της αντίληψης.',
  },
]

function normalizeMcq(raw, i) {
  const correctIndex = raw.options.indexOf(raw.answer)
  return {
    id: `q-gestalt-mcq-${i + 1}`,
    categoryId: 'gestalt',
    type: 'mcq',
    question: raw.question,
    options: raw.options,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    explanation: raw.explanation,
  }
}

export const gestaltQuizQuestions = [...gestaltTfQuestions, ...rawGestaltMcq.map(normalizeMcq)]

export const gestaltLessonQuizIds = gestaltQuizQuestions.map((q) => q.id)
