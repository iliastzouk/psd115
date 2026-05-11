/**
 * Εβδομάδα 1 — Γνωστική Ψυχολογία
 * Συμπαγές · PPT-style · ευθυγράμμιση με διδακτικό υλικό (βλ. study-materials).
 */

export const cognitiveLesson = {
  title: 'Γνωστική Ψυχολογία',

  pptSlide: `Γνωστική Ψυχολογία
Πειραματική διερεύνηση νοητικών διεργασιών
Γνωστική επιστήμη · μοντέλα σκέψης`.trim(),

  theory: `Η Γνωστική Ψυχολογία ασχολείται με την πειραματική διερεύνηση των νοητικών διεργασιών.`.trim(),

  cognitiveScienceTitle: 'Γνωστική Επιστήμη',

  cognitiveScience: `Η γνωστική επιστήμη είναι η διερεύνηση της γνώσης, της οργάνωσης και της ανάπτυξής της, των επιμέρους στοιχείων και της χρήσης της.`.trim(),

  mentalProcessesTitle: 'Νοητικές Διεργασίες',

  mentalProcesses: `Η Γνωστική Ψυχολογία μελετά τις νοητικές διεργασίες της αντίληψης, προσοχής, μνήμης, σκέψης, γλώσσας και μάθησης.`.trim(),

  modelsTitle: 'Μοντέλα',

  models: `Η γνωστική προσέγγιση εξελίχθηκε μέσω δημιουργίας μοντέλων που προσομοιάζουν την ανθρώπινη σκέψη και μάθηση.`.trim(),

  keyPoints: ['Γνωστική Ψυχολογία', 'Νοητικές διεργασίες', 'Αντίληψη', 'Προσοχή', 'Μνήμη', 'Σκέψη', 'Γλώσσα', 'Μάθηση'],

  examTrapIntro: 'ΠΡΟΣΟΧΗ',

  examTrapBody: `Η Γνωστική Ψυχολογία εστιάζει στις νοητικές διεργασίες — όχι μόνο στην παρατηρήσιμη συμπεριφορά χωρίς υπόθεση νοητικών μηχανισμών (συμπεριφορισμός).`.trim(),

  memoryHackLines: ['Γνωστική = σκέψη', 'Μνήμη / γλώσσα / μάθηση', 'Νοητικές διεργασίες', 'Cognition = thinking'],

  progressChecklist: [
    'Ξέρω τι μελετά η Γνωστική Ψυχολογία',
    'Ξέρω τι είναι η γνωστική επιστήμη',
    'Ξέρω τις βασικές νοητικές διεργασίες',
    'Ξέρω ότι η γνωστική προσέγγιση μελετά τη σκέψη και τη μάθηση',
  ],
}

export const cognitiveMemoryHacks = cognitiveLesson.memoryHackLines

export const cognitiveChecklist = cognitiveLesson.progressChecklist

export const cognitiveMeta = {
  slug: 'cognitive',
  title: cognitiveLesson.title,
  short: 'Νοητικές διεργασίες, γνωστική επιστήμη, μοντέλα σκέψης και μάθησης',
}

export const cognitiveExamQuestions = [
  {
    id: 'exam-cognitive-1',
    question: 'Τι μελετά η Γνωστική Ψυχολογία;',
    idealAnswer: `Η Γνωστική Ψυχολογία μελετά τις νοητικές διεργασίες όπως η αντίληψη, η προσοχή, η μνήμη, η σκέψη, η γλώσσα και η μάθηση.`,
  },
  {
    id: 'exam-cognitive-2',
    question: 'Τι είναι η γνωστική επιστήμη;',
    idealAnswer: `Η γνωστική επιστήμη είναι η διερεύνηση της γνώσης, της οργάνωσης και της ανάπτυξής της, των επιμέρους στοιχείων και της χρήσης της.`,
  },
]

export const cognitiveFlashcards = [
  {
    id: 'fc-cognitive-1',
    categoryId: 'cognitive',
    front: 'Τι μελετά η Γνωστική Ψυχολογία;',
    back: 'Τις νοητικές διεργασίες.',
  },
  {
    id: 'fc-cognitive-2',
    categoryId: 'cognitive',
    front: 'Ποιες νοητικές διεργασίες μελετά η Γνωστική Ψυχολογία;',
    back: 'Αντίληψη, προσοχή, μνήμη, σκέψη, γλώσσα και μάθηση.',
  },
  {
    id: 'fc-cognitive-3',
    categoryId: 'cognitive',
    front: 'Τι είναι η γνωστική επιστήμη;',
    back: 'Η διερεύνηση της γνώσης, της οργάνωσης, της ανάπτυξης και της χρήσης της.',
  },
  {
    id: 'fc-cognitive-4',
    categoryId: 'cognitive',
    front: 'Πώς εξελίχθηκε η γνωστική προσέγγιση;',
    back: 'Μέσω δημιουργίας μοντέλων που προσομοιάζουν την ανθρώπινη σκέψη και μάθηση.',
  },
]

const cognitiveTfQuestions = [
  {
    id: 'q-cognitive-tf-1',
    categoryId: 'cognitive',
    type: 'tf',
    question: 'Η Γνωστική Ψυχολογία μελετά τις νοητικές διεργασίες.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Αυτό αποτελεί βασικό αντικείμενο της γνωστικής προσέγγισης.',
  },
  {
    id: 'q-cognitive-tf-2',
    categoryId: 'cognitive',
    type: 'tf',
    question: 'Η Γνωστική Ψυχολογία μελετά μόνο την παρατηρήσιμη συμπεριφορά.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 1,
    explanation: 'Αυτό αποτελεί θέση του συμπεριφορισμού.',
  },
  {
    id: 'q-cognitive-tf-3',
    categoryId: 'cognitive',
    type: 'tf',
    question: 'Η μνήμη αποτελεί αντικείμενο μελέτης της Γνωστικής Ψυχολογίας.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Η μνήμη είναι βασική νοητική διεργασία.',
  },
  {
    id: 'q-cognitive-tf-4',
    categoryId: 'cognitive',
    type: 'tf',
    question: 'Η Γνωστική Ψυχολογία ασχολείται με τη γλώσσα.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Η γλώσσα αποτελεί βασικό αντικείμενο μελέτης.',
  },
]

const rawCognitiveMcq = [
  {
    question: 'Τι μελετά η Γνωστική Ψυχολογία;',
    options: ['Το ασυνείδητο', 'Τις νοητικές διεργασίες', 'Μόνο τη συμπεριφορά', 'Τα αντανακλαστικά'],
    answer: 'Τις νοητικές διεργασίες',
    explanation: 'Η γνωστική προσέγγιση εστιάζει στις νοητικές διεργασίες.',
  },
  {
    question: 'Ποιο από τα παρακάτω αποτελεί νοητική διεργασία;',
    options: ['Μνήμη', 'Πέψη', 'Αναπνοή', 'Κυκλοφορία αίματος'],
    answer: 'Μνήμη',
    explanation: 'Η μνήμη αποτελεί βασική νοητική διεργασία.',
  },
  {
    question: 'Με τι σχετίζεται η γνωστική επιστήμη;',
    options: ['Με τη γνώση', 'Με τα αντανακλαστικά', 'Με τα όνειρα', 'Με τις φοβίες'],
    answer: 'Με τη γνώση',
    explanation: 'Η γνωστική επιστήμη διερευνά τη γνώση και τη χρήση της.',
  },
]

function normalizeMcq(raw, i) {
  const correctIndex = raw.options.indexOf(raw.answer)
  return {
    id: `q-cognitive-mcq-${i + 1}`,
    categoryId: 'cognitive',
    type: 'mcq',
    question: raw.question,
    options: raw.options,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    explanation: raw.explanation,
  }
}

export const cognitiveQuizQuestions = [...cognitiveTfQuestions, ...rawCognitiveMcq.map(normalizeMcq)]

export const cognitiveLessonQuizIds = cognitiveQuizQuestions.map((q) => q.id)
