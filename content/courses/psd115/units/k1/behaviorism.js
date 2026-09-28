/**
 * Εβδομάδα 1 — Συμπεριφορισμός / Behaviorism (κεντρική ενότητα)
 * Υποενότητες Pavlov, Watson, Skinner κ.λπ. ξεχωριστά αργότερα.
 */

export const behaviorismLesson = {
  title: 'Συμπεριφορισμός',

  intro: `Ο Συμπεριφορισμός είναι ψυχολογική προσέγγιση που δίνει έμφαση στη μελέτη της παρατηρήσιμης συμπεριφοράς.`.trim(),

  /** Κεντρική ενότητα συμπεριφορισμού */
  pptSlide: `Έμφαση στη συστηματική μελέτη της παρατηρήσιμης συμπεριφοράς.

Η μελέτη του νου είναι αδύνατη, καθώς δεν μπορούμε να την παρατηρήσουμε ευθέως.

John Watson — Αντανακλαστικό της λαβής ενός μωρού.

Επιρροές από τις θεωρίες του Δαρβίνου.

Ivan Pavlov — Πείραμα πέψης σκύλων.`.trim(),

  theory: `Οι συμπεριφοριστές πίστευαν ότι η ψυχολογία πρέπει να μελετά μόνο ό,τι μπορεί να παρατηρηθεί άμεσα.`.trim(),

  observableBehavior: `Οι εσωτερικές σκέψεις και τα συναισθήματα δεν μπορούν να παρατηρηθούν άμεσα και επομένως δεν αποτελούν αντικείμενο επιστημονικής μελέτης.`.trim(),

  stimulusResponseTitle: 'Ερέθισμα - Αντίδραση (Ε - Α)',

  stimulusResponse: `Ο Συμπεριφορισμός βασίζεται στη σχέση ανάμεσα σε ένα ερέθισμα και στην αντίδραση που ακολουθεί.`.trim(),

  representativesTitle: 'Κύριοι Εκπρόσωποι',

  representatives: ['John Watson', 'Ivan Pavlov', 'B.F. Skinner'],

  keyPoints: [
    'Παρατηρήσιμη συμπεριφορά',
    'Ερέθισμα - Αντίδραση',
    'Watson',
    'Pavlov',
    'Skinner',
    'Απόρριψη εσωτερικών διεργασιών',
  ],

  examTrapIntro: 'ΠΡΟΣΟΧΗ',

  examTrapBody: `Ο Συμπεριφορισμός δεν εστιάζει στις ασυνείδητες σκέψεις αλλά στην παρατηρήσιμη συμπεριφορά.`.trim(),

  comparison: [
    { approach: 'Freud', focus: 'Ασυνείδητες διεργασίες' },
    { approach: 'Συμπεριφορισμός', focus: 'Παρατηρήσιμη συμπεριφορά' },
  ],

  memoryHackLines: [
    'Behaviorism = behavior',
    'Ε - Α = Ερέθισμα - Αντίδραση',
    'Watson / Pavlov / Skinner',
    'Παρατηρήσιμη συμπεριφορά μόνο',
  ],

  progressChecklist: [
    'Ξέρω τι είναι ο Συμπεριφορισμός',
    'Ξέρω τι σημαίνει Ε - Α',
    'Ξέρω τους βασικούς εκπροσώπους',
    'Ξέρω γιατί απορρίπτει τις εσωτερικές διεργασίες',
    'Μπορώ να συγκρίνω Συμπεριφορισμό και Freud',
  ],
}

export const behaviorismMemoryHacks = behaviorismLesson.memoryHackLines

export const behaviorismChecklist = behaviorismLesson.progressChecklist

export const behaviorismMeta = {
  slug: 'behaviorism',
  title: behaviorismLesson.title,
  short: 'Παρατηρήσιμη συμπεριφορά, Ε-Α, Watson / Pavlov / Skinner',
  comingSoon: false,
}

export const behaviorismTraps = [
  {
    wrong: 'Ο Συμπεριφορισμός μελετά τις ασυνείδητες συγκρούσεις.',
    correct: 'Ο Συμπεριφορισμός μελετά την παρατηρήσιμη συμπεριφορά.',
  },
  {
    wrong: 'Οι συμπεριφοριστές θεωρούσαν επιστημονική τη μελέτη των σκέψεων.',
    correct: 'Οι εσωτερικές διεργασίες δεν μπορούν να παρατηρηθούν άμεσα.',
  },
]

export const behaviorismExamQuestions = [
  {
    id: 'exam-beh-1',
    question: 'Τι είναι ο Συμπεριφορισμός;',
    idealAnswer: `Ο Συμπεριφορισμός είναι ψυχολογική προσέγγιση που δίνει έμφαση στη μελέτη της παρατηρήσιμης συμπεριφοράς και στη σχέση ανάμεσα σε ερεθίσματα και αντιδράσεις.`,
  },
  {
    id: 'exam-beh-2',
    question: 'Τι σημαίνει το μοντέλο Ε - Α;',
    idealAnswer: `Το μοντέλο Ε - Α σημαίνει Ερέθισμα - Αντίδραση και περιγράφει τη σχέση ανάμεσα σε ένα ερέθισμα και στην αντίδραση που ακολουθεί.`,
  },
  {
    id: 'exam-beh-3',
    question: 'Σύγκρινε τον Freud με τον Συμπεριφορισμό.',
    idealAnswer: `Ο Freud έδινε έμφαση στις ασυνείδητες ψυχικές διεργασίες και στις συγκρούσεις του νου, ενώ ο Συμπεριφορισμός εστίαζε στην παρατηρήσιμη συμπεριφορά και στη σχέση ερεθίσματος - αντίδρασης.`,
  },
]

export const behaviorismFlashcards = [
  {
    id: 'fc-behave-1',
    categoryId: 'behaviorism',
    front: 'Τι μελετά ο Συμπεριφορισμός;',
    back: 'Την παρατηρήσιμη συμπεριφορά.',
  },
  {
    id: 'fc-behave-2',
    categoryId: 'behaviorism',
    front: 'Τι πίστευαν οι συμπεριφοριστές για τις σκέψεις και τα συναισθήματα;',
    back: 'Ότι δεν μπορούν να παρατηρηθούν άμεσα.',
  },
  {
    id: 'fc-behave-3',
    categoryId: 'behaviorism',
    front: 'Τι σημαίνει Ε - Α;',
    back: 'Ερέθισμα - Αντίδραση.',
  },
  {
    id: 'fc-behave-4',
    categoryId: 'behaviorism',
    front: 'Ποιοι είναι οι κύριοι εκπρόσωποι του Συμπεριφορισμού;',
    back: 'Watson, Pavlov και Skinner.',
  },
  {
    id: 'fc-behave-5',
    categoryId: 'behaviorism',
    front: 'Σε τι διαφέρει ο Συμπεριφορισμός από τον Freud;',
    back: 'Ο Συμπεριφορισμός εστιάζει στη συμπεριφορά ενώ ο Freud στο ασυνείδητο.',
  },
]

const behaviorismTfQuestions = [
  {
    id: 'q-behave-tf-1',
    categoryId: 'behaviorism',
    type: 'tf',
    question: 'Ο Συμπεριφορισμός μελετά την παρατηρήσιμη συμπεριφορά.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Η συμπεριφορά αποτελεί βασικό αντικείμενο μελέτης.',
  },
  {
    id: 'q-behave-tf-2',
    categoryId: 'behaviorism',
    type: 'tf',
    question: 'Οι συμπεριφοριστές έδιναν έμφαση στις ασυνείδητες συγκρούσεις.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 1,
    explanation: 'Αυτό αποτελεί προσέγγιση του Freud.',
  },
  {
    id: 'q-behave-tf-3',
    categoryId: 'behaviorism',
    type: 'tf',
    question: 'Το μοντέλο Ε - Α σημαίνει Ερέθισμα - Αντίδραση.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Βασική αρχή του Συμπεριφορισμού.',
  },
  {
    id: 'q-behave-tf-4',
    categoryId: 'behaviorism',
    type: 'tf',
    question: 'Ο Συμπεριφορισμός θεωρούσε επιστημονική τη μελέτη των εσωτερικών σκέψεων.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 1,
    explanation: 'Οι εσωτερικές διεργασίες δεν παρατηρούνται άμεσα.',
  },
]

const rawBehaveMcq = [
  {
    question: 'Σε τι δίνει έμφαση ο Συμπεριφορισμός;',
    options: ['Στο ασυνείδητο', 'Στην παρατηρήσιμη συμπεριφορά', 'Στα όνειρα', 'Στις φαντασιώσεις'],
    answer: 'Στην παρατηρήσιμη συμπεριφορά',
    explanation: 'Οι συμπεριφοριστές μελετούσαν τη συμπεριφορά που παρατηρείται.',
  },
  {
    question: 'Τι σημαίνει Ε - Α;',
    options: ['Εξήγηση - Ανάλυση', 'Ερέθισμα - Αντίδραση', 'Εμπειρία - Αντίληψη', 'Εκπαίδευση - Άσκηση'],
    answer: 'Ερέθισμα - Αντίδραση',
    explanation: 'Βασική σχέση στον Συμπεριφορισμό.',
  },
  {
    question: 'Ποιος ΔΕΝ ανήκει στους συμπεριφοριστές;',
    options: ['Watson', 'Pavlov', 'Skinner', 'Freud'],
    answer: 'Freud',
    explanation: 'Ο Freud ανήκει στην ψυχαναλυτική προσέγγιση.',
  },
]

function normalizeMcq(raw, i) {
  const correctIndex = raw.options.indexOf(raw.answer)
  return {
    id: `q-behave-mcq-${i + 1}`,
    categoryId: 'behaviorism',
    type: 'mcq',
    question: raw.question,
    options: raw.options,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    explanation: raw.explanation,
  }
}

export const behaviorismQuizQuestions = [...behaviorismTfQuestions, ...rawBehaveMcq.map(normalizeMcq)]

export const behaviorismLessonQuizIds = behaviorismQuizQuestions.map((q) => q.id)
