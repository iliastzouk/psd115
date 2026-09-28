/**
 * Εβδομάδα 1 — Ψυχανάλυση / Sigmund Freud (PSD115)
 */

export const psychoanalysisLesson = {
  title: 'Ψυχανάλυση — Sigmund Freud',

  intro: `Ο Sigmund Freud ήταν ο ιδρυτής της ψυχαναλυτικής θεωρίας και της ψυχανάλυσης.`.trim(),

  traumaticExperiences: `Ο Freud εστίασε στις τραυματικές εμπειρίες από το παρελθόν και κυρίως από την παιδική ηλικία των ατόμων, τις οποίες είχαν απωθήσει από τη συνείδησή τους.`.trim(),

  unconsciousConflicts: `Η συμπεριφορά των ανθρώπων διαμορφώνεται από ασυνείδητες συγκρούσεις στον ανθρώπινο νου.`.trim(),

  psychoanalyticTheoryTitle: 'Ψυχαναλυτική Θεωρία',

  psychoanalyticTheory: `Η ψυχαναλυτική θεωρία δίνει έμφαση στις ασυνείδητες ψυχικές διεργασίες στη διαμόρφωση των συναισθημάτων, των σκέψεων και των συμπεριφορών.`.trim(),

  psychoanalysisTitle: 'Ψυχανάλυση',

  psychoanalysis: `Η ψυχανάλυση είναι θεραπευτική προσέγγιση με βάση την ψυχαναλυτική θεωρία.`.trim(),

  therapy: `Η θεραπεία πραγματοποιείται μέσω ανάκλησης πρώιμων εμπειριών και σύνδεσής τους με όνειρα και φαντασιώσεις.`.trim(),

  keyPoints: [
    'Ασυνείδητες συγκρούσεις',
    'Παιδικές εμπειρίες',
    'Απώθηση',
    'Όνειρα',
    'Φαντασιώσεις',
    'Ψυχανάλυση',
  ],

  keyTerms: [
    'Ασυνείδητο',
    'Ψυχαναλυτική θεωρία',
    'Ψυχανάλυση',
    'Όνειρα',
    'Φαντασιώσεις',
    'Απώθηση',
  ],

  examTrapIntro: 'ΠΡΟΣΟΧΗ',

  examTrapBody: `Ο Freud έδινε έμφαση στις ασυνείδητες ψυχικές διεργασίες και όχι μόνο στην παρατηρήσιμη συμπεριφορά.`.trim(),

  memoryHackLines: [
    'Freud = ασυνείδητο',
    'Όνειρα → κρυφές συγκρούσεις',
    'Παιδική ηλικία → προσωπικότητα',
    'Ψυχανάλυση = θεραπεία',
    'Απώθηση → έξω από τη συνείδηση',
  ],

  progressChecklist: [
    'Ξέρω ποιος ήταν ο Freud',
    'Ξέρω τι είναι το ασυνείδητο',
    'Ξέρω τι πίστευε για τις παιδικές εμπειρίες',
    'Ξέρω τι είναι η ψυχαναλυτική θεωρία',
    'Ξέρω τι είναι η ψυχανάλυση',
    'Ξέρω τον ρόλο των ονείρων και φαντασιώσεων',
    'Μπορώ να απαντήσω σε ανάπτυξη',
  ],
}

export const psychoanalysisMemoryHacks = psychoanalysisLesson.memoryHackLines

export const psychoanalysisChecklist = psychoanalysisLesson.progressChecklist

export const psychoanalysisMeta = {
  slug: 'psychoanalysis',
  title: psychoanalysisLesson.title,
  short: 'Ασυνείδητο, παιδικές εμπειρίες, όνειρα, θεραπεία',
  comingSoon: false,
}

export const psychoanalysisTraps = [
  {
    wrong: 'Ο Freud εστίαζε μόνο στην παρατηρήσιμη συμπεριφορά.',
    correct: 'Ο Freud έδινε έμφαση στις ασυνείδητες ψυχικές διεργασίες.',
  },
  {
    wrong: 'Η ψυχανάλυση είναι θεωρία μάθησης.',
    correct: 'Η ψυχανάλυση είναι θεραπευτική προσέγγιση.',
  },
  {
    wrong: 'Τα όνειρα δεν έχουν σημασία στην ψυχανάλυση.',
    correct: 'Τα όνειρα συνδέονται με ασυνείδητες συγκρούσεις και εμπειρίες.',
  },
]

export const psychoanalysisExamQuestions = [
  {
    id: 'exam-freud-1',
    question: 'Τι υποστήριζε ο Freud για τη συμπεριφορά των ανθρώπων;',
    idealAnswer: `Ο Freud υποστήριζε ότι η συμπεριφορά των ανθρώπων διαμορφώνεται από ασυνείδητες συγκρούσεις στον ανθρώπινο νου.`,
  },
  {
    id: 'exam-freud-2',
    question: 'Σε τι δίνει έμφαση η ψυχαναλυτική θεωρία;',
    idealAnswer: `Η ψυχαναλυτική θεωρία δίνει έμφαση στις ασυνείδητες ψυχικές διεργασίες στη διαμόρφωση των συναισθημάτων, των σκέψεων και των συμπεριφορών.`,
  },
  {
    id: 'exam-freud-3',
    question: 'Τι είναι η ψυχανάλυση;',
    idealAnswer: `Η ψυχανάλυση είναι θεραπευτική προσέγγιση με βάση την ψυχαναλυτική θεωρία. Η θεραπεία πραγματοποιείται μέσω ανάκλησης πρώιμων εμπειριών και σύνδεσής τους με όνειρα και φαντασιώσεις.`,
  },
  {
    id: 'exam-freud-4',
    question: 'Ποιον ρόλο παίζουν οι παιδικές εμπειρίες σύμφωνα με τον Freud;',
    idealAnswer: `Ο Freud πίστευε ότι οι τραυματικές εμπειρίες της παιδικής ηλικίας, οι οποίες έχουν απωθηθεί από τη συνείδηση, επηρεάζουν σημαντικά τη συμπεριφορά και την προσωπικότητα του ατόμου.`,
  },
]

export const psychoanalysisFlashcards = [
  {
    id: 'fc-freud-1',
    categoryId: 'psychoanalysis',
    front: 'Ποιος ήταν ο Sigmund Freud;',
    back: 'Ο ιδρυτής της ψυχαναλυτικής θεωρίας και της ψυχανάλυσης.',
  },
  {
    id: 'fc-freud-2',
    categoryId: 'psychoanalysis',
    front: 'Σε τι εστίασε ο Freud;',
    back: 'Στις τραυματικές εμπειρίες της παιδικής ηλικίας που είχαν απωθηθεί από τη συνείδηση.',
  },
  {
    id: 'fc-freud-3',
    categoryId: 'psychoanalysis',
    front: 'Τι διαμορφώνει τη συμπεριφορά σύμφωνα με τον Freud;',
    back: 'Ασυνείδητες συγκρούσεις στον ανθρώπινο νου.',
  },
  {
    id: 'fc-freud-4',
    categoryId: 'psychoanalysis',
    front: 'Σε τι δίνει έμφαση η ψυχαναλυτική θεωρία;',
    back: 'Στις ασυνείδητες ψυχικές διεργασίες.',
  },
  {
    id: 'fc-freud-5',
    categoryId: 'psychoanalysis',
    front: 'Τι είναι η ψυχανάλυση;',
    back: 'Θεραπευτική προσέγγιση με βάση την ψυχαναλυτική θεωρία.',
  },
  {
    id: 'fc-freud-6',
    categoryId: 'psychoanalysis',
    front: 'Πώς γίνεται η θεραπεία στην ψυχανάλυση;',
    back: 'Μέσω ανάκλησης πρώιμων εμπειριών και σύνδεσής τους με όνειρα και φαντασιώσεις.',
  },
  {
    id: 'fc-freud-7',
    categoryId: 'psychoanalysis',
    front: 'Τι πίστευε ο Freud για τα όνειρα;',
    back: 'Ότι σχετίζονται με ασυνείδητες συγκρούσεις και επιθυμίες.',
  },
]

const psychoanalysisTfQuestions = [
  {
    id: 'q-freud-tf-1',
    categoryId: 'psychoanalysis',
    type: 'tf',
    question: 'Ο Freud έδινε έμφαση στις ασυνείδητες ψυχικές διεργασίες.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Αυτό αποτελεί βασική αρχή της ψυχαναλυτικής θεωρίας.',
  },
  {
    id: 'q-freud-tf-2',
    categoryId: 'psychoanalysis',
    type: 'tf',
    question: 'Η συμπεριφορά σύμφωνα με τον Freud επηρεάζεται από ασυνείδητες συγκρούσεις.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Οι ασυνείδητες συγκρούσεις διαμορφώνουν τη συμπεριφορά.',
  },
  {
    id: 'q-freud-tf-3',
    categoryId: 'psychoanalysis',
    type: 'tf',
    question: 'Ο Freud θεωρούσε ασήμαντες τις παιδικές εμπειρίες.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 1,
    explanation: 'Πίστευε ότι οι παιδικές εμπειρίες επηρεάζουν έντονα την προσωπικότητα.',
  },
  {
    id: 'q-freud-tf-4',
    categoryId: 'psychoanalysis',
    type: 'tf',
    question: 'Η ψυχανάλυση είναι θεραπευτική προσέγγιση.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Βασίζεται στην ψυχαναλυτική θεωρία.',
  },
  {
    id: 'q-freud-tf-5',
    categoryId: 'psychoanalysis',
    type: 'tf',
    question: 'Η ψυχανάλυση βασίζεται μόνο στην παρατήρηση της συμπεριφοράς.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 1,
    explanation: 'Εστιάζει στις ασυνείδητες διεργασίες.',
  },
]

const rawPsychoMcq = [
  {
    question: 'Σε τι εστίασε ο Freud;',
    options: ['Στη φυσική επιλογή', 'Στις τραυματικές εμπειρίες και στο ασυνείδητο', 'Στη δομή της συνείδησης', 'Στην παρατηρήσιμη συμπεριφορά'],
    answer: 'Στις τραυματικές εμπειρίες και στο ασυνείδητο',
    explanation: 'Ο Freud πίστευε ότι οι τραυματικές εμπειρίες και οι ασυνείδητες συγκρούσεις επηρεάζουν τη συμπεριφορά.',
  },
  {
    question: 'Τι διαμορφώνει τη συμπεριφορά σύμφωνα με τον Freud;',
    options: ['Η τύχη', 'Οι εξωτερικές ανταμοιβές', 'Ασυνείδητες συγκρούσεις', 'Η βιολογία μόνο'],
    answer: 'Ασυνείδητες συγκρούσεις',
    explanation: 'Η συμπεριφορά επηρεάζεται από ασυνείδητες ψυχικές συγκρούσεις.',
  },
  {
    question: 'Σε τι δίνει έμφαση η ψυχαναλυτική θεωρία;',
    options: ['Στις αντανακλαστικές κινήσεις', 'Στις ασυνείδητες ψυχικές διεργασίες', 'Στη γλώσσα', 'Στη μνήμη'],
    answer: 'Στις ασυνείδητες ψυχικές διεργασίες',
    explanation: 'Οι ασυνείδητες διεργασίες αποτελούν κεντρικό σημείο της θεωρίας.',
  },
  {
    question: 'Τι είναι η ψυχανάλυση;',
    options: ['Μέθοδος παρατήρησης', 'Θεραπευτική προσέγγιση', 'Βιολογική θεωρία', 'Τεστ προσωπικότητας'],
    answer: 'Θεραπευτική προσέγγιση',
    explanation: 'Η ψυχανάλυση αποτελεί θεραπευτική προσέγγιση βασισμένη στην ψυχαναλυτική θεωρία.',
  },
  {
    question: 'Πώς πραγματοποιείται η θεραπεία στην ψυχανάλυση;',
    options: ['Με ενίσχυση', 'Με τιμωρία', 'Με ανάκληση πρώιμων εμπειριών, ονείρων και φαντασιώσεων', 'Με πειράματα'],
    answer: 'Με ανάκληση πρώιμων εμπειριών, ονείρων και φαντασιώσεων',
    explanation: 'Η ψυχανάλυση χρησιμοποιεί πρώιμες εμπειρίες, όνειρα και φαντασιώσεις.',
  },
]

function normalizeMcq(raw, i) {
  const correctIndex = raw.options.indexOf(raw.answer)
  return {
    id: `q-freud-mcq-${i + 1}`,
    categoryId: 'psychoanalysis',
    type: 'mcq',
    question: raw.question,
    options: raw.options,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    explanation: raw.explanation,
  }
}

export const psychoanalysisQuizQuestions = [...psychoanalysisTfQuestions, ...rawPsychoMcq.map(normalizeMcq)]

export const psychoanalysisLessonQuizIds = psychoanalysisQuizQuestions.map((q) => q.id)
