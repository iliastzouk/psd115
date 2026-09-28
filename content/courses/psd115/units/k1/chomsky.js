/**
 * Εβδομάδα 1 — Noam Chomsky · γλώσσα & γνωστική επανάσταση
 * Mini-section · μετά τη Γνωστική Ψυχολογία στο υλικό.
 */

export const chomskyLesson = {
  title: 'Noam Chomsky',

  pptSlide: `Noam Chomsky
Κριτική στον συμπεριφορισμό · γλώσσα
Γνωστική επανάσταση · εσωτερικές νοητικές διεργασίες`.trim(),

  theory: `Ο Noam Chomsky άσκησε κριτική στον συμπεριφορισμό και υποστήριξε ότι η γλώσσα δεν μπορεί να εξηγηθεί μόνο μέσω ερεθισμάτων και αντιδράσεων.`.trim(),

  cognitiveRevolutionTitle: 'Γνωστική Επανάσταση',

  cognitiveRevolution: `Οι ιδέες του Chomsky συνέβαλαν στην ανάπτυξη της γνωστικής ψυχολογίας και στη γνωστική επανάσταση.`.trim(),

  languageTitle: 'Γλώσσα',

  language: `Ο Chomsky υποστήριξε ότι η γλώσσα σχετίζεται με εσωτερικές νοητικές διεργασίες.`.trim(),

  keyPoints: ['Noam Chomsky', 'Κριτική στον συμπεριφορισμό', 'Γλώσσα', 'Νοητικές διεργασίες', 'Γνωστική επανάσταση'],

  examTrapIntro: 'ΠΡΟΣΟΧΗ',

  examTrapBody: `Ο Chomsky διαφώνησε με την άποψη ότι η γλώσσα εξηγείται μόνο μέσω μάθησης και ενίσχυσης.`.trim(),

  memoryHackLines: ['Chomsky = γλώσσα', 'Κριτική στον behaviorism', 'Γνωστική επανάσταση'],

  progressChecklist: [
    'Ξέρω ποιος ήταν ο Chomsky',
    'Ξέρω γιατί άσκησε κριτική στον συμπεριφορισμό',
    'Ξέρω τη σχέση του με τη γλώσσα',
    'Ξέρω τη σχέση του με τη γνωστική επανάσταση',
  ],
}

export const chomskyMemoryHacks = chomskyLesson.memoryHackLines

export const chomskyChecklist = chomskyLesson.progressChecklist

export const chomskyMeta = {
  slug: 'chomsky',
  title: chomskyLesson.title,
  short: 'Γλώσσα, κριτική στον συμπεριφορισμό, γνωστική επανάσταση',
}

export const chomskyExamQuestions = [
  {
    id: 'exam-chomsky-1',
    question: 'Τι υποστήριζε ο Noam Chomsky;',
    idealAnswer: `Ο Chomsky υποστήριζε ότι η γλώσσα δεν μπορεί να εξηγηθεί μόνο μέσω ερεθισμάτων και αντιδράσεων και ότι σχετίζεται με εσωτερικές νοητικές διεργασίες.`,
  },
]

export const chomskyFlashcards = [
  {
    id: 'fc-chomsky-1',
    categoryId: 'chomsky',
    front: 'Σε τι άσκησε κριτική ο Chomsky;',
    back: 'Στον συμπεριφορισμό.',
  },
  {
    id: 'fc-chomsky-2',
    categoryId: 'chomsky',
    front: 'Με τι συνδέεται ο Chomsky;',
    back: 'Με τη γλώσσα και τη γνωστική ψυχολογία.',
  },
  {
    id: 'fc-chomsky-3',
    categoryId: 'chomsky',
    front: 'Τι υποστήριζε ο Chomsky για τη γλώσσα;',
    back: 'Ότι σχετίζεται με εσωτερικές νοητικές διεργασίες.',
  },
]

const chomskyTfQuestions = [
  {
    id: 'q-chomsky-tf-1',
    categoryId: 'chomsky',
    type: 'tf',
    question: 'Ο Chomsky υποστήριξε τον συμπεριφορισμό.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 1,
    explanation: 'Άσκησε κριτική στον συμπεριφορισμό.',
  },
  {
    id: 'q-chomsky-tf-2',
    categoryId: 'chomsky',
    type: 'tf',
    question: 'Ο Chomsky συνδέεται με τη γνωστική επανάσταση.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Οι ιδέες του συνέβαλαν στην ανάπτυξη της γνωστικής ψυχολογίας.',
  },
  {
    id: 'q-chomsky-tf-3',
    categoryId: 'chomsky',
    type: 'tf',
    question: 'Ο Chomsky μελέτησε τη γλώσσα.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Η γλώσσα αποτελεί βασικό αντικείμενο του έργου του.',
  },
]

const rawChomskyMcq = [
  {
    question: 'Σε ποια θεωρία άσκησε κριτική ο Chomsky;',
    options: ['Ψυχανάλυση', 'Συμπεριφορισμός', 'Gestalt', 'Ανθρωπιστική Ψυχολογία'],
    answer: 'Συμπεριφορισμός',
    explanation: 'Ο Chomsky διαφώνησε με την εξήγηση της γλώσσας μόνο μέσω μάθησης.',
  },
  {
    question: 'Με τι συνδέεται ο Chomsky;',
    options: ['Όνειρα', 'Γλώσσα', 'Ενίσχυση', 'Αντανακλαστικά'],
    answer: 'Γλώσσα',
    explanation: 'Ο Chomsky είναι γνωστός για τη μελέτη της γλώσσας.',
  },
]

function normalizeMcq(raw, i) {
  const correctIndex = raw.options.indexOf(raw.answer)
  return {
    id: `q-chomsky-mcq-${i + 1}`,
    categoryId: 'chomsky',
    type: 'mcq',
    question: raw.question,
    options: raw.options,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    explanation: raw.explanation,
  }
}

export const chomskyQuizQuestions = [...chomskyTfQuestions, ...rawChomskyMcq.map(normalizeMcq)]

export const chomskyLessonQuizIds = chomskyQuizQuestions.map((q) => q.id)
