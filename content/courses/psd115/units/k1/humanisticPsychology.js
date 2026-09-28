/**
 * Εβδομάδα 1 — Ανθρωπιστική Ψυχολογία (PSD115)
 */

export const humanisticLesson = {
  title: 'Ανθρωπιστική Ψυχολογία',

  intro: `Η Ανθρωπιστική Ψυχολογία αναπτύχθηκε ως αντίδραση στον ψυχαναλυτισμό και στον συμπεριφορισμό.`.trim(),

  /** Κύριες διατυπώσεις της ενότητας */
  pptSlide: `Έμφαση στο θετικό δυναμικό των ανθρώπων.

Εστίαση στις υψηλότερες φιλοδοξίες των ατόμων για τον εαυτό τους.

Abraham Maslow & Carl Rogers.

Έμφυτη ανάγκη για ανάπτυξη και αξιοποίηση των δυνατοτήτων τους.

Πελάτες αντί Ασθενείς.`.trim(),

  representativesTitle: 'Κύριοι Εκπρόσωποι',

  representatives: ['Abraham Maslow', 'Carl Rogers'],

  theory: `Η Ανθρωπιστική Ψυχολογία δίνει έμφαση στη θετική πλευρά της ανθρώπινης φύσης, στην προσωπική ανάπτυξη και στην αυτοπραγμάτωση.`.trim(),

  selfActualizationTitle: 'Αυτοπραγμάτωση',

  selfActualization: `Η αυτοπραγμάτωση αναφέρεται στην ανάγκη του ανθρώπου να αναπτύξει πλήρως τις δυνατότητές του.`.trim(),

  positiveNature: `Οι ανθρωπιστές ψυχολόγοι πίστευαν ότι οι άνθρωποι έχουν θετικό δυναμικό και δυνατότητα προσωπικής εξέλιξης.`.trim(),

  therapy: `Στην ανθρωπιστική προσέγγιση οι θεραπευόμενοι αποκαλούνται «clients» (πελάτες) και όχι «patients» (ασθενείς).`.trim(),

  keyPoints: [
    'Θετική ανθρώπινη φύση',
    'Αυτοπραγμάτωση',
    'Προσωπική ανάπτυξη',
    'Maslow',
    'Rogers',
    'Clients όχι patients',
  ],

  comparison: [
    { approach: 'Freud', focus: 'Ασυνείδητες συγκρούσεις' },
    { approach: 'Συμπεριφορισμός', focus: 'Παρατηρήσιμη συμπεριφορά' },
    { approach: 'Ανθρωπιστική Ψυχολογία', focus: 'Θετική ανάπτυξη και δυνατότητες' },
  ],

  examTrapIntro: 'ΠΡΟΣΟΧΗ',

  examTrapBody: `Η Ανθρωπιστική Ψυχολογία δεν εστιάζει στις ψυχικές διαταραχές αλλά στη θετική ανάπτυξη του ανθρώπου.`.trim(),

  memoryHackLines: [
    'Maslow = αυτοπραγμάτωση',
    'Rogers = clients',
    'Ανθρωπιστική = θετική ανάπτυξη',
    'Freud → προβλήματα / Humanistic → δυνατότητες',
  ],

  progressChecklist: [
    'Ξέρω ποιοι ήταν οι Maslow και Rogers',
    'Ξέρω τι είναι η αυτοπραγμάτωση',
    'Ξέρω τι υποστηρίζει η Ανθρωπιστική Ψυχολογία',
    'Ξέρω γιατί χρησιμοποιείται ο όρος clients',
    'Μπορώ να συγκρίνω Freud και Ανθρωπιστική Ψυχολογία',
  ],
}

export const humanisticMemoryHacks = humanisticLesson.memoryHackLines

export const humanisticChecklist = humanisticLesson.progressChecklist

export const humanisticMeta = {
  slug: 'humanistic',
  title: humanisticLesson.title,
  short: 'Maslow, Rogers, αυτοπραγμάτωση, clients',
  comingSoon: false,
}

export const humanisticTraps = [
  {
    wrong: 'Η Ανθρωπιστική Ψυχολογία εστιάζει στις ασυνείδητες συγκρούσεις.',
    correct: 'Η Ανθρωπιστική Ψυχολογία εστιάζει στη θετική ανάπτυξη του ανθρώπου.',
  },
  {
    wrong: 'Οι θεραπευόμενοι λέγονται patients.',
    correct: 'Οι θεραπευόμενοι λέγονται clients.',
  },
]

export const humanisticExamQuestions = [
  {
    id: 'exam-hum-1',
    question: 'Τι υποστηρίζει η Ανθρωπιστική Ψυχολογία;',
    idealAnswer: `Η Ανθρωπιστική Ψυχολογία δίνει έμφαση στη θετική πλευρά της ανθρώπινης φύσης, στην προσωπική ανάπτυξη και στην αυτοπραγμάτωση.`,
  },
  {
    id: 'exam-hum-2',
    question: 'Τι είναι η αυτοπραγμάτωση σύμφωνα με τον Maslow;',
    idealAnswer: `Η αυτοπραγμάτωση είναι η ανάγκη του ανθρώπου να αναπτύξει πλήρως τις δυνατότητές του.`,
  },
  {
    id: 'exam-hum-3',
    question: 'Σύγκρινε τον Freud με την Ανθρωπιστική Ψυχολογία.',
    idealAnswer: `Ο Freud έδινε έμφαση στις ασυνείδητες συγκρούσεις και στις τραυματικές εμπειρίες, ενώ η Ανθρωπιστική Ψυχολογία επικεντρώνεται στη θετική ανθρώπινη φύση, στην προσωπική ανάπτυξη και στην αυτοπραγμάτωση.`,
  },
]

export const humanisticFlashcards = [
  {
    id: 'fc-human-1',
    categoryId: 'humanistic',
    front: 'Ποιοι είναι οι κύριοι εκπρόσωποι της Ανθρωπιστικής Ψυχολογίας;',
    back: 'Ο Abraham Maslow και ο Carl Rogers.',
  },
  {
    id: 'fc-human-2',
    categoryId: 'humanistic',
    front: 'Σε τι δίνει έμφαση η Ανθρωπιστική Ψυχολογία;',
    back: 'Στη θετική ανθρώπινη φύση και στην προσωπική ανάπτυξη.',
  },
  {
    id: 'fc-human-3',
    categoryId: 'humanistic',
    front: 'Τι είναι η αυτοπραγμάτωση;',
    back: 'Η ανάγκη του ανθρώπου να αναπτύξει πλήρως τις δυνατότητές του.',
  },
  {
    id: 'fc-human-4',
    categoryId: 'humanistic',
    front: 'Πώς αποκαλούνται οι θεραπευόμενοι στην ανθρωπιστική προσέγγιση;',
    back: 'Clients (πελάτες).',
  },
  {
    id: 'fc-human-5',
    categoryId: 'humanistic',
    front: 'Ποια είναι η βασική διαφορά Freud και Ανθρωπιστικής Ψυχολογίας;',
    back: 'Ο Freud εστίαζε στις ασυνείδητες συγκρούσεις ενώ η Ανθρωπιστική Ψυχολογία στη θετική ανάπτυξη.',
  },
]

const humanisticTfQuestions = [
  {
    id: 'q-human-tf-1',
    categoryId: 'humanistic',
    type: 'tf',
    question: 'Η Ανθρωπιστική Ψυχολογία δίνει έμφαση στη θετική ανθρώπινη φύση.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Η θετική ανάπτυξη αποτελεί βασική ιδέα.',
  },
  {
    id: 'q-human-tf-2',
    categoryId: 'humanistic',
    type: 'tf',
    question: 'Ο Maslow συνδέεται με την αυτοπραγμάτωση.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 0,
    explanation: 'Η αυτοπραγμάτωση αποτελεί βασική έννοια της θεωρίας του.',
  },
  {
    id: 'q-human-tf-3',
    categoryId: 'humanistic',
    type: 'tf',
    question: 'Στην ανθρωπιστική προσέγγιση χρησιμοποιείται ο όρος patients.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 1,
    explanation: 'Χρησιμοποιείται ο όρος clients.',
  },
  {
    id: 'q-human-tf-4',
    categoryId: 'humanistic',
    type: 'tf',
    question: 'Η Ανθρωπιστική Ψυχολογία εστιάζει κυρίως στις ασυνείδητες συγκρούσεις.',
    options: ['Σωστό', 'Λάθος'],
    correctIndex: 1,
    explanation: 'Αυτό αποτελεί έμφαση του Freud.',
  },
]

const rawHumanMcq = [
  {
    question: 'Ποιος συνδέεται με την αυτοπραγμάτωση;',
    options: ['Freud', 'Skinner', 'Maslow', 'Pavlov'],
    answer: 'Maslow',
    explanation: 'Ο Maslow ανέπτυξε την έννοια της αυτοπραγμάτωσης.',
  },
  {
    question: 'Σε τι δίνει έμφαση η Ανθρωπιστική Ψυχολογία;',
    options: ['Στην τιμωρία', 'Στη θετική ανθρώπινη φύση', 'Στο ασυνείδητο', 'Στα αντανακλαστικά'],
    answer: 'Στη θετική ανθρώπινη φύση',
    explanation: 'Η προσωπική ανάπτυξη αποτελεί βασικό στοιχείο.',
  },
  {
    question: 'Πώς αποκαλούνται οι θεραπευόμενοι στην ανθρωπιστική προσέγγιση;',
    options: ['Patients', 'Subjects', 'Clients', 'Observers'],
    answer: 'Clients',
    explanation: 'Η προσέγγιση θεωρεί τον άνθρωπο ενεργό και όχι ασθενή.',
  },
]

function normalizeMcq(raw, i) {
  const correctIndex = raw.options.indexOf(raw.answer)
  return {
    id: `q-human-mcq-${i + 1}`,
    categoryId: 'humanistic',
    type: 'mcq',
    question: raw.question,
    options: raw.options,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    explanation: raw.explanation,
  }
}

export const humanisticQuizQuestions = [...humanisticTfQuestions, ...rawHumanMcq.map(normalizeMcq)]

export const humanisticLessonQuizIds = humanisticQuizQuestions.map((q) => q.id)
