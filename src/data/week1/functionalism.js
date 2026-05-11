/**
 * Εβδομάδα 1 — Λειτουργισμός / William James (PSD115 · PPT-first)
 */

export const functionalismLesson = {
  title: 'Λειτουργισμός — William James',

  intro: `Ο William James θεωρείται ο πατέρας της αμερικανικής ψυχολογίας και ήταν ο πρώτος καθηγητής ψυχολογίας στο Harvard.`.trim(),

  theoryTitle: 'Λειτουργισμός',

  theory: `Ο Λειτουργισμός εστίαζε στη λειτουργία των νοητικών διεργασιών και στο πώς αυτές βοηθούν τον άνθρωπο να προσαρμόζεται στο περιβάλλον.`.trim(),

  darwinInfluence: `Ο William James επηρεάστηκε από τη θεωρία της φυσικής επιλογής του Charles Darwin.`.trim(),

  adaptation: `Οι νοητικές λειτουργίες θεωρούνταν σημαντικές επειδή βοηθούν τον οργανισμό να επιβιώνει και να προσαρμόζεται.`.trim(),

  keyPoints: [
    'Πατέρας της αμερικανικής ψυχολογίας',
    'Πρώτος καθηγητής ψυχολογίας στο Harvard',
    'Έμφαση στη λειτουργία του νου',
    'Επιρροή από τον Δαρβίνο',
    'Προσαρμογή στο περιβάλλον',
  ],

  examTrapIntro: 'ΠΡΟΣΟΧΗ',

  examTrapBody: `Ο James ενδιαφερόταν για τη λειτουργία του νου και όχι για τη δομή της συνείδησης.`.trim(),

  comparisonWithWundt: [
    { approach: 'Wundt', focus: 'Δομή της συνείδησης' },
    { approach: 'James', focus: 'Λειτουργία των νοητικών διεργασιών' },
  ],

  memoryHackLines: [
    'James = λειτουργία',
    'Wundt = δομή',
    'Darwin → προσαρμογή',
    'Λειτουργία = τι χρησιμεύει',
  ],

  progressChecklist: [
    'Ξέρω ποιος ήταν ο William James',
    'Ξέρω τι είναι ο Λειτουργισμός',
    'Ξέρω την επιρροή του Δαρβίνου',
    'Ξέρω τη διαφορά Wundt και James',
    'Μπορώ να απαντήσω σε ερώτηση ανάπτυξης',
  ],
}

export const functionalismMemoryHacks = functionalismLesson.memoryHackLines

export const functionalismChecklist = functionalismLesson.progressChecklist

export const functionalismMeta = {
  slug: 'functionalism',
  title: functionalismLesson.title,
  short: 'Harvard, Darwin, λειτουργία νου, προσαρμογή',
  comingSoon: false,
}

export const functionalismTraps = [
  {
    wrong: 'Ο James μελετούσε τη δομή της συνείδησης.',
    correct: 'Ο James μελετούσε τη λειτουργία των νοητικών διεργασιών.',
  },
  {
    wrong: 'Ο Wundt και ο James είχαν την ίδια προσέγγιση.',
    correct: 'Ο Wundt εστίαζε στη δομή ενώ ο James στη λειτουργία.',
  },
]

export const functionalismExamQuestions = [
  {
    id: 'exam-func-1',
    question: 'Τι ήταν ο Λειτουργισμός;',
    idealAnswer: `Ο Λειτουργισμός ήταν ψυχολογική προσέγγιση που εστίαζε στη λειτουργία των νοητικών διεργασιών και στο πώς αυτές βοηθούν τον άνθρωπο να προσαρμόζεται στο περιβάλλον.`,
  },
  {
    id: 'exam-func-2',
    question: 'Σύγκρινε τον Δομισμό με τον Λειτουργισμό.',
    idealAnswer: `Ο Δομισμός του Wundt προσπαθούσε να αναλύσει τη δομή της συνείδησης, ενώ ο Λειτουργισμός του William James εστίαζε στη λειτουργία των νοητικών διεργασιών και στην προσαρμογή του ανθρώπου στο περιβάλλον.`,
  },
]

export const functionalismFlashcards = [
  {
    id: 'fc-func-1',
    categoryId: 'functionalism',
    front: 'Ποιος θεωρείται πατέρας της αμερικανικής ψυχολογίας;',
    back: 'Ο William James.',
  },
  {
    id: 'fc-func-2',
    categoryId: 'functionalism',
    front: 'Τι μελετούσε ο Λειτουργισμός;',
    back: 'Τη λειτουργία των νοητικών διεργασιών.',
  },
  {
    id: 'fc-func-3',
    categoryId: 'functionalism',
    front: 'Ποιος επηρέασε τον William James;',
    back: 'Ο Charles Darwin.',
  },
  {
    id: 'fc-func-4',
    categoryId: 'functionalism',
    front: 'Τι βοηθούν οι νοητικές λειτουργίες σύμφωνα με τον James;',
    back: 'Την προσαρμογή και επιβίωση του οργανισμού.',
  },
  {
    id: 'fc-func-5',
    categoryId: 'functionalism',
    front: 'Ποια είναι η βασική διαφορά Wundt και James;',
    back: 'Ο Wundt μελετούσε τη δομή ενώ ο James τη λειτουργία του νου.',
  },
]

const functionalismTfQuestions = [
  {
    id: 'q-func-tf-1',
    categoryId: 'functionalism',
    type: 'tf',
    question: 'Ο William James θεωρείται πατέρας της αμερικανικής ψυχολογίας.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Ήταν από τους σημαντικότερους εκπροσώπους της αμερικανικής ψυχολογίας.',
  },
  {
    id: 'q-func-tf-2',
    categoryId: 'functionalism',
    type: 'tf',
    question: 'Ο Λειτουργισμός εστίαζε στη δομή της συνείδησης.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 1,
    explanation: 'Αυτό ήταν ο Δομισμός του Wundt.',
  },
  {
    id: 'q-func-tf-3',
    categoryId: 'functionalism',
    type: 'tf',
    question: 'Ο James επηρεάστηκε από τη θεωρία του Δαρβίνου.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Η προσαρμογή ήταν βασική ιδέα.',
  },
]

const rawFunctionalismMcq = [
  {
    question: 'Σε τι έδινε έμφαση ο Λειτουργισμός;',
    options: ['Στη δομή της συνείδησης', 'Στη λειτουργία των νοητικών διεργασιών', 'Στο ασυνείδητο', 'Στη συμπεριφορά'],
    answer: 'Στη λειτουργία των νοητικών διεργασιών',
    explanation: 'Ο James ενδιαφερόταν για το πώς λειτουργεί ο νους.',
  },
  {
    question: 'Ποιος επηρέασε τον William James;',
    options: ['Freud', 'Pavlov', 'Darwin', 'Skinner'],
    answer: 'Darwin',
    explanation: 'Ο James επηρεάστηκε από τη φυσική επιλογή.',
  },
]

function normalizeMcq(raw, i) {
  const correctIndex = raw.options.indexOf(raw.answer)
  return {
    id: `q-func-mcq-${i + 1}`,
    categoryId: 'functionalism',
    type: 'mcq',
    question: raw.question,
    options: raw.options,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    explanation: raw.explanation,
  }
}

export const functionalismQuizQuestions = [...functionalismTfQuestions, ...rawFunctionalismMcq.map(normalizeMcq)]

export const functionalismLessonQuizIds = functionalismQuizQuestions.map((q) => q.id)
